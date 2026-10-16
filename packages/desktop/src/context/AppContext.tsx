import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Task,
  TaskStep,
  ChatMessage,
  Conversation,
  ApprovalRequest,
  WorkerInfo,
  Artifact,
  WebSocketMessage,
  ScreenshotFramePayload,
  TerminalOutputPayload,
} from '@nexora/shared';

export type NavTab = 'CHAT' | 'LIVE_ACTIVITY' | 'TASKS' | 'FILES' | 'INTEGRATIONS' | 'SETTINGS';

interface AppContextType {
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  connected: boolean;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
  messages: ChatMessage[];
  tasks: Task[];
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  activeTask: Task | null;
  latestScreenshot: ScreenshotFramePayload | null;
  screenshotHistory: ScreenshotFramePayload[];
  liveTerminalLogs: string;
  pendingApprovals: ApprovalRequest[];
  workers: WorkerInfo[];
  artifacts: Artifact[];
  // Actions
  createNewConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, executeAsTask?: boolean) => Promise<void>;
  createTaskDirectly: (prompt: string, priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL') => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => Promise<void>;
  resumeTask: (taskId: string) => Promise<void>;
  retryTask: (taskId: string) => Promise<void>;
  emergencyStop: () => Promise<void>;
  resolveApproval: (approvalId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backendUrl, setBackendUrlState] = useState<string>(() => {
    return localStorage.getItem('nexora_backend_url') || 'https://nexora-cloud-ai.onrender.com';
  });

  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('CHAT');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [latestScreenshot, setLatestScreenshot] = useState<ScreenshotFramePayload | null>(null);
  const [screenshotHistory, setScreenshotHistory] = useState<ScreenshotFramePayload[]>([]);
  const [liveTerminalLogs, setLiveTerminalLogs] = useState<string>('');
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const setBackendUrl = (url: string) => {
    localStorage.setItem('nexora_backend_url', url);
    setBackendUrlState(url);
  };

  // Helper fetch with timeout
  const apiFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const url = `${backendUrl.replace(/\/$/, '')}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    [backendUrl]
  );

  // Initial Data Fetch
  const refreshAll = useCallback(async () => {
    try {
      const [convList, taskList, approvalList, workerList, artifactList] = await Promise.all([
        apiFetch('/api/conversations').catch(() => []),
        apiFetch('/api/tasks').catch(() => []),
        apiFetch('/api/approvals').catch(() => []),
        apiFetch('/api/workers').catch(() => []),
        apiFetch('/api/artifacts').catch(() => []),
      ]);

      setConversations(convList);
      setTasks(taskList);
      setPendingApprovals(approvalList);
      setWorkers(workerList);
      setArtifacts(artifactList);

      if (convList.length > 0 && !activeConversationId) {
        setActiveConversationId(convList[0].id);
      }
      if (taskList.length > 0 && !activeTaskId) {
        setActiveTaskId(taskList[0].id);
      }
    } catch (err) {
      console.warn('[App] Error refreshing data:', err);
    }
  }, [apiFetch, activeConversationId, activeTaskId]);

  // Load messages whenever activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) return;
    apiFetch(`/api/conversations/${activeConversationId}`)
      .then((conv) => {
        setMessages(conv.messages || []);
      })
      .catch((err) => {
        console.warn('[App] Could not fetch messages for conversation:', err);
      });
  }, [activeConversationId, apiFetch]);

  // WebSocket Connection Management
  useEffect(() => {
    const wsUrl = backendUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setConnected(true);
          refreshAll();
        };

        socket.onclose = () => {
          setConnected(false);
          reconnectTimeout = setTimeout(connectWs, 2000);
        };

        socket.onerror = () => {
          setConnected(false);
        };

        socket.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            handleWsMessage(data);
          } catch (err) {
            console.error('[WS] Parse error:', err);
          }
        };
      } catch (err) {
        setConnected(false);
        reconnectTimeout = setTimeout(connectWs, 2000);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, [backendUrl, refreshAll]);

  // WebSocket Message Dispatcher
  const handleWsMessage = (msg: WebSocketMessage) => {
    const { type, payload } = msg;

    switch (type) {
      case 'TASK_CREATED':
      case 'TASK_UPDATED': {
        const task = payload as Task;
        setTasks((prev) => {
          const index = prev.findIndex((t) => t.id === task.id);
          if (index >= 0) {
            const copy = [...prev];
            copy[index] = task;
            return copy;
          }
          return [task, ...prev];
        });
        break;
      }

      case 'TASK_STEP_UPDATED': {
        const { taskId, step } = payload as { taskId: string; step: TaskStep };
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== taskId) return t;
            const updatedSteps = t.steps.map((s) => (s.id === step.id ? step : s));
            return { ...t, steps: updatedSteps };
          })
        );
        break;
      }

      case 'SCREENSHOT_FRAME': {
        const frame = payload as ScreenshotFramePayload;
        setLatestScreenshot(frame);
        setScreenshotHistory((prev) => [frame, ...prev.slice(0, 19)]);
        break;
      }

      case 'TERMINAL_OUTPUT': {
        const term = payload as TerminalOutputPayload;
        setLiveTerminalLogs((prev) => prev + term.text);
        break;
      }

      case 'APPROVAL_REQUIRED': {
        const app = payload as ApprovalRequest;
        setPendingApprovals((prev) => {
          if (prev.some((a) => a.id === app.id)) return prev;
          return [...prev, app];
        });
        break;
      }

      case 'APPROVAL_RESOLVED': {
        const resolved = payload as ApprovalRequest;
        setPendingApprovals((prev) => prev.filter((a) => a.id !== resolved.id));
        break;
      }

      case 'CHAT_STREAM_CHUNK': {
        const { conversationId, messageId, chunk } = payload;
        if (conversationId === activeConversationId) {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === messageId) {
                return { ...m, content: m.content + chunk, isStreaming: true };
              }
              return m;
            })
          );
        }
        break;
      }

      case 'CHAT_STREAM_END': {
        const { conversationId, messageId, fullContent } = payload;
        if (conversationId === activeConversationId) {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === messageId) {
                return { ...m, content: fullContent, isStreaming: false, status: 'SENT' };
              }
              return m;
            })
          );
        }
        break;
      }

      case 'WORKER_STATUS_LIST':
        setWorkers(payload as WorkerInfo[]);
        break;

      case 'ARTIFACT_CREATED':
        setArtifacts((prev) => [payload as Artifact, ...prev]);
        break;
    }
  };

  const createNewConversation = async () => {
    const conv = await apiFetch('/api/conversations', { method: 'POST' });
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(conv.id);
    setMessages([]);
  };

  const deleteConversation = async (id: string) => {
    await apiFetch(`/api/conversations/${id}`, { method: 'DELETE' });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const sendMessage = async (content: string, executeAsTask = true) => {
    let targetConvId = activeConversationId;
    if (!targetConvId) {
      const newConv = await apiFetch('/api/conversations', { method: 'POST' });
      setConversations((prev) => [newConv, ...prev]);
      targetConvId = newConv.id;
      setActiveConversationId(targetConvId);
    }

    // Optimistic user message insertion
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      conversationId: targetConvId,
      role: 'user',
      content,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };

    const tempAssistantMsg: ChatMessage = {
      id: 'temp-ast-' + Date.now(),
      conversationId: targetConvId,
      role: 'assistant',
      content: 'Planning autonomous cloud execution...',
      status: 'STREAMING',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

    const res = await apiFetch(`/api/conversations/${targetConvId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, executeAsTask }),
    });

    // Replace optimistic ids with actual DB ids
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === tempUserMsg.id) return res.userMessage;
        if (m.id === tempAssistantMsg.id) return res.assistantMessage;
        return m;
      })
    );

    // Refresh tasks to ensure the new task is selected
    setTimeout(refreshAll, 1000);
  };

  const createTaskDirectly = async (prompt: string, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL') => {
    const task = await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ prompt, priority }),
    });
    setTasks((prev) => [task, ...prev]);
    setActiveTaskId(task.id);
    setActiveTab('LIVE_ACTIVITY');
  };

  const cancelTask = async (taskId: string) => {
    await apiFetch(`/api/tasks/${taskId}/cancel`, { method: 'POST' });
  };

  const pauseTask = async (taskId: string) => {
    await apiFetch(`/api/tasks/${taskId}/pause`, { method: 'POST' });
  };

  const resumeTask = async (taskId: string) => {
    await apiFetch(`/api/tasks/${taskId}/resume`, { method: 'POST' });
  };

  const retryTask = async (taskId: string) => {
    await apiFetch(`/api/tasks/${taskId}/retry`, { method: 'POST' });
  };

  const emergencyStop = async () => {
    await apiFetch('/api/tasks/emergency-stop', { method: 'POST' });
  };

  const resolveApproval = async (approvalId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => {
    await apiFetch(`/api/approvals/${approvalId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
    setPendingApprovals((prev) => prev.filter((a) => a.id !== approvalId));
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  return (
    <AppContext.Provider
      value={{
        backendUrl,
        setBackendUrl,
        connected,
        activeTab,
        setActiveTab,
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        tasks,
        activeTaskId,
        setActiveTaskId,
        activeTask,
        latestScreenshot,
        screenshotHistory,
        liveTerminalLogs,
        pendingApprovals,
        workers,
        artifacts,
        createNewConversation,
        deleteConversation,
        sendMessage,
        createTaskDirectly,
        cancelTask,
        pauseTask,
        resumeTask,
        retryTask,
        emergencyStop,
        resolveApproval,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
