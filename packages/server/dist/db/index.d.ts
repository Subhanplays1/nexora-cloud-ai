import { Task, TaskStep, ChatMessage, Conversation, ApprovalRequest, Artifact, CustomAgent, AgentMemory } from '@nexora/shared';
export interface DatabaseService {
    init(): Promise<void>;
    listConversations(agentId?: string): Promise<Conversation[]>;
    getConversation(id: string): Promise<Conversation | null>;
    createConversation(title?: string, agentId?: string): Promise<Conversation>;
    deleteConversation(id: string): Promise<void>;
    listMessages(conversationId: string): Promise<ChatMessage[]>;
    createMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
    updateMessageContent(id: string, content: string, status?: ChatMessage['status']): Promise<void>;
    listTasks(limit?: number): Promise<Task[]>;
    getTask(id: string): Promise<Task | null>;
    createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'steps' | 'currentStepIndex' | 'progressPercent' | 'retryCount'> & {
        steps: Omit<TaskStep, 'id' | 'taskId' | 'status' | 'logs'>[];
    }): Promise<Task>;
    updateTask(id: string, updates: Partial<Task>): Promise<Task | null>;
    getInterruptedTasks(): Promise<Task[]>;
    updateTaskStep(id: string, updates: Partial<TaskStep>): Promise<TaskStep | null>;
    appendTaskStepLog(id: string, logLine: string): Promise<void>;
    listPendingApprovals(): Promise<ApprovalRequest[]>;
    createApproval(app: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>): Promise<ApprovalRequest>;
    resolveApproval(id: string, status: 'APPROVED' | 'REJECTED', respondedBy?: string, reason?: string): Promise<ApprovalRequest | null>;
    listArtifacts(taskId?: string): Promise<Artifact[]>;
    createArtifact(art: Omit<Artifact, 'id' | 'createdAt'>): Promise<Artifact>;
    getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined>;
    setSetting<T>(key: string, value: T): Promise<void>;
    listAgents(): Promise<CustomAgent[]>;
    getAgent(id: string): Promise<CustomAgent | null>;
    createAgent(agent: Omit<CustomAgent, 'createdAt' | 'updatedAt'>): Promise<CustomAgent>;
    updateAgent(id: string, updates: Partial<CustomAgent>): Promise<CustomAgent | null>;
    deleteAgent(id: string): Promise<void>;
    updateAgentMemory(id: string, memoryUpdates: Partial<AgentMemory>): Promise<AgentMemory | null>;
}
export declare const db: DatabaseService;
//# sourceMappingURL=index.d.ts.map