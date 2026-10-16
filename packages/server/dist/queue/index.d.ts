import { WorkerType } from '@nexora/shared';
export type StepExecutor = (taskId: string, stepId: string, workerType: WorkerType, stepIndex: number, taskPrompt: string, stepTitle: string, inputData?: Record<string, any>) => Promise<{
    success: boolean;
    outputData?: Record<string, any>;
    error?: string;
    screenshotUrl?: string;
    terminalOutput?: string;
}>;
export declare class TaskQueueManager {
    private bullQueue?;
    private bullWorker?;
    private redisClient?;
    private isRunning;
    private isPaused;
    private stepExecutor?;
    private activeTaskIds;
    private pollInterval?;
    constructor();
    setStepExecutor(executor: StepExecutor): void;
    init(): Promise<void>;
    private setupBullWorker;
    start(): Promise<void>;
    stop(): Promise<void>;
    enqueueTask(taskId: string): Promise<void>;
    cancelTask(taskId: string): Promise<void>;
    pauseTask(taskId: string): Promise<void>;
    resumeTask(taskId: string): Promise<void>;
    emergencyStop(): Promise<void>;
    retryTask(taskId: string): Promise<void>;
    recoverInterruptedTasks(): Promise<void>;
    private processNextDbQueuedTask;
    private processTaskExecution;
}
export declare const taskQueue: TaskQueueManager;
//# sourceMappingURL=index.d.ts.map