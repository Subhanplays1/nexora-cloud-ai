import React, { useState } from 'react';
import {
  MessageSquare,
  Activity,
  CheckSquare,
  FolderOpen,
  Share2,
  Settings,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Zap,
  Globe,
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    deleteConversation,
    tasks,
    pendingApprovals,
    connected,
    emergencyStop,
  } = useApp();

  const [collapsed, setCollapsed] = useState(false);

  const runningTaskCount = tasks.filter((t) => t.status === 'RUNNING' || t.status === 'QUEUED').length;

  const navItems: { tab: NavTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { tab: 'CHAT', label: 'Chat & Planner', icon: <MessageSquare size={18} /> },
    {
      tab: 'LIVE_ACTIVITY',
      label: 'Live Activity',
      icon: <Activity size={18} />,
      badge: runningTaskCount > 0 ? `${runningTaskCount} running` : undefined,
    },
    { tab: 'TASKS', label: 'Tasks', icon: <CheckSquare size={18} />, badge: tasks.length },
    { tab: 'FILES', label: 'Files & Artifacts', icon: <FolderOpen size={18} /> },
    { tab: 'INTEGRATIONS', label: 'Integrations', icon: <Share2 size={18} /> },
    { tab: 'SETTINGS', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside
      className={`h-screen flex flex-col bg-surface-900 border-r border-surface-750 transition-all duration-300 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand & Collapse Header */}
      <div className="p-4 flex items-center justify-between border-b border-surface-800">
        {!collapsed && (
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">NEXORA</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Autonomous Cloud Agent</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={createNewConversation}
          className={`w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20 ${
            collapsed ? 'px-0' : ''
          }`}
          title="New Task Chat"
        >
          <Plus size={18} />
          {!collapsed && <span>New Task</span>}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-surface-800 text-cyan-400 shadow-sm border border-surface-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-850'
              }`}
              title={item.label}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    typeof item.badge === 'string' && item.badge.includes('running')
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                      : 'bg-surface-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Approvals Warning Badge */}
      {pendingApprovals.length > 0 && !collapsed && (
        <div className="mx-3 my-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2 text-amber-300">
          <ShieldAlert size={16} className="text-amber-400 flex-shrink-0 animate-bounce" />
          <span className="text-xs font-medium">{pendingApprovals.length} action requires approval</span>
        </div>
      )}

      {/* Conversations History List */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 mt-4 border-t border-surface-800/80 pt-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Recent Sessions
          </div>
          <div className="space-y-1">
            {conversations.map((c) => {
              const isSelected = activeConversationId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveConversationId(c.id);
                    setActiveTab('CHAT');
                  }}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-surface-800 text-slate-100 font-medium'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-surface-850'
                  }`}
                >
                  <span className="truncate pr-2">{c.title || 'Untitled Session'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                    title="Delete session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            {conversations.length === 0 && (
              <p className="text-xs text-slate-400 px-2 py-4 italic">No past sessions</p>
            )}
          </div>
        </div>
      )}

      {/* Footer Controls: Emergency Stop & Connection Status */}
      <div className="mt-auto p-3 border-t border-surface-800 space-y-2">
        <button
          onClick={emergencyStop}
          className="w-full flex items-center justify-center space-x-2 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-semibold transition"
          title="Global Emergency Stop"
        >
          <ShieldAlert size={14} className="text-red-400" />
          {!collapsed && <span>Emergency Stop</span>}
        </button>

        <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500 animate-ping'
              }`}
            />
            {!collapsed && <span>{connected ? 'Cloud Connected' : 'Reconnecting...'}</span>}
          </div>
          {!collapsed && (
            <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
          )}
        </div>
      </div>
    </aside>
  );
};
