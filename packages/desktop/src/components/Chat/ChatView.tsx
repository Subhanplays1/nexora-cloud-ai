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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkerAvatar, WORKER_REGISTRY } from '../common/WorkerAvatar';

export const ChatView: React.FC = () => {
  const { messages, sendMessage, setActiveTab, setActiveTaskId, tasks } = useApp();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim(), true);
    setInput('');
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

  return (
    <div className="flex-1 flex flex-col h-screen bg-surface-950 overflow-hidden">
      {/* Top Banner */}
      <div className="h-14 border-b border-surface-800 px-6 flex items-center justify-between bg-surface-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <WorkerAvatar type="ORCHESTRATOR" size="sm" showGlow={false} />
          <div>
            <h1 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Nexora Agent Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                Gemini 3.8
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Natural Language Delegation & Cloud Execution</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('LIVE_ACTIVITY')}
          className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-750 text-cyan-400 border border-surface-700 transition shadow-sm"
        >
          <span>Open Live Sandbox</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-8 text-center space-y-6">
            <div className="flex justify-center">
              <WorkerAvatar type="ORCHESTRATOR" size="xl" showGlow={true} className="animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Your AI. Your Commands. Always Working.
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
                Delegate research, scripts, graphics, video production, browser tasks, and developer workspaces. Your 10 autonomous agents execute on persistent cloud workers.
              </p>
            </div>

            {/* Quick Action Suggestion Chips with Mascot Badges */}
            <div className="grid grid-cols-2 gap-3.5 text-left pt-2">
              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Research quantum computing breakthroughs in 2026 and write a 3-minute YouTube script with thumbnail ideas'
                  )
                }
                className="p-3.5 rounded-2xl bg-surface-900/90 hover:bg-surface-850 border border-surface-800 hover:border-cyan-500/40 text-xs transition space-y-2 group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <WorkerAvatar type="RESEARCH" size="sm" showGlow={false} />
                    <WorkerAvatar type="WRITING" size="sm" showGlow={false} />
                  </div>
                  <Sparkles size={14} className="text-cyan-400 group-hover:rotate-12 transition" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-cyan-300">
                    Deep Research & YouTube Script
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Inspector Neo investigates sources; Scribe Pixel drafts formatted production script.
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Create three high-retention 16:9 YouTube thumbnail assets for an autonomous cloud AI video'
                  )
                }
                className="p-3.5 rounded-2xl bg-surface-900/90 hover:bg-surface-850 border border-surface-800 hover:border-emerald-500/40 text-xs transition space-y-2 group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <WorkerAvatar type="IMAGE" size="sm" showGlow={false} />
                    <WorkerAvatar type="VIDEO" size="sm" showGlow={false} />
                  </div>
                  <Sparkles size={14} className="text-emerald-400 group-hover:rotate-12 transition" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-emerald-300">
                    16:9 YouTube Thumbnail Production
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Palette Nova renders 1280x720 graphic cards with cybernetic typography.
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Open Hacker News in a remote browser, inspect front page items, and stream screenshots live'
                  )
                }
                className="p-3.5 rounded-2xl bg-surface-900/90 hover:bg-surface-850 border border-surface-800 hover:border-amber-500/40 text-xs transition space-y-2 group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <WorkerAvatar type="BROWSER" size="sm" showGlow={false} />
                  <Sparkles size={14} className="text-amber-400 group-hover:rotate-12 transition" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-amber-300">
                    Remote Browser Automation
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Scout Dash drives Playwright Chromium, navigating live and capturing frames.
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Scaffold a Node.js data processing utility, create unit tests, and verify passing output'
                  )
                }
                className="p-3.5 rounded-2xl bg-surface-900/90 hover:bg-surface-850 border border-surface-800 hover:border-cyan-400/40 text-xs transition space-y-2 group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <WorkerAvatar type="DEVELOPER" size="sm" showGlow={false} />
                    <WorkerAvatar type="OPERATIONS" size="sm" showGlow={false} />
                  </div>
                  <Sparkles size={14} className="text-cyan-400 group-hover:rotate-12 transition" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-cyan-300">
                    Developer Sandbox Execution
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Code Spark generates code files and tests; Gear Bolt executes terminal pipelines.
                  </p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            const linkedTask = tasks.find(
              (t) => t.prompt === m.content || t.conversationId === m.conversationId
            );

            return (
              <div key={m.id} className={`flex space-x-3.5 max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                {isUser ? (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md">
                    <User size={16} />
                  </div>
                ) : (
                  <WorkerAvatar type="ORCHESTRATOR" size="sm" showGlow={true} />
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'You' : 'Nexora AI (Orchestrator)'}
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
                        ? 'bg-surface-850 border border-surface-750 text-slate-100 rounded-tr-none'
                        : 'bg-surface-900 border border-surface-800 text-slate-200 rounded-tl-none shadow-md'
                    }`}
                  >
                    {m.content}
                    {m.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                    )}
                  </div>

                  {/* If there is a linked task, show worker progress badges */}
                  {!isUser && linkedTask && (
                    <div className="p-3 rounded-xl bg-surface-900/90 border border-surface-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 font-medium">Task:</span>
                        <span className="text-white font-bold truncate max-w-xs">
                          {linkedTask.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                            linkedTask.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : linkedTask.status === 'RUNNING'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                              : 'bg-surface-800 text-slate-300'
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
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 transition"
                      >
                        <span>Inspect Sandbox</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-0.5">
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="hover:text-slate-200 transition flex items-center space-x-1"
                    >
                      <Copy size={12} />
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    {isUser && (
                      <button
                        onClick={() => sendMessage(m.content, true)}
                        className="hover:text-slate-200 transition flex items-center space-x-1"
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

      {/* Input Bar */}
      <div className="p-4 border-t border-surface-800 bg-surface-900/40 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl bg-surface-900 border border-surface-750 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 transition shadow-lg">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Delegate a task (e.g. 'Research quantum computing and write a YouTube script')..."
              rows={2}
              className="w-full bg-transparent p-3.5 pr-28 text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none font-sans"
            />

            <div className="absolute right-2.5 bottom-2.5 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`p-2 rounded-xl transition ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
                }`}
                title={isRecording ? 'Stop voice recording' : 'Speak command'}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white transition shadow-md shadow-cyan-600/20"
                title="Send and execute autonomously"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            Tasks execute independently on remote cloud workers. Closing this window will not stop running jobs.
          </p>
        </form>
      </div>
    </div>
  );
};
