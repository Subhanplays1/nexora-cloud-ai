import { WorkerType } from './worker.js';
export type WebSocketClientMessageType = 'SUBSCRIBE_TASK' | 'UNSUBSCRIBE_TASK' | 'CANCEL_TASK' | 'PAUSE_TASK' | 'RESUME_TASK' | 'APPROVE_ACTION' | 'REJECT_ACTION' | 'EMERGENCY_STOP' | 'SEND_PROMPT' | 'PING';
export type WebSocketServerMessageType = 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_STEP_UPDATED' | 'TASK_COMPLETED' | 'TASK_FAILED' | 'SCREENSHOT_FRAME' | 'TERMINAL_OUTPUT' | 'APPROVAL_REQUIRED' | 'APPROVAL_RESOLVED' | 'CHAT_MESSAGE_CREATED' | 'CHAT_STREAM_CHUNK' | 'CHAT_STREAM_END' | 'ARTIFACT_CREATED' | 'WORKER_STATUS_LIST' | 'SYSTEM_ALERT' | 'PONG';
export interface WebSocketMessage<T = any> {
    type: WebSocketClientMessageType | WebSocketServerMessageType;
    payload: T;
    timestamp: string;
}
export interface ScreenshotFramePayload {
    taskId: string;
    stepId: string;
    workerType: WorkerType;
    imageUrl: string;
    base64Data?: string;
    source: 'BROWSER' | 'DESKTOP' | 'SIMULATION';
    isLive: boolean;
    caption?: string;
}
export interface TerminalOutputPayload {
    taskId: string;
    stepId: string;
    workerType: WorkerType;
    stream: 'stdout' | 'stderr' | 'command';
    text: string;
}
export interface ChatStreamChunkPayload {
    conversationId: string;
    messageId: string;
    chunk: string;
    isFirst: boolean;
}
//# sourceMappingURL=events.d.ts.map