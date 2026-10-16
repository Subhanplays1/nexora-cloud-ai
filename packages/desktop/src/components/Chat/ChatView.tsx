import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Copy,
  RotateCcw,
  ExternalLink,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatMessage } from '@nexora/shared';

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
      // Check for SpeechRecognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Nexora Agent Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Gemini 3.8
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Natural Language Delegation & Cloud Execution</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('LIVE_ACTIVITY')}
          className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-750 text-cyan-400 border border-surface-700 transition"
        >
          <span>Open Live Activity View</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-16 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <Zap size={32} className="text-white fill-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Your AI. Your Commands. Always Working.
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
                Delegate research, scriptwriting, image generation, video production, browser tasks, and developer workspaces. Tasks persist on the cloud even after closing your app.
              </p>
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="grid grid-cols-2 gap-3 text-left pt-4">
              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Research quantum computing breakthroughs in 2026 and write a 3-minute YouTube script with thumbnail ideas'
                  )
                }
                className="p-3.5 rounded-xl bg-surface-900 hover:bg-surface-850 border border-surface-800 hover:border-cyan-500/40 text-xs transition space-y-1 group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center justify-between">
                  <span>Research & YouTube Script</span>
                  <Sparkles size={14} className="text-cyan-400" />
                </div>
                <p className="text-slate-400 text-[11px]">
                  Conduct in-depth research, draft formatted script, and propose 16:9 thumbnail concepts.
                </p>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Create three high-retention 16:9 YouTube thumbnail assets for an autonomous cloud AI video'
                  )
                }
                className="p-3.5 rounded-xl bg-surface-900 hover:bg-surface-850 border border-surface-800 hover:border-cyan-500/40 text-xs transition space-y-1 group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center justify-between">
                  <span>YouTube Thumbnail Production</span>
                  <Sparkles size={14} className="text-cyan-400" />
                </div>
                <p className="text-slate-400 text-[11px]">
                  Generate 1280x720 vector/raster thumbnails with cybernetic visual hierarchy.
                </p>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Open Hacker News in a remote browser, inspect front page items, and stream screenshots live'
                  )
                }
                className="p-3.5 rounded-xl bg-surface-900 hover:bg-surface-850 border border-surface-800 hover:border-cyan-500/40 text-xs transition space-y-1 group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center justify-between">
                  <span>Remote Browser Automation</span>
                  <Sparkles size={14} className="text-cyan-400" />
                </div>
                <p className="text-slate-400 text-[11px]">
                  Launch Playwright Chromium sandbox, navigate to target website, capture real-time frames.
                </p>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Scaffold a Node.js data processing utility, create unit tests, and verify passing output'
                  )
                }
                className="p-3.5 rounded-xl bg-surface-900 hover:bg-surface-850 border border-surface-800 hover:border-cyan-500/40 text-xs transition space-y-1 group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center justify-between">
                  <span>Developer Sandbox Execution</span>
                  <Sparkles size={14} className="text-cyan-400" />
                </div>
                <p className="text-slate-400 text-[11px]">
                  Provision isolated code workspace, run terminal commands with live streaming stdout/stderr.
                </p>
              </button>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            const linkedTask = tasks.find((t) => t.prompt === m.content || t.conversationId === m.conversationId);

            return (
              <div key={m.id} className={`flex space-x-3.5 max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                    isUser
                      ? 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                      : 'bg-gradient-to-tr from-cyan-600 to-teal-600 shadow-md shadow-cyan-600/20'
                  }`}
                >
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">{isUser ? 'You' : 'Nexora AI'}</span>
                    <span>•</span>
                    <span className="text-[10px]">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-surface-850 border border-surface-750 text-slate-100 rounded-tr-none'
                        : 'bg-surface-900 border border-surface-800 text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {m.content}
                    {m.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                    )}
                  </div>

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

                    {!isUser && linkedTask && (
                      <button
                        onClick={() => {
                          setActiveTaskId(linkedTask.id);
                          setActiveTab('LIVE_ACTIVITY');
                        }}
                        className="ml-auto text-cyan-400 hover:text-cyan-300 transition flex items-center space-x-1 font-semibold"
                      >
                        <span>View Live Execution ({linkedTask.status})</span>
                        <ExternalLink size={12} />
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
