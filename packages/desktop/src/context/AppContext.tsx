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
  CustomAgent,
  CreateAgentDto,
  AgentMemory,
} from '@nexora/shared';

export type NavTab = 'CREATE_BOT' | 'CHAT' | 'LIVE_ACTIVITY' | 'TASKS' | 'FILES' | 'INTEGRATIONS' | 'SETTINGS';

interface AppContextType {
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  connected: boolean;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  conversations: Conversation[];
  agentConversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
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
  // Dynamic Agents & Persistent Memory
  agents: CustomAgent[];
  activeAgentId: string | null;
  setActiveAgentId: (id: string) => void;
  activeAgent: CustomAgent | null;
  isMemoryModalOpen: boolean;
  setIsMemoryModalOpen: (open: boolean) => void;
  createAgent: (dto: CreateAgentDto) => Promise<CustomAgent>;
  generateAgentFromPrompt: (userRequirement: string) => Promise<CustomAgent>;
  deleteAgent: (id: string) => Promise<void>;
  addAgentFact: (agentId: string, fact: string) => Promise<void>;
  removeAgentFact: (agentId: string, fact: string) => Promise<void>;
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

  // Agents state
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [activeAgentId, setActiveAgentIdState] = useState<string | null>(() => {
    return localStorage.getItem('nexora_active_agent_id') || 'main-orchestrator';
  });
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const skipNextMessageLoadRef = useRef<string | null>(null);

  const setBackendUrl = (url: string) => {
    localStorage.setItem('nexora_backend_url', url);
    setBackendUrlState(url);
  };

  const setActiveAgentId = (id: string) => {
    localStorage.setItem('nexora_active_agent_id', id);
    setActiveAgentIdState(id);
    setActiveTab('CHAT');
    // Immediately clear messages so old bot chat is never shown or flashes
    setMessages([]);

    const matchingConv = conversations.find(
      (c) => (c.agentId || 'main-orchestrator') === id
    );

    if (matchingConv) {
      setActiveConversationId(matchingConv.id);
      apiFetch(`/api/conversations/${matchingConv.id}`)
        .then((conv) => {
          setMessages(conv.messages || []);
        })
        .catch(() => {});
    } else {
      setActiveConversationId(null);
    }
  };

  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0] || null;

  // Conversations filtered for the active agent
  const agentConversations = conversations.filter(
    (c) => (c.agentId || 'main-orchestrator') === (activeAgentId || 'main-orchestrator')
  );

  // Helper fetch with timeout
  const apiFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const url = `${backendUrl.replace(/\/$/, '')}${endpoint}`;
      const method = (options.method || 'GET').toUpperCase();
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
      };

      let body = options.body;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        headers['Content-Type'] = 'application/json';
        if (body === undefined || body === null) {
          body = '{}';
        }
      }

      const res = await fetch(url, {
        ...options,
        method,
        headers,
        body,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`HTTP error ${res.status}: ${res.statusText} (${errorText})`);
      }
      return res.json();
    },
    [backendUrl]
  );

  // Initial Data Fetch
  const refreshAll = useCallback(async () => {
    try {
      const [convList, taskList, approvalList, workerList, artifactList, agentResp] = await Promise.all([
        apiFetch('/api/conversations').catch(() => []),
        apiFetch('/api/tasks').catch(() => []),
        apiFetch('/api/approvals').catch(() => []),
        apiFetch('/api/workers').catch(() => []),
        apiFetch('/api/artifacts').catch(() => []),
        apiFetch('/api/agents').catch(() => ({ agents: [] })),
      ]);

      setConversations(convList);
      setTasks(taskList);
      setPendingApprovals(approvalList);
      setWorkers(workerList);
      setArtifacts(artifactList);

      const agentList: CustomAgent[] = agentResp.agents || [];
      setAgents(agentList);

      const currentAgentId = activeAgentId || (agentList.length > 0 ? agentList[0].id : 'main-orchestrator');

      if (agentList.length > 0 && (!activeAgentId || !agentList.some((a) => a.id === activeAgentId))) {
        setActiveAgentIdState(agentList[0].id);
      }

      // Select conversation corresponding to active agent
      const agentConvs = convList.filter(
        (c: Conversation) => (c.agentId || 'main-orchestrator') === currentAgentId
      );

      if (agentConvs.length > 0) {
        if (!activeConversationId || !agentConvs.some((c: Conversation) => c.id === activeConversationId)) {
          setActiveConversationId(agentConvs[0].id);
        }
      } else {
        if (!activeConversationId || !convList.some((c: Conversation) => c.id === activeConversationId && (c.agentId || 'main-orchestrator') === currentAgentId)) {
          setActiveConversationId(null);
          setMessages([]);
        }
      }

      if (taskList.length > 0 && !activeTaskId) {
        setActiveTaskId(taskList[0].id);
      }
    } catch (err) {
      console.warn('[App] Error refreshing data:', err);
    }
  }, [apiFetch, activeConversationId, activeTaskId, activeAgentId]);

  // Load messages whenever activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) return;
    if (skipNextMessageLoadRef.current === activeConversationId) {
      skipNextMessageLoadRef.current = null;
      return;
    }
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
        const step = payload as TaskStep;
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === step.taskId) {
              const updatedSteps = [...t.steps];
              const idx = updatedSteps.findIndex((s) => s.id === step.id);
              if (idx >= 0) updatedSteps[idx] = step;
              return { ...t, steps: updatedSteps };
            }
            return t;
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

      case 'TERMINAL_STREAM': {
        const term = payload as TerminalOutputPayload;
        setLiveTerminalLogs((prev) => prev + term.chunk);
        break;
      }

      case 'APPROVAL_REQUIRED': {
        const req = payload as ApprovalRequest;
        setPendingApprovals((prev) => {
          if (prev.some((a) => a.id === req.id)) return prev;
          return [req, ...prev];
        });
        break;
      }

      case 'APPROVAL_RESOLVED': {
        const req = payload as ApprovalRequest;
        setPendingApprovals((prev) => prev.filter((a) => a.id !== req.id));
        break;
      }

      case 'CHAT_STREAM_CHUNK': {
        const chunk = payload as { messageId: string; chunk: string };
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === chunk.messageId || (m.isStreaming && m.role === 'assistant' && m.id.startsWith('temp-ast-'))) {
              const baseContent = m.id.startsWith('temp-ast-') && (m.content.includes('Thinking...') || m.content.includes('Planning'))
                ? ''
                : (m.content || '');
              return {
                ...m,
                id: chunk.messageId,
                content: baseContent + chunk.chunk,
                isStreaming: true,
              };
            }
            return m;
          })
        );
        break;
      }

      case 'CHAT_STREAM_END': {
        const end = payload as { messageId: string; fullContent: string };
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === end.messageId || (m.isStreaming && m.role === 'assistant' && m.id.startsWith('temp-ast-'))) {
              return {
                ...m,
                id: end.messageId,
                content: end.fullContent,
                isStreaming: false,
                status: 'SENT',
              };
            }
            return m;
          })
        );
        // Reload agents in case a new agent was synthesized autonomously
        apiFetch('/api/agents')
          .then((r) => setAgents(r.agents || []))
          .catch(() => {});
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

  // Agent Creation
  const createAgent = async (dto: CreateAgentDto): Promise<CustomAgent> => {
    const res = await apiFetch('/api/agents', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    const created: CustomAgent = res.agent;
    setAgents((prev) => [...prev, created]);
    setActiveAgentId(created.id);
    setActiveTab('CHAT');
    return created;
  };

  // Autonomous Agent Synthesis by Main Agent
  const generateAgentFromPrompt = async (userRequirement: string): Promise<CustomAgent> => {
    const res = await apiFetch('/api/agents/generate', {
      method: 'POST',
      body: JSON.stringify({ userRequirement }),
    });
    const created: CustomAgent = res.agent;
    setAgents((prev) => [...prev, created]);
    setActiveAgentId(created.id);
    setActiveTab('CHAT');
    return created;
  };

  const deleteAgent = async (id: string) => {
    await apiFetch(`/api/agents/${id}`, { method: 'DELETE' });
    setAgents((prev) => prev.filter((a) => a.id !== id));
    setConversations((prev) => prev.filter((c) => (c.agentId || 'main-orchestrator') !== id));
    if (activeAgentId === id) {
      setActiveAgentId('main-orchestrator');
    }
  };

  const addAgentFact = async (agentId: string, fact: string) => {
    const res = await apiFetch(`/api/agents/${agentId}/memory`, {
      method: 'POST',
      body: JSON.stringify({ fact }),
    });
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, memory: res.memory } : a))
    );
  };

  const removeAgentFact = async (agentId: string, fact: string) => {
    const res = await apiFetch(`/api/agents/${agentId}/memory`, {
      method: 'POST',
      body: JSON.stringify({ removeFact: fact }),
    });
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, memory: res.memory } : a))
    );
  };

  const createNewConversation = async () => {
    try {
      const currentAgentId = activeAgentId || 'main-orchestrator';
      const conv = await apiFetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat', agentId: currentAgentId }),
      });
      setConversations((prev) => [conv, ...prev]);
      setActiveConversationId(conv.id);
      setMessages([]);
      setActiveTab('CHAT');
    } catch (err) {
      console.error('[App] Failed to create new conversation:', err);
    }
  };

  const deleteConversation = async (id: string) => {
    await apiFetch(`/api/conversations/${id}`, { method: 'DELETE' });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const currentAgentId = activeAgentId || 'main-orchestrator';
      const remainingForAgent = conversations.filter(
        (c) => c.id !== id && (c.agentId || 'main-orchestrator') === currentAgentId
      );
      setActiveConversationId(remainingForAgent.length > 0 ? remainingForAgent[0].id : null);
      if (remainingForAgent.length === 0) setMessages([]);
    }
  };

  const sendMessage = async (content: string, executeAsTask = true) => {
    const text = content.trim();
    if (!text) return;

    try {
      let targetConvId = activeConversationId;
      const currentAgentId = activeAgent?.id || activeAgentId || 'main-orchestrator';

      if (!targetConvId) {
        const titleSnippet = text.length > 30 ? text.slice(0, 30) + '...' : text;
        const newConv = await apiFetch('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({ title: titleSnippet, agentId: currentAgentId }),
        });
        setConversations((prev) => [newConv, ...prev]);
        targetConvId = newConv.id;
        skipNextMessageLoadRef.current = targetConvId;
        setActiveConversationId(targetConvId);
      }

      const currentAgent = activeAgent;

      // Optimistic user message insertion
      const tempUserMsg: ChatMessage = {
        id: 'temp-' + Date.now(),
        conversationId: targetConvId,
        role: 'user',
        content: text,
        status: 'SENT',
        createdAt: new Date().toISOString(),
      };

      const tempAssistantMsg: ChatMessage = {
        id: 'temp-ast-' + Date.now(),
        conversationId: targetConvId,
        role: 'assistant',
        content: `[${currentAgent?.name || 'Nexora Brain'}] Thinking...`,
        status: 'STREAMING',
        isStreaming: true,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

      const res = await apiFetch(`/api/conversations/${targetConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: text,
          executeAsTask,
          agentId: currentAgent?.id || 'main-orchestrator',
        }),
      });

      // Replace optimistic ids with actual DB ids while preserving any chunks received
      if (res && res.userMessage && res.assistantMessage) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === tempUserMsg.id) return res.userMessage;
            if (m.id === tempAssistantMsg.id) {
              return {
                ...res.assistantMessage,
                content:
                  m.content && !m.content.includes('Thinking...')
                    ? m.content
                    : res.assistantMessage.content,
                isStreaming: m.isStreaming ?? res.assistantMessage.status === 'STREAMING',
              };
            }
            return m;
          })
        );
      }

      // Refresh tasks and agents to stay in sync
      setTimeout(refreshAll, 1200);
    } catch (err: any) {
      console.error('[App] Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          conversationId: activeConversationId || 'unknown',
          role: 'assistant',
          content: `⚠️ Failed to send message: ${err.message || 'Network error'}. Please try again.`,
          status: 'ERROR',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const createTaskDirectly = async (prompt: string, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL') => {
    const res = await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ prompt, priority }),
    });
    setTasks((prev) => [res.task, ...prev]);
    setActiveTaskId(res.task.id);
    setActiveTab('LIVE_ACTIVITY');
  };

  const cancelTask = async (taskId: string) => {
    await apiFetch(`/api/tasks/${taskId}/cancel`, { method: 'POST' });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'CANCELLED' } : t)));
  };

  const pauseTask = async (taskId: string) => {
    await apiFetch(`/api/tasks/${taskId}/pause`, { method: 'POST' });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'PAUSED' } : t)));
  };

  const resumeTask = async (taskId: string) => {
    await apiFetch(`/api/tasks/${taskId}/resume`, { method: 'POST' });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'RUNNING' } : t)));
  };

  const retryTask = async (taskId: string) => {
    await apiFetch(`/api/tasks/${taskId}/retry`, { method: 'POST' });
    refreshAll();
  };

  const emergencyStop = async () => {
    await apiFetch('/api/emergency-stop', { method: 'POST' });
    setTasks((prev) =>
      prev.map((t) =>
        t.status === 'RUNNING' || t.status === 'QUEUED' || t.status === 'WAITING_FOR_APPROVAL'
          ? { ...t, status: 'CANCELLED' }
          : t
      )
    );
  };

  const resolveApproval = async (approvalId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) => {
    await apiFetch(`/api/approvals/${approvalId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
    setPendingApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    refreshAll();
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
        agentConversations,
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
        agents,
        activeAgentId,
        setActiveAgentId,
        activeAgent,
        isMemoryModalOpen,
        setIsMemoryModalOpen,
        createAgent,
        generateAgentFromPrompt,
        deleteAgent,
        addAgentFact,
        removeAgentFact,
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
