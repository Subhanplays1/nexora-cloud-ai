import React from 'react';
import { WorkerAvatar, WORKER_REGISTRY } from './WorkerAvatar';
import { useApp } from '../../context/AppContext';

export const WorkerTeamBar: React.FC = () => {
  const { activeTask, setActiveTab } = useApp();

  const currentWorkerType = activeTask?.steps[activeTask.currentStepIndex]?.workerType?.toUpperCase();

  const rosterOrder = [
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
    <div className="bg-surface-900/80 border-b border-surface-800/80 px-4 py-2 backdrop-blur-xl flex items-center justify-between overflow-hidden">
      <div className="flex items-center space-x-2.5 flex-shrink-0 mr-4">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Squad</span>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold font-mono">
          10 Agents
        </span>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto py-0.5 no-scrollbar flex-1 justify-start md:justify-end">
        {rosterOrder.map((typeKey) => {
          const info = WORKER_REGISTRY[typeKey];
          if (!info) return null;
          const isWorking = currentWorkerType === typeKey;

          return (
            <div
              key={typeKey}
              onClick={() => setActiveTab('LIVE_ACTIVITY')}
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer flex-shrink-0 group ${
                isWorking
                  ? 'bg-cyan-500/15 border-cyan-400/60 shadow-lg shadow-cyan-500/20 scale-105 ring-1 ring-cyan-400/50'
                  : 'bg-surface-850/60 border-surface-750/50 hover:bg-surface-800 hover:border-surface-600 hover:scale-102'
              }`}
              title={`${info.name} — ${info.title} (${isWorking ? 'ACTIVE ON JOB' : 'READY'})`}
            >
              <WorkerAvatar
                type={typeKey}
                size="sm"
                status={isWorking ? 'BUSY' : undefined}
                showGlow={isWorking}
              />
              <div className="text-left hidden lg:block">
                <div className="text-[11px] font-bold text-slate-200 leading-tight flex items-center space-x-1">
                  <span>{info.name}</span>
                  {isWorking && (
                    <span className="text-[9px] px-1 rounded bg-cyan-400 text-surface-950 font-extrabold animate-pulse">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-slate-400 leading-tight truncate max-w-[110px]">
                  {info.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
