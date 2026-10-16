import { db } from '../db/index.js';
import { taskQueue } from '../queue/index.js';
import { orchestrator } from '../orchestrator/gemini.js';
export async function taskRoutes(fastify) {
    // List tasks
    fastify.get('/api/tasks', async () => {
        return db.listTasks(100);
    });
    // Get specific task
    fastify.get('/api/tasks/:id', async (req, reply) => {
        const task = await db.getTask(req.params.id);
        if (!task) {
            return reply.status(404).send({ error: 'Task not found' });
        }
        return task;
    });
    // Create new task directly
    fastify.post('/api/tasks', async (req) => {
        const { prompt, priority = 'NORMAL' } = req.body;
        const plan = await orchestrator.planExecution(prompt);
        const task = await db.createTask({
            title: plan.taskTitle,
            prompt,
            status: 'PENDING',
            priority,
            maxRetries: 3,
            metadata: { thought: plan.thought },
            steps: plan.steps.map((s, idx) => ({
                stepIndex: idx,
                title: s.title,
                description: s.description,
                workerType: s.workerType,
                inputData: s.inputData,
            })),
        });
        await taskQueue.enqueueTask(task.id);
        return task;
    });
    // Cancel task
    fastify.post('/api/tasks/:id/cancel', async (req) => {
        await taskQueue.cancelTask(req.params.id);
        return { success: true };
    });
    // Pause task
    fastify.post('/api/tasks/:id/pause', async (req) => {
        await taskQueue.pauseTask(req.params.id);
        return { success: true };
    });
    // Resume task
    fastify.post('/api/tasks/:id/resume', async (req) => {
        await taskQueue.resumeTask(req.params.id);
        return { success: true };
    });
    // Retry task
    fastify.post('/api/tasks/:id/retry', async (req) => {
        await taskQueue.retryTask(req.params.id);
        return { success: true };
    });
    // Global emergency stop
    fastify.post('/api/tasks/emergency-stop', async () => {
        await taskQueue.emergencyStop();
        return { success: true, message: 'All tasks cancelled via emergency stop.' };
    });
}
//# sourceMappingURL=tasks.js.map