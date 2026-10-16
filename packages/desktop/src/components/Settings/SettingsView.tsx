import React, { useState, useEffect } from 'react';
import { Server, Cpu, ShieldAlert, Check, Key } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkerAvatar, WORKER_REGISTRY } from '../common/WorkerAvatar';

export const SettingsView: React.FC = () => {
  const { backendUrl, setBackendUrl, connected, emergencyStop, activeTask } = useApp();

  const [urlInput, setUrlInput] = useState(backendUrl);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('gemini-3.8-flash');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  const currentWorkerType = activeTask?.steps[activeTask.currentStepIndex]?.workerType?.toUpperCase();

  useEffect(() => {
    setUrlInput(backendUrl);
    fetch(`${backendUrl.replace(/\/$/, '')}/api/health`)
      .then((r) => r.json())
      .then(setHealthData)
      .catch(() => setHealthData(null));
  }, [backendUrl]);

  const handleSaveBackend = (e: React.FormEvent) => {
    e.preventDefault();
    setBackendUrl(urlInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSaveApi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${backendUrl.replace(/\/$/, '')}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: apiKeyInput.trim() || undefined,
          geminiModel: modelInput,
        }),
      });
      setSavedSuccess(true);
      setApiKeyInput('');
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const squadKeys = [
    'ORCHESTRATOR',
    'RESEARCH',
    'WRITING',
    'IMAGE',
    'VIDEO',
    'BROWSER',
    'DEVELOPER',
    'SOCIAL',
    'OPERATIONS',
    'FILES',
  ];

  return (
    <div className="flex-1 flex flex-col h-screen bg-surface-950 overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-surface-800 px-6 flex items-center justify-between bg-surface-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <WorkerAvatar type="OPERATIONS" size="sm" showGlow={false} />
          <div>
            <h1 className="text-sm font-bold text-white">System Settings & Configuration</h1>
            <p className="text-[11px] text-slate-400">Manage cloud backend endpoints, credentials, and models</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-fade-in">
            <Check size={14} />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      {/* Settings Form Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl space-y-6">
        {/* Autonomous Squad Roster Showcase */}
        <div className="p-6 rounded-2xl bg-surface-900/90 border border-surface-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Autonomous Agent Squad</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold font-mono">
                  10 Mascots Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Specialized agents ready to execute concurrent cloud jobs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {squadKeys.map((typeKey) => {
              const info = WORKER_REGISTRY[typeKey];
              if (!info) return null;
              const isWorking = currentWorkerType === typeKey;

              return (
                <div
                  key={typeKey}
                  className={`p-3 rounded-2xl border flex flex-col items-center text-center space-y-2 transition duration-300 ${
                    isWorking
                      ? 'bg-cyan-500/15 border-cyan-400/50 shadow-lg shadow-cyan-500/20 scale-102 ring-1 ring-cyan-400/50'
                      : 'bg-surface-850/70 border-surface-750/50 hover:bg-surface-800 hover:border-surface-650'
                  }`}
                >
                  <WorkerAvatar
                    type={typeKey}
                    size="md"
                    status={isWorking ? 'BUSY' : undefined}
                    showGlow={isWorking}
                  />
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">{info.name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono font-semibold uppercase mt-0.5">
                      {info.type}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {info.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Backend Cloud URL Config */}
        <div className="p-6 rounded-2xl bg-surface-900 border border-surface-800 space-y-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Server size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Cloud Orchestrator Endpoint</h2>
              <p className="text-xs text-slate-400">
                Specify the remote URL of your deployed Fastify backend (e.g. Render, VPS, or localhost)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBackend} className="space-y-3">
            <div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://nexora-cloud-ai.onrender.com"
                className="w-full bg-surface-950 border border-surface-750 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500'
                  }`}
                />
                <span>Status: {connected ? 'Online and connected' : 'Connecting / Offline'}</span>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-cyan-600/20"
              >
                Apply Backend URL
              </button>
            </div>
          </form>
        </div>

        {/* Gemini Engine & Model Selection */}
        <div className="p-6 rounded-2xl bg-surface-900 border border-surface-800 space-y-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Intelligence Engine</h2>
              <p className="text-xs text-slate-400">
                Configured to use Google Gemini 3.8 Flash / Pro for rapid planning and multimodal execution
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveApi} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Model Selector</label>
                <select
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <Key size={13} />
                  <span>Custom GEMINI_API_KEY (Optional Override)</span>
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Leave blank to use server environment key"
                  className="w-full bg-surface-950 border border-surface-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold transition"
            >
              Update AI Engine
            </button>
          </form>
        </div>

        {/* Live Subsystem Health Metrics */}
        {healthData && (
          <div className="p-6 rounded-2xl bg-surface-900 border border-surface-800 space-y-3 shadow-lg">
            <h2 className="text-sm font-bold text-white">Live Subsystem Health</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-850 border border-surface-750 flex items-center justify-between">
                <span className="text-slate-400">Server Runtime:</span>
                <span className="text-emerald-400 font-bold">{healthData.services?.server?.status}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-850 border border-surface-750 flex items-center justify-between">
                <span className="text-slate-400">Database Engine:</span>
                <span className="text-emerald-400 font-bold">{healthData.services?.database?.type}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-850 border border-surface-750 flex items-center justify-between">
                <span className="text-slate-400">Task Queue:</span>
                <span className="text-cyan-400 font-bold">{healthData.services?.queue?.mode}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-850 border border-surface-750 flex items-center justify-between">
                <span className="text-slate-400">Specialized Workers:</span>
                <span className="text-slate-200 font-bold">{healthData.services?.workers?.count} Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Global Safety & Emergency Stop */}
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3 shadow-lg">
          <div className="flex items-center space-x-3 text-red-400">
            <ShieldAlert size={20} />
            <h2 className="text-sm font-bold text-white">Global Emergency Stop</h2>
          </div>
          <p className="text-xs text-slate-400">
            Immediately terminate all active cloud worker jobs, cancel running Playwright browser sessions, and halt pending actions across all connected instances.
          </p>
          <button
            onClick={emergencyStop}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md shadow-red-600/30"
          >
            Trigger Global Emergency Stop
          </button>
        </div>
      </div>
    </div>
  );
};
