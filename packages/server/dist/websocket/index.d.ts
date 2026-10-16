import { WebSocket } from 'ws';
import { WebSocketServerMessageType, ScreenshotFramePayload, TerminalOutputPayload, ChatStreamChunkPayload, Task, TaskStep, ApprovalRequest, WorkerInfo } from '@nexora/shared';
export type TaskActionHandler = (action: 'CANCEL' | 'PAUSE' | 'RESUME' | 'EMERGENCY_STOP', taskId?: string) => Promise<void>;
export type ApprovalActionHandler = (approvalId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;
export declare class WebSocketGateway {
    private clients;
    private taskSubscriptions;
    private onTaskAction?;
    private onApprovalAction?;
    registerClient(ws: WebSocket): void;
    setTaskActionHandler(handler: TaskActionHandler): void;
    setApprovalActionHandler(handler: ApprovalActionHandler): void;
    private handleClientMessage;
    broadcast<T>(type: WebSocketServerMessageType, payload: T): void;
    broadcastToTaskSubscribers<T>(taskId: string, type: WebSocketServerMessageType, payload: T): void;
    private sendToClient;
    emitTaskUpdated(task: Task): void;
    emitTaskStepUpdated(taskId: string, step: TaskStep): void;
    emitScreenshotFrame(frame: ScreenshotFramePayload): void;
    emitTerminalOutput(term: TerminalOutputPayload): void;
    emitApprovalRequired(approval: ApprovalRequest): void;
    emitApprovalResolved(approval: ApprovalRequest): void;
    emitChatStreamChunk(chunk: ChatStreamChunkPayload): void;
    emitChatStreamEnd(conversationId: string, messageId: string, fullContent: string): void;
    emitWorkerStatuses(workers: WorkerInfo[]): void;
}
export declare const wsGateway: WebSocketGateway;
//# sourceMappingURL=index.d.ts.map