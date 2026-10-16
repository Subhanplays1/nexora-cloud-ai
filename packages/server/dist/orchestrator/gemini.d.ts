import { WorkerType } from '@nexora/shared';
export interface PlannedTask {
    title: string;
    workerType: WorkerType;
    description: string;
    inputData?: Record<string, any>;
}
export interface PlanResult {
    thought: string;
    taskTitle: string;
    steps: PlannedTask[];
    conversationalReply: string;
}
export declare class GeminiOrchestrator {
    private client?;
    constructor();
    isConfigured(): boolean;
    updateApiKey(newKey: string): void;
    private getCandidateModels;
    planExecution(userPrompt: string, history?: {
        role: string;
        content: string;
    }[]): Promise<PlanResult>;
    private planWithGemini;
    private planWithHeuristics;
    generateRawContent(prompt: string): Promise<string>;
    streamConversationalResponse(userMessage: string, history: {
        role: string;
        content: string;
    }[], onChunk: (chunk: string) => void, agentContext?: {
        name?: string;
        systemPrompt?: string;
        memoryFacts?: string[];
        instructions?: string[];
    }): Promise<string>;
}
export declare const orchestrator: GeminiOrchestrator;
export declare const geminiOrchestrator: GeminiOrchestrator;
//# sourceMappingURL=gemini.d.ts.map