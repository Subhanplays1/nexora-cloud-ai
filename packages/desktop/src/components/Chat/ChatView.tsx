import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Copy,
  RotateCcw,
  ExternalLink,
  User,
  Sparkles,
  ArrowRight,
  Brain,
  Monitor,
  CheckCircle2,
  Loader2,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BotAvatar } from '../common/BotAvatar';

export const ChatView: React.FC = () => {
  const {
    messages,
    sendMessage,
    createNewConversation,
    setActiveTab,
    setActiveTaskId,
    tasks,
    activeAgent,
    setIsMemoryModalOpen,
  } = useApp();

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    setInput('');
    setIsSending(true);
    try {
      await sendMessage(text, true);
    } catch (err) {
      console.error('[ChatView] Error submitting message:', err);
      setInput(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
      } else {
        setTimeout(() => {
          setInput((prev) => (prev ? `${prev} Research AI trends` : 'Research AI trends in 2026'));
          setIsRecording(false);
        }, 1500);
      }
    }
  };

  const currentAgent = activeAgent;
  const memoryFactCount = currentAgent?.memory?.userFacts?.length || 0;

  return (
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-surface-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Top Banner with Active Bot Mascot & Memory Inspector Button */}
      <div className="h-14 border-b border-slate-200 dark:border-surface-800 px-6 flex items-center justify-between bg-slate-50/60 dark:bg-surface-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <BotAvatar
            shape={currentAgent?.avatarKey || 'circle'}
            color={currentAgent?.colorHex || '#3B82F6'}
            size={32}
          />
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-2">
              <span>{currentAgent?.name || 'Nexora Brain'}</span>
              {currentAgent?.isMainAgent ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/30 font-semibold">
                  Main Orchestrator
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  Custom Bot
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-sm">
              {currentAgent?.description || 'Autonomous Cloud Desktop Assistant'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons: New Chat, Memory & Live Sandbox */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => createNewConversation()}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shadow-xs cursor-pointer"
            title="Start a new chat with this bot"
          >
            <Plus size={13} />
            <span>New Chat</span>
          </button>

          <button
            onClick={() => setIsMemoryModalOpen(true)}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 transition shadow-xs cursor-pointer"
            title="Inspect persistent facts remembered about you"
          >
            <Brain size={14} className="text-indigo-500" />
            <span>Brain Memory</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono font-bold">
              {memoryFactCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('LIVE_ACTIVITY')}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shadow-xs cursor-pointer"
          >
            <Monitor size={14} />
            <span>Live Sandbox</span>
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-8 text-center space-y-6">
            <div className="flex justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center p-2 transition-transform hover:scale-105"
                style={{
                  filter: `drop-shadow(0 12px 24px ${currentAgent?.colorHex || '#3B82F6'}40)`,
                }}
              >
                <BotAvatar
                  shape={currentAgent?.avatarKey || 'circle'}
                  color={currentAgent?.colorHex || '#3B82F6'}
                  size={88}
                />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {currentAgent?.name || 'Nexora Brain'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
                {currentAgent?.description ||
                  'Your autonomous cloud assistant. Delegate research, scripts, automation, and background tasks.'}
              </p>
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left pt-2">
              {currentAgent?.isMainAgent ? (
                <>
                  <button
                    onClick={() =>
                      handleQuickPrompt(
                        'Create a bot named Night Shift that works overnight and prepares morning digests'
                      )
                    }
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-800 hover:border-cyan-500/50 text-xs transition space-y-1 shadow-xs cursor-pointer group"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-500 flex items-center justify-between">
                      <span>✨ Synthesize "Night Shift" Bot</span>
                      <Sparkles size={13} className="text-cyan-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Main agent will autonomously configure instructions, mascot, and persistent memory.
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleQuickPrompt(
                        'Create an Inbox Triage bot that sorts emails and drafts replies in my voice'
                      )
                    }
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-800 hover:border-pink-500/50 text-xs transition space-y-1 shadow-xs cursor-pointer group"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-pink-500 flex items-center justify-between">
                      <span>✨ Synthesize "Inbox Triage" Bot</span>
                      <Sparkles size={13} className="text-pink-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Creates a dedicated communication assistant that never forgets your writing style.
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleQuickPrompt(
                        'Research top AI agent frameworks in 2026 and compile a structured summary'
                      )
                    }
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-800 hover:border-cyan-500/50 text-xs transition space-y-1 shadow-xs cursor-pointer group"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-500 flex items-center justify-between">
                      <span>Deep Research Workflow</span>
                      <Sparkles size={13} className="text-cyan-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Investigates verified web sources and stores persistent outputs in Vault Keeper.
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleQuickPrompt(
                        'Launch a remote browser session, navigate to Hacker News, and capture screenshot'
                      )
                    }
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-800 hover:border-cyan-500/50 text-xs transition space-y-1 shadow-xs cursor-pointer group"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-500 flex items-center justify-between">
                      <span>Playwright Remote Sandbox</span>
                      <Sparkles size={13} className="text-cyan-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Executes isolated browser automation and streams live visual frames.
                    </p>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      handleQuickPrompt(
                        `Execute your primary function according to your memory context and instructions.`
                      )
                    }
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-800 hover:border-cyan-500/50 text-xs transition space-y-1 shadow-xs cursor-pointer group"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-500 flex items-center justify-between">
                      <span>Run Specialized Routine</span>
                      <Sparkles size={13} className="text-cyan-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Execute this bot's specialized role using its custom system instructions.
                    </p>
                  </button>

                  <button
                    onClick={() => setIsMemoryModalOpen(true)}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-800 hover:border-indigo-500/50 text-xs transition space-y-1 shadow-xs cursor-pointer group"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 flex items-center justify-between">
                      <span>Teach New Fact / Preference</span>
                      <Brain size={13} className="text-indigo-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      Add personal guidelines or project details so this bot never forgets.
                    </p>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            const linkedTask = tasks.find(
              (t) => t.prompt === m.content || t.conversationId === m.conversationId
            );

            return (
              <div
                key={m.id}
                className={`flex space-x-3.5 max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
              >
                {isUser ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white bg-gradient-to-tr from-amber-400 to-orange-500 shadow-xs font-bold text-xs">
                    SZ
                  </div>
                ) : (
                  <BotAvatar
                    shape={currentAgent?.avatarKey || 'circle'}
                    color={currentAgent?.colorHex || '#3B82F6'}
                    size={30}
                  />
                )}

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isUser ? 'Subhan Zahid' : currentAgent?.name || 'Nexora Brain'}
                    </span>
                    <span>•</span>
                    <span className="text-[10px]">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-slate-200 dark:bg-surface-850 text-slate-900 dark:text-slate-100 rounded-tr-none'
                        : 'bg-slate-50 dark:bg-surface-900 border border-slate-200/80 dark:border-surface-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs'
                    }`}
                  >
                    {m.content}
                    {m.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                    )}
                  </div>

                  {/* Task Link Card */}
                  {!isUser && linkedTask && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="text-slate-400 font-medium">Task:</span>
                        <span className="font-bold text-slate-800 dark:text-white truncate max-w-xs">
                          {linkedTask.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                            linkedTask.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                              : linkedTask.status === 'RUNNING'
                              ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 animate-pulse'
                              : 'bg-slate-200 dark:bg-surface-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {linkedTask.status}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTaskId(linkedTask.id);
                          setActiveTab('LIVE_ACTIVITY');
                        }}
                        className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center space-x-1"
                      >
                        <span>View Live</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-0.5">
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center space-x-1"
                    >
                      <Copy size={12} />
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    {isUser && (
                      <button
                        onClick={() => sendMessage(m.content, true)}
                        className="hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center space-x-1"
                      >
                        <RotateCcw size={12} />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar with Memory Indicator */}
      <div className="p-4 border-t border-slate-200 dark:border-surface-800 bg-slate-50/50 dark:bg-surface-900/40 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-1.5">
          <div className="relative rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-surface-750 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30 transition shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${currentAgent?.name || 'Nexora Brain'} (e.g. 'Create an agent for...' or delegate a task)...`}
              rows={2}
              className="w-full bg-transparent p-3.5 pr-28 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none font-sans"
            />

            <div className="absolute right-2.5 bottom-2.5 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`p-2 rounded-xl transition ${
                  isRecording
                    ? 'bg-red-500/20 text-red-500 border border-red-500/40 animate-pulse'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-800'
                }`}
                title={isRecording ? 'Stop voice recording' : 'Speak command'}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="p-2 rounded-xl text-white transition shadow-sm disabled:opacity-40 flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: currentAgent?.colorHex || '#3B82F6' }}
                title="Send command"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <button
              type="button"
              onClick={() => setIsMemoryModalOpen(true)}
              className="hover:underline flex items-center space-x-1 text-indigo-500 dark:text-indigo-400 font-semibold cursor-pointer"
            >
              <Brain size={11} />
              <span>
                {currentAgent?.name} Brain Memory: {memoryFactCount} facts stored (Never forgets)
              </span>
            </button>
            <span>Cloud Execution Active • Background Persistence</span>
          </div>
        </form>
      </div>
    </div>
  );
};
