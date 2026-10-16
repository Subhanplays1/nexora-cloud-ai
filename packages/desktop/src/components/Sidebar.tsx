import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Activity,
  CheckSquare,
  FolderOpen,
  Settings,
  ShieldAlert,
  Brain,
  Monitor,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkerAvatar } from './common/WorkerAvatar';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    agents,
    activeAgentId,
    setActiveAgentId,
    deleteAgent,
    setIsMemoryModalOpen,
    tasks,
    connected,
    emergencyStop,
  } = useApp();

  const [collapsed, setCollapsed] = useState(false);

  const runningTaskCount = tasks.filter(
    (t) => t.status === 'RUNNING' || t.status === 'QUEUED'
  ).length;

  const customAgents = agents.filter((a) => !a.isMainAgent);
  const mainAgent = agents.find((a) => a.isMainAgent) || agents[0];

  return (
    <aside
      className={`h-screen flex flex-col bg-slate-100/90 dark:bg-surface-900 border-r border-slate-200 dark:border-surface-750 transition-all duration-300 font-sans select-none ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Header with macOS Window Controls */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200/60 dark:border-surface-800">
        <div className="flex items-center space-x-2">
          {/* macOS window dots */}
          <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-xs inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-xs inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-xs inline-block" />
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Prominent "Create your first Bot" Button (Matching Screenshot) */}
      <div className="p-3">
        <button
          onClick={() => setActiveTab('CREATE_BOT')}
          className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 shadow-sm cursor-pointer ${
            activeTab === 'CREATE_BOT'
              ? 'bg-slate-200 dark:bg-surface-800 text-slate-900 dark:text-white font-bold ring-2 ring-cyan-500/30'
              : 'bg-slate-200/70 dark:bg-surface-850 hover:bg-slate-200 dark:hover:bg-surface-800 text-slate-700 dark:text-slate-200 font-semibold'
          } ${collapsed ? 'justify-center px-0' : ''}`}
          title="Create a new autonomous Bot"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Plus size={16} />
          </div>
          {!collapsed && (
            <span className="text-sm truncate">
              {customAgents.length === 0 ? 'Create your first Bot' : 'Create New Bot'}
            </span>
          )}
        </button>
      </div>

      {/* Main Agent (Nexora Brain Orchestrator) */}
      {mainAgent && !collapsed && (
        <div className="px-3 pt-1 pb-2">
          <div
            onClick={() => setActiveAgentId(mainAgent.id)}
            className={`flex items-center space-x-3 px-3 py-2 rounded-2xl cursor-pointer transition ${
              activeAgentId === mainAgent.id && activeTab === 'CHAT'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 font-bold shadow-sm'
                : 'hover:bg-slate-200/50 dark:hover:bg-surface-850 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center p-0.5 text-white flex-shrink-0 shadow-xs"
              style={{ backgroundColor: mainAgent.colorHex || '#3B82F6' }}
            >
              <WorkerAvatar type={mainAgent.avatarKey} size="xs" showGlow={false} />
            </div>

            <div className="flex-1 truncate text-left">
              <div className="text-xs font-bold leading-tight flex items-center space-x-1.5">
                <span>{mainAgent.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-500 font-mono font-bold">
                  MAIN
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">Bot Architect & Planner</div>
            </div>
          </div>
        </div>
      )}

      {/* Middle Section: Dynamic Bots List or "No chats yet" */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {!collapsed && customAgents.length > 0 && (
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-2 pt-2 pb-1">
            Your Custom Bots ({customAgents.length})
          </div>
        )}

        {customAgents.map((bot) => {
          const isSelected = activeAgentId === bot.id && activeTab === 'CHAT';

          return (
            <div
              key={bot.id}
              onClick={() => setActiveAgentId(bot.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-2xl cursor-pointer transition ${
                isSelected
                  ? 'bg-slate-200 dark:bg-surface-800 text-slate-900 dark:text-white font-bold shadow-sm ring-1 ring-cyan-500/40'
                  : 'hover:bg-slate-200/60 dark:hover:bg-surface-850 text-slate-700 dark:text-slate-300'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={`${bot.name}: ${bot.description}`}
            >
              <div className="flex items-center space-x-3 truncate">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center p-0.5 text-white flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: bot.colorHex }}
                >
                  <WorkerAvatar type={bot.avatarKey} size="xs" showGlow={false} />
                </div>

                {!collapsed && (
                  <div className="truncate text-left">
                    <div className="text-xs font-bold truncate leading-tight">{bot.name}</div>
                    <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                      {bot.description || 'Specialized bot'}
                    </div>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAgent(bot.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                  title="Delete bot"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}

        {/* Empty state: "No chats yet" matching screenshot */}
        {!collapsed && customAgents.length === 0 && (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4">
            <span className="text-sm font-medium text-slate-400 dark:text-slate-400">
              No chats yet
            </span>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
              Click "+ Create your first Bot" above or ask the Main Agent to build one for you.
            </p>
          </div>
        )}
      </div>

      {/* Cloud Subsystem Quick Bar (Live Activity, Tasks, Settings) */}
      <div className="px-3 py-2 border-t border-slate-200/60 dark:border-surface-800 space-y-0.5">
        <button
          onClick={() => setActiveTab('LIVE_ACTIVITY')}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'LIVE_ACTIVITY'
              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-surface-850'
          }`}
          title="Live Remote Sandbox"
        >
          <div className="flex items-center space-x-2.5">
            <Monitor size={15} />
            {!collapsed && <span>Live Sandbox</span>}
          </div>
          {!collapsed && runningTaskCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('TASKS')}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'TASKS'
              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-surface-850'
          }`}
          title="Task Queue"
        >
          <div className="flex items-center space-x-2.5">
            <CheckSquare size={15} />
            {!collapsed && <span>Tasks Queue</span>}
          </div>
          {!collapsed && (
            <span className="text-[10px] text-slate-400 font-mono">{tasks.length}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'SETTINGS'
              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-surface-850'
          }`}
          title="Settings"
        >
          <Settings size={15} />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>

      {/* Bottom User Profile Section (Matching Screenshot) */}
      <div className="p-3 border-t border-slate-200/60 dark:border-surface-800 bg-slate-50/50 dark:bg-surface-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 truncate">
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-xs shadow-xs flex-shrink-0">
              SZ
            </div>

            {!collapsed && (
              <div className="truncate text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Subhan Zahid
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      connected ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                  <span>{connected ? 'Cloud Connected' : 'Connecting...'}</span>
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={emergencyStop}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
              title="Global Emergency Stop"
            >
              <ShieldAlert size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
