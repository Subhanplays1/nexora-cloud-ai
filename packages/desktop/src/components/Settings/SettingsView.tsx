import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Cpu, ShieldAlert, Check, RefreshCw, Key } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { backendUrl, setBackendUrl, connected, emergencyStop } = useApp();

  const [urlInput, setUrlInput] = useState(backendUrl);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('gemini-3.8-flash');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

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

  return (
    <div className="flex-1 flex flex-col h-screen bg-surface-950 overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-surface-800 px-6 flex items-center justify-between bg-surface-900/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <SettingsIcon size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">System Settings & Configuration</h1>
            <p className="text-[11px] text-slate-400">Manage cloud backend endpoints, credentials, and models</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500 animate-ping'}`}
          />
          <span className="text-xs font-semibold text-slate-300">
            {connected ? 'Backend Online' : 'Backend Offline'}
          </span>
        </div>
      </div>

      {/* Settings Forms */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl space-y-6">
        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
            <Check size={16} />
            <span>Settings updated successfully!</span>
          </div>
        )}

        {/* Cloud Backend Endpoint */}
        <div className="p-6 rounded-2xl bg-surface-900 border border-surface-800 space-y-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-surface-850 border border-surface-750 text-cyan-400">
              <Server size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Cloud Backend API URL</h2>
              <p className="text-xs text-slate-400">
                Connect this desktop application to your local server or persistent Linux VPS
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBackend} className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:3001 or http://vps-ip:3001"
                className="flex-1 bg-surface-950 border border-surface-750 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
              >
                Connect
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Default local address is <code className="text-cyan-400">http://localhost:3001</code>. When deployed to a VPS, enter your public VPS IP or domain.
            </p>
          </form>
        </div>

        {/* Gemini Reasoning Engine Configuration */}
        <div className="p-6 rounded-2xl bg-surface-900 border border-surface-800 space-y-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-surface-850 border border-surface-750 text-indigo-400">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Google Gemini Orchestrator</h2>
              <p className="text-xs text-slate-400">
                Configure official Gemini model reasoning and task decomposition
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveApi} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Model Identifier</label>
              <select
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                className="w-full bg-surface-950 border border-surface-750 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended: Fast, agentic, 1M context)</option>
                <option value="gemini-4-argon">gemini-4-argon (Most powerful reasoning and research)</option>
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Lowest latency)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Server-Side Gemini API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter Gemini API key (kept exclusively on backend)..."
                  className="w-full bg-surface-950 border border-surface-750 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Keys are stored only on the backend server environment and never exposed to the Electron frontend.
              </p>
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
