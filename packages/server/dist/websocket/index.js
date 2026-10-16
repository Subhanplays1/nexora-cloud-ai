import { WebSocket } from 'ws';
export class WebSocketGateway {
    clients = new Set();
    taskSubscriptions = new Map();
    onTaskAction;
    onApprovalAction;
    registerClient(ws) {
        this.clients.add(ws);
        ws.on('message', async (data) => {
            try {
                const msg = JSON.parse(data.toString());
                await this.handleClientMessage(ws, msg);
            }
            catch (err) {
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
    setTaskActionHandler(handler) {
        this.onTaskAction = handler;
    }
    setApprovalActionHandler(handler) {
        this.onApprovalAction = handler;
    }
    async handleClientMessage(ws, msg) {
        const { type, payload } = msg;
        switch (type) {
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
                    this.taskSubscriptions.get(taskId).add(ws);
                }
                break;
            }
            case 'UNSUBSCRIBE_TASK': {
                const taskId = payload?.taskId;
                if (taskId && this.taskSubscriptions.has(taskId)) {
                    this.taskSubscriptions.get(taskId).delete(ws);
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
    broadcast(type, payload) {
        const message = {
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
    broadcastToTaskSubscribers(taskId, type, payload) {
        // Send to global subscribers as well as task specific subscribers
        const message = {
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
    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    // Domain Event Emitters
    emitTaskUpdated(task) {
        this.broadcastToTaskSubscribers(task.id, 'TASK_UPDATED', task);
    }
    emitTaskStepUpdated(taskId, step) {
        this.broadcastToTaskSubscribers(taskId, 'TASK_STEP_UPDATED', { taskId, step });
    }
    emitScreenshotFrame(frame) {
        this.broadcastToTaskSubscribers(frame.taskId, 'SCREENSHOT_FRAME', frame);
    }
    emitTerminalOutput(term) {
        this.broadcastToTaskSubscribers(term.taskId, 'TERMINAL_OUTPUT', term);
    }
    emitApprovalRequired(approval) {
        this.broadcastToTaskSubscribers(approval.taskId, 'APPROVAL_REQUIRED', approval);
    }
    emitApprovalResolved(approval) {
        this.broadcastToTaskSubscribers(approval.taskId, 'APPROVAL_RESOLVED', approval);
    }
    emitChatStreamChunk(chunk) {
        this.broadcast('CHAT_STREAM_CHUNK', chunk);
    }
    emitChatStreamEnd(conversationId, messageId, fullContent) {
        this.broadcast('CHAT_STREAM_END', { conversationId, messageId, fullContent });
    }
    emitWorkerStatuses(workers) {
        this.broadcast('WORKER_STATUS_LIST', workers);
    }
}
export const wsGateway = new WebSocketGateway();
//# sourceMappingURL=index.js.map