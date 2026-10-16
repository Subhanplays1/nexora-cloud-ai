import React, { useState } from 'react';
import {
  CheckSquare,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  ExternalLink,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskStatus } from '@nexora/shared';

export const TasksView: React.FC = () => {
  const { tasks, setActiveTaskId, setActiveTab, pauseTask, resumeTask, cancelTask, retryTask, createTaskDirectly } =
    useApp();

  const [filter, setFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskPrompt, setNewTaskPrompt] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskPrompt.trim()) return;
    createTaskDirectly(newTaskPrompt.trim());
    setNewTaskPrompt('');
    setShowNewTaskModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-surface-950 overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-surface-800 px-6 flex items-center justify-between bg-surface-900/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <CheckSquare size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Cloud Task Queue</h1>
            <p className="text-[11px] text-slate-400">Persistent Asynchronous Orchestration</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Filters */}
          <div className="flex bg-surface-850 p-1 rounded-xl border border-surface-750 text-xs">
            {(['ALL', 'RUNNING', 'QUEUED', 'COMPLETED', 'FAILED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filter === s
                    ? 'bg-surface-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition"
          >
            <Plus size={15} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Task List Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            No tasks found matching the filter "{filter}".
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-surface-900 border border-surface-800 hover:border-surface-700 transition shadow-lg space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        t.status === 'RUNNING'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                          : t.status === 'WAITING_FOR_APPROVAL'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : t.status === 'COMPLETED'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : t.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-surface-800 text-slate-400'
                      }`}
                    >
                      {t.status}
                    </span>

                    <span className="text-xs text-slate-400 font-mono">ID: {t.id.slice(0, 8)}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400">Priority: {t.priority}</span>
                  </div>

                  <h2 className="text-base font-bold text-white">{t.title}</h2>
                  <p className="text-xs text-slate-300 max-w-2xl">{t.prompt}</p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center space-x-2">
                  {t.status === 'RUNNING' && (
                    <button
                      onClick={() => pauseTask(t.id)}
                      className="p-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-white transition"
                      title="Pause"
                    >
                      <Pause size={15} />
                    </button>
                  )}

                  {(t.status === 'WAITING_FOR_APPROVAL' || t.status === 'QUEUED') && (
                    <button
                      onClick={() => resumeTask(t.id)}
                      className="p-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-emerald-400 transition"
                      title="Resume"
                    >
                      <Play size={15} />
                    </button>
                  )}

                  <button
                    onClick={() => retryTask(t.id)}
                    className="p-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-white transition"
                    title="Retry"
                  >
                    <RotateCcw size={15} />
                  </button>

                  <button
                    onClick={() => cancelTask(t.id)}
                    className="p-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-rose-400 transition"
                    title="Cancel"
                  >
                    <XCircle size={15} />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTaskId(t.id);
                      setActiveTab('LIVE_ACTIVITY');
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
                  >
                    <span>View Live</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>
                    Step {t.currentStepIndex + 1} of {t.steps.length}
                  </span>
                  <span>{t.progressPercent}% Complete</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${t.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Steps Checklist */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-surface-800/80">
                {t.steps.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-surface-850 border border-surface-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300 truncate max-w-[120px]">{s.title}</span>
                      {s.status === 'COMPLETED' ? (
                        <CheckCircle2 size={13} className="text-emerald-400" />
                      ) : s.status === 'RUNNING' ? (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      ) : (
                        <Clock size={13} className="text-slate-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono block">{s.workerType}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Direct Create Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface-900 border border-surface-750 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white">Create Autonomous Cloud Task</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <textarea
                value={newTaskPrompt}
                onChange={(e) => setNewTaskPrompt(e.target.value)}
                placeholder="Describe the task you want the cloud agent to perform..."
                rows={4}
                className="w-full bg-surface-950 border border-surface-750 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                autoFocus
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-750 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTaskPrompt.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-cyan-600/20 disabled:opacity-40"
                >
                  Dispatch to Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
