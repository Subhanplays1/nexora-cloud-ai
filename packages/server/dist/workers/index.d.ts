import { WorkerType, WorkerInfo } from '@nexora/shared';
export declare class WorkerPoolCoordinator {
    private workers;
    constructor();
    private initWorkers;
    getWorkerInfos(): WorkerInfo[];
    setWorkerStatus(type: WorkerType, status: WorkerInfo['status'], currentTaskId?: string): void;
    executeStep(taskId: string, stepId: string, workerType: WorkerType, stepIndex: number, taskPrompt: string, stepTitle: string, inputData?: Record<string, any>): Promise<{
        success: boolean;
        outputData?: Record<string, any>;
        error?: string;
        screenshotUrl?: string;
        terminalOutput?: string;
    }>;
}
export declare const workerPool: WorkerPoolCoordinator;
//# sourceMappingURL=index.d.ts.map