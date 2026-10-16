import { Queue, Worker as BullWorker } from 'bullmq';
import { Redis } from 'ioredis';
import { db } from '../db/index.js';
import { wsGateway } from '../websocket/index.js';
import { config } from '../config/env.js';
export class TaskQueueManager {
    bullQueue;
    bullWorker;
    redisClient;
    isRunning = false;
    isPaused = false;
    stepExecutor;
    activeTaskIds = new Set();
    pollInterval;
    constructor() { }
    setStepExecutor(executor) {
        this.stepExecutor = executor;
    }
    async init() {
        if (config.redisUrl) {
            try {
                console.log('[Queue] Attempting connection to Redis at:', config.redisUrl);
                this.redisClient = new Redis(config.redisUrl, {
                    maxRetriesPerRequest: null,
                    connectTimeout: 3000,
                    retryStrategy(times) {
                        if (times > 3)
                            return null; // Fallback to DB queue
                        return Math.min(times * 500, 2000);
                    },
                });
                await new Promise((resolve, reject) => {
                    this.redisClient.on('ready', () => {
                        console.log('[Queue] Redis connection established.');
                        resolve();
                    });
                    this.redisClient.on('error', (err) => {
                        console.warn('[Queue] Redis error, falling back to persistent DB queue engine:', err.message);
                        resolve();
                    });
                });
                if (this.redisClient.status === 'ready') {
                    this.bullQueue = new Queue('nexora-tasks', { connection: this.redisClient });
                    this.setupBullWorker();
                    console.log('[Queue] BullMQ Redis queue activated.');
                    return;
                }
            }
            catch (err) {
                console.warn('[Queue] Could not initialize BullMQ Redis queue, falling back to durable DB queue:', err);
            }
        }
        console.log('[Queue] Using built-in durable DB-backed task queue engine.');
    }
    setupBullWorker() {
        if (!this.redisClient)
            return;
        this.bullWorker = new BullWorker('nexora-tasks', async (job) => {
            const { taskId } = job.data;
            await this.processTaskExecution(taskId);
        }, { connection: this.redisClient, concurrency: 3 });
        this.bullWorker.on('failed', (job, err) => {
            console.error(`[Queue] BullMQ job ${job?.id} failed:`, err);
        });
    }
    async start() {
        this.isRunning = true;
        this.isPaused = false;
        // Recover any tasks that were running or queued when server restarted
        await this.recoverInterruptedTasks();
        // Start DB queue poller for non-Redis environments
        if (!this.bullQueue) {
            this.pollInterval = setInterval(async () => {
                if (!this.isPaused && this.isRunning) {
                    await this.processNextDbQueuedTask();
                }
            }, 1000);
        }
    }
    async stop() {
        this.isRunning = false;
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        if (this.bullWorker) {
            await this.bullWorker.close();
        }
        if (this.bullQueue) {
            await this.bullQueue.close();
        }
        if (this.redisClient) {
            this.redisClient.disconnect();
        }
    }
    async enqueueTask(taskId) {
        await db.updateTask(taskId, { status: 'QUEUED' });
        const task = await db.getTask(taskId);
        if (task) {
            wsGateway.emitTaskUpdated(task);
        }
        if (this.bullQueue) {
            await this.bullQueue.add('execute-task', { taskId }, {
                priority: task?.priority === 'CRITICAL' ? 1 : task?.priority === 'HIGH' ? 2 : 3,
                attempts: (task?.maxRetries ?? 3) + 1,
                backoff: { type: 'exponential', delay: 2000 },
            });
        }
    }
    async cancelTask(taskId) {
        console.log(`[Queue] Cancelling task ${taskId}`);
        this.activeTaskIds.delete(taskId);
        const updated = await db.updateTask(taskId, {
            status: 'CANCELLED',
            completedAt: new Date().toISOString(),
            error: 'Task was cancelled by user.',
        });
        if (updated) {
            wsGateway.emitTaskUpdated(updated);
        }
    }
    async pauseTask(taskId) {
        console.log(`[Queue] Pausing task ${taskId}`);
        this.activeTaskIds.delete(taskId);
        const updated = await db.updateTask(taskId, { status: 'WAITING_FOR_APPROVAL' });
        if (updated) {
            wsGateway.emitTaskUpdated(updated);
        }
    }
    async resumeTask(taskId) {
        console.log(`[Queue] Resuming task ${taskId}`);
        const task = await db.getTask(taskId);
        if (task && (task.status === 'WAITING_FOR_APPROVAL' || task.status === 'RETRYING')) {
            await this.enqueueTask(taskId);
        }
    }
    async emergencyStop() {
        console.warn('[Queue] EMERGENCY STOP triggered. Terminating all running tasks.');
        this.isPaused = true;
        for (const taskId of this.activeTaskIds) {
            await this.cancelTask(taskId);
        }
        this.activeTaskIds.clear();
        wsGateway.broadcast('SYSTEM_ALERT', {
            level: 'CRITICAL',
            message: 'Global emergency stop executed. All ongoing tasks cancelled.',
        });
    }
    async retryTask(taskId) {
        const task = await db.getTask(taskId);
        if (!task)
            return;
        await db.updateTask(taskId, {
            status: 'QUEUED',
            retryCount: task.retryCount + 1,
            error: undefined,
        });
        await this.enqueueTask(taskId);
    }
    async recoverInterruptedTasks() {
        console.log('[Queue] Checking for interrupted tasks after restart...');
        const interrupted = await db.getInterruptedTasks();
        if (interrupted.length > 0) {
            console.log(`[Queue] Recovering ${interrupted.length} interrupted tasks:`, interrupted.map((t) => t.id));
            for (const t of interrupted) {
                await db.appendTaskStepLog(t.steps[t.currentStepIndex]?.id || t.id, `[System] Server restarted. Task execution automatically restored from checkpoint at step ${t.currentStepIndex + 1}.`);
                await this.enqueueTask(t.id);
            }
        }
    }
    async processNextDbQueuedTask() {
        if (this.activeTaskIds.size >= 3)
            return; // concurrency limit 3
        const tasks = await db.listTasks(50);
        const nextTask = tasks.find((t) => t.status === 'QUEUED');
        if (!nextTask)
            return;
        await this.processTaskExecution(nextTask.id);
    }
    async processTaskExecution(taskId) {
        const task = await db.getTask(taskId);
        if (!task || task.status === 'CANCELLED')
            return;
        this.activeTaskIds.add(taskId);
        const startTime = new Date().toISOString();
        await db.updateTask(taskId, {
            status: 'RUNNING',
            startedAt: task.startedAt || startTime,
        });
        let current = (await db.getTask(taskId));
        wsGateway.emitTaskUpdated(current);
        console.log(`[Queue] Executing task "${current.title}" (${taskId}), steps: ${current.steps.length}`);
        try {
            for (let i = current.currentStepIndex; i < current.steps.length; i++) {
                // Re-check if cancelled or paused during execution
                const check = await db.getTask(taskId);
                if (!check || check.status === 'CANCELLED') {
                    console.log(`[Queue] Task ${taskId} was cancelled. Stopping execution.`);
                    this.activeTaskIds.delete(taskId);
                    return;
                }
                if (check.status === 'WAITING_FOR_APPROVAL') {
                    console.log(`[Queue] Task ${taskId} is waiting for user approval. Pausing execution.`);
                    this.activeTaskIds.delete(taskId);
                    return;
                }
                const step = current.steps[i];
                console.log(`[Queue] Step ${i + 1}/${current.steps.length}: [${step.workerType}] ${step.title}`);
                await db.updateTask(taskId, {
                    currentStepIndex: i,
                    progressPercent: Math.round((i / current.steps.length) * 100),
                });
                await db.updateTaskStep(step.id, {
                    status: 'RUNNING',
                    startedAt: new Date().toISOString(),
                });
                const updatedStep = (await db.getTask(taskId)).steps[i];
                wsGateway.emitTaskStepUpdated(taskId, updatedStep);
                // Execute step via registered step executor
                if (this.stepExecutor) {
                    const result = await this.stepExecutor(taskId, step.id, step.workerType, i, current.prompt, step.title, step.inputData);
                    if (!result.success) {
                        // Check if step requires approval and paused
                        const stepCheck = await db.getTask(taskId);
                        if (stepCheck?.status === 'WAITING_FOR_APPROVAL') {
                            this.activeTaskIds.delete(taskId);
                            return;
                        }
                        throw new Error(result.error || `Step failed: ${step.title}`);
                    }
                    await db.updateTaskStep(step.id, {
                        status: 'COMPLETED',
                        completedAt: new Date().toISOString(),
                        outputData: result.outputData,
                        screenshotUrl: result.screenshotUrl,
                        terminalOutput: result.terminalOutput,
                    });
                    const completedStep = (await db.getTask(taskId)).steps[i];
                    wsGateway.emitTaskStepUpdated(taskId, completedStep);
                }
            }
            // Mark whole task completed
            const completionTime = new Date().toISOString();
            const completedTask = await db.updateTask(taskId, {
                status: 'COMPLETED',
                progressPercent: 100,
                completedAt: completionTime,
                resultSummary: `All ${current.steps.length} steps executed successfully.`,
            });
            if (completedTask) {
                wsGateway.emitTaskUpdated(completedTask);
                console.log(`[Queue] Task ${taskId} completed successfully!`);
            }
        }
        catch (err) {
            console.error(`[Queue] Error executing task ${taskId}:`, err);
            const isRetryable = (task.retryCount || 0) < (task.maxRetries || 3);
            if (isRetryable) {
                console.log(`[Queue] Scheduling retry for task ${taskId} (attempt ${task.retryCount + 1}/${task.maxRetries})`);
                const retryingTask = await db.updateTask(taskId, {
                    status: 'RETRYING',
                    retryCount: task.retryCount + 1,
                    error: err.message,
                });
                if (retryingTask) {
                    wsGateway.emitTaskUpdated(retryingTask);
                    setTimeout(() => this.enqueueTask(taskId), 3000);
                }
            }
            else {
                const failedTask = await db.updateTask(taskId, {
                    status: 'FAILED',
                    completedAt: new Date().toISOString(),
                    error: err.message,
                });
                if (failedTask) {
                    wsGateway.emitTaskUpdated(failedTask);
                }
            }
        }
        finally {
            this.activeTaskIds.delete(taskId);
        }
    }
}
export const taskQueue = new TaskQueueManager();
//# sourceMappingURL=index.js.map