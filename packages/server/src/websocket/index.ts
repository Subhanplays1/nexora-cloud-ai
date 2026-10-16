import { WebSocket } from 'ws';
import {
  WebSocketMessage,
  WebSocketClientMessageType,
  WebSocketServerMessageType,
  ScreenshotFramePayload,
  TerminalOutputPayload,
  ChatStreamChunkPayload,
  Task,
  TaskStep,
  ApprovalRequest,
  WorkerInfo,
} from '@nexora/shared';

export type TaskActionHandler = (action: 'CANCEL' | 'PAUSE' | 'RESUME' | 'EMERGENCY_STOP', taskId?: string) => Promise<void>;
export type ApprovalActionHandler = (approvalId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;

export class WebSocketGateway {
  private clients: Set<WebSocket> = new Set();
  private taskSubscriptions: Map<string, Set<WebSocket>> = new Map();
  private onTaskAction?: TaskActionHandler;
  private onApprovalAction?: ApprovalActionHandler;

  registerClient(ws: WebSocket): void {
    this.clients.add(ws);

    ws.on('message', async (data: string | Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as WebSocketMessage;
        await this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[WebSocket] Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      for (const subscribers of this.taskSubscriptions.values()) {
        subscribers.delete(ws);
      }
    });

    // Send initial ping/connection ack
    this.sendToClient(ws, {
      type: 'PONG',
      payload: { status: 'CONNECTED', timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }

  setTaskActionHandler(handler: TaskActionHandler): void {
    this.onTaskAction = handler;
  }

  setApprovalActionHandler(handler: ApprovalActionHandler): void {
    this.onApprovalAction = handler;
  }

  private async handleClientMessage(ws: WebSocket, msg: WebSocketMessage): Promise<void> {
    const { type, payload } = msg;

    switch (type as WebSocketClientMessageType) {
      case 'PING':
        this.sendToClient(ws, {
          type: 'PONG',
          payload: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });
        break;

      case 'SUBSCRIBE_TASK': {
        const taskId = payload?.taskId;
        if (taskId) {
          if (!this.taskSubscriptions.has(taskId)) {
            this.taskSubscriptions.set(taskId, new Set());
          }
          this.taskSubscriptions.get(taskId)!.add(ws);
        }
        break;
      }

      case 'UNSUBSCRIBE_TASK': {
        const taskId = payload?.taskId;
        if (taskId && this.taskSubscriptions.has(taskId)) {
          this.taskSubscriptions.get(taskId)!.delete(ws);
        }
        break;
      }

      case 'CANCEL_TASK':
        if (this.onTaskAction && payload?.taskId) {
          await this.onTaskAction('CANCEL', payload.taskId);
        }
        break;

      case 'PAUSE_TASK':
        if (this.onTaskAction && payload?.taskId) {
          await this.onTaskAction('PAUSE', payload.taskId);
        }
        break;

      case 'RESUME_TASK':
        if (this.onTaskAction && payload?.taskId) {
          await this.onTaskAction('RESUME', payload.taskId);
        }
        break;

      case 'EMERGENCY_STOP':
        if (this.onTaskAction) {
          await this.onTaskAction('EMERGENCY_STOP');
        }
        break;

      case 'APPROVE_ACTION':
        if (this.onApprovalAction && payload?.approvalId) {
          await this.onApprovalAction(payload.approvalId, 'APPROVED', payload.reason);
        }
        break;

      case 'REJECT_ACTION':
        if (this.onApprovalAction && payload?.approvalId) {
          await this.onApprovalAction(payload.approvalId, 'REJECTED', payload.reason);
        }
        break;
    }
  }

  broadcast<T>(type: WebSocketServerMessageType, payload: T): void {
    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    const data = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  broadcastToTaskSubscribers<T>(taskId: string, type: WebSocketServerMessageType, payload: T): void {
    // Send to global subscribers as well as task specific subscribers
    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    const data = JSON.stringify(message);

    const subscribers = this.taskSubscriptions.get(taskId);
    if (subscribers) {
      for (const client of subscribers) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      }
    }

    // Always broadcast major events to all connected clients
    for (const client of this.clients) {
      if (!subscribers?.has(client) && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  private sendToClient<T>(ws: WebSocket, message: WebSocketMessage<T>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Domain Event Emitters
  emitTaskUpdated(task: Task): void {
    this.broadcastToTaskSubscribers(task.id, 'TASK_UPDATED', task);
  }

  emitTaskStepUpdated(taskId: string, step: TaskStep): void {
    this.broadcastToTaskSubscribers(taskId, 'TASK_STEP_UPDATED', { taskId, step });
  }

  emitScreenshotFrame(frame: ScreenshotFramePayload): void {
    this.broadcastToTaskSubscribers(frame.taskId, 'SCREENSHOT_FRAME', frame);
  }

  emitTerminalOutput(term: TerminalOutputPayload): void {
    this.broadcastToTaskSubscribers(term.taskId, 'TERMINAL_OUTPUT', term);
  }

  emitApprovalRequired(approval: ApprovalRequest): void {
    this.broadcastToTaskSubscribers(approval.taskId, 'APPROVAL_REQUIRED', approval);
  }

  emitApprovalResolved(approval: ApprovalRequest): void {
    this.broadcastToTaskSubscribers(approval.taskId, 'APPROVAL_RESOLVED', approval);
  }

  emitChatStreamChunk(chunk: ChatStreamChunkPayload): void {
    this.broadcast('CHAT_STREAM_CHUNK', chunk);
  }

  emitChatStreamEnd(conversationId: string, messageId: string, fullContent: string): void {
    this.broadcast('CHAT_STREAM_END', { conversationId, messageId, fullContent });
  }

  emitWorkerStatuses(workers: WorkerInfo[]): void {
    this.broadcast('WORKER_STATUS_LIST', workers);
  }
}

export const wsGateway = new WebSocketGateway();
