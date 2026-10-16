import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { WorkerAvatar } from '../common/WorkerAvatar';

export const IntegrationsView: React.FC = () => {
  const [integrations, setIntegrations] = useState([
    {
      id: 'youtube',
      workerType: 'SOCIAL',
      name: 'YouTube Studio & Social API',
      category: 'Social Publishing & Video Channels',
      status: 'CONNECTED',
      permissions: ['Upload 16:9 videos', 'Set metadata (titles, descriptions, tags)', 'Privacy staging'],
      account: 'Authorized Channel (@nexora-creator)',
      requiresApproval: true,
    },
    {
      id: 'google-drive',
      workerType: 'FILES',
      name: 'Cloud Vault & Drive Storage',
      category: 'Cloud File Sync & Cold Storage',
      status: 'CONNECTED',
      permissions: ['Read & write export artifacts', 'Backup task results', 'Preserve run archives'],
      account: 'user@nexora.cloud',
      requiresApproval: false,
    },
    {
      id: 'gemini',
      workerType: 'ORCHESTRATOR',
      name: 'Google Gemini Pro / Flash 3.8',
      category: 'Core Autonomous Reasoning Engine',
      status: 'ACTIVE',
      permissions: ['Autonomous task decomposition', 'Tool calling', 'Conversational streaming'],
      account: 'High-throughput Cloud API Endpoint',
      requiresApproval: false,
    },
    {
      id: 'browser-sandbox',
      workerType: 'BROWSER',
      name: 'Playwright Chromium Sandbox',
      category: 'Isolated Browser Automation Runtime',
      status: 'ACTIVE',
      permissions: ['Remote web navigation', 'DOM inspection', 'Live screenshot frames'],
      account: 'Isolated Headless Worker Pool',
      requiresApproval: true,
    },
  ]);

  const toggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-surface-950 overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-surface-800 px-6 flex items-center justify-between bg-surface-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <WorkerAvatar type="SOCIAL" size="sm" showGlow={false} />
          <div>
            <h1 className="text-sm font-bold text-white">Integrations & Service Connections</h1>
            <p className="text-[11px] text-slate-400">
              Authorized OAuth pipelines and cloud service interfaces
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>Consequential mutations require human confirmation</span>
        </div>
      </div>

      {/* Grid of Integrations */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-surface-900/90 border border-surface-800 hover:border-surface-700 transition shadow-lg space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <WorkerAvatar type={item.workerType} size="md" showGlow={true} />
                    <div>
                      <h2 className="text-sm font-bold text-white">{item.name}</h2>
                      <p className="text-[11px] text-slate-400">{item.category}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      item.status === 'CONNECTED' || item.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-surface-800 text-slate-400 border border-surface-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface-850/60 border border-surface-800 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-300">Target Account / Mode:</div>
                  <div className="text-xs text-slate-400 font-mono">{item.account}</div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Authorized Scopes:
                  </div>
                  {item.permissions.map((p, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 text-slate-300 text-[11px]">
                      <CheckCircle2 size={12} className="text-cyan-400" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {item.requiresApproval ? 'Strict Approval Gate Active' : 'Automated execution permitted'}
                </span>

                <button
                  onClick={() => toggleConnection(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    item.status === 'CONNECTED'
                      ? 'bg-surface-850 hover:bg-surface-800 text-rose-400 border border-surface-750'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {item.status === 'CONNECTED' ? 'Disconnect' : 'Connect Account'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
