import React, { useState } from 'react';
import {
  Monitor,
  Terminal,
  Pause,
  Play,
  XCircle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  FileCode,
  ShieldAlert,
  ChevronRight,
  Maximize2,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskStep } from '@nexora/shared';

export const LiveActivityView: React.FC = () => {
  const {
    tasks,
    activeTaskId,
    setActiveTaskId,
    activeTask,
    latestScreenshot,
    screenshotHistory,
    liveTerminalLogs,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    emergencyStop,
    artifacts,
    backendUrl,
  } = useApp();

  const [activeConsoleTab, setActiveConsoleTab] = useState<'TERMINAL' | 'AUDIT_LOGS' | 'ARTIFACTS'>('TERMINAL');
  const [selectedHistoricalFrame, setSelectedHistoricalFrame] = useState<string | null>(null);

  const runningTasks = tasks.filter((t) => t.status === 'RUNNING' || t.status === 'QUEUED' || t.status === 'WAITING_FOR_APPROVAL');
  const task = activeTask || (runningTasks.length > 0 ? runningTasks[0] : tasks[0]) || null;
  const currentStep = task?.steps[task.currentStepIndex] || null;

  // Active preview image
  const displayImageUrl = selectedHistoricalFrame
    ? selectedHistoricalFrame
    : latestScreenshot?.imageUrl
    ? latestScreenshot.imageUrl.startsWith('http')
      ? latestScreenshot.imageUrl
      : `${backendUrl.replace(/\/$/, '')}${latestScreenshot.imageUrl}`
    : currentStep?.screenshotUrl
    ? currentStep.screenshotUrl.startsWith('http')
      ? currentStep.screenshotUrl
      : `${backendUrl.replace(/\/$/, '')}${currentStep.screenshotUrl}`
    : null;

  const taskArtifacts = artifacts.filter((a) => a.taskId === task?.id);

  return (
    <div className="flex-1 flex flex-col h-screen bg-surface-950 overflow-hidden">
      {/* Top HUD: Task Selector & Controls */}
      <div className="h-16 border-b border-surface-800 px-6 flex items-center justify-between bg-surface-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Monitor size={20} />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-white">Live Remote Computer View</h1>
              {task && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    task.status === 'RUNNING'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                      : task.status === 'WAITING_FOR_APPROVAL'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : task.status === 'COMPLETED'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-surface-800 text-slate-400 border border-surface-700'
                  }`}
                >
                  {task.status}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-md">
              {task ? `${task.title} (ID: ${task.id.slice(0, 8)})` : 'No active tasks selected'}
            </p>
          </div>
        </div>

        {/* Task Switcher dropdown & Remote Controls */}
        <div className="flex items-center space-x-3">
          {tasks.length > 0 && (
            <select
              value={task?.id || ''}
              onChange={(e) => setActiveTaskId(e.target.value)}
              className="bg-surface-850 border border-surface-750 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.status}] {t.title.slice(0, 35)}...
                </option>
              ))}
            </select>
          )}

          {task && (
            <div className="flex items-center space-x-1.5 bg-surface-850 p-1 rounded-xl border border-surface-750">
              {task.status === 'RUNNING' ? (
                <button
                  onClick={() => pauseTask(task.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-surface-750 transition"
                  title="Pause task"
                >
                  <Pause size={15} />
                </button>
              ) : (
                <button
                  onClick={() => resumeTask(task.id)}
                  className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-surface-750 transition"
                  title="Resume task"
                >
                  <Play size={15} />
                </button>
              )}

              <button
                onClick={() => retryTask(task.id)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-surface-750 transition"
                title="Retry task"
              >
                <RotateCcw size={15} />
              </button>

              <button
                onClick={() => cancelTask(task.id)}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-surface-750 transition"
                title="Cancel task"
              >
                <XCircle size={15} />
              </button>
            </div>
          )}

          <button
            onClick={emergencyStop}
            className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-300 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            title="Immediate emergency stop"
          >
            <ShieldAlert size={14} />
            <span>Emergency Stop</span>
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Visual Remote Sandbox Screen */}
        <div className="w-7/12 flex flex-col border-r border-surface-800 bg-surface-950 p-4 space-y-3 overflow-y-auto">
          {/* Active Worker & Step Status Badge */}
          {currentStep && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-900 border border-surface-800">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-bold text-slate-200">
                  Worker: <span className="text-cyan-400">{currentStep.workerType}</span>
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-300 font-medium truncate max-w-sm">
                  Step {task.currentStepIndex + 1}/{task.steps.length}: {currentStep.title}
                </span>
              </div>
              <div className="text-xs font-mono text-cyan-400 font-semibold">{task.progressPercent}%</div>
            </div>
          )}

          {/* Remote Visual Frame Viewport */}
          <div className="relative aspect-[16/10] bg-surface-900 rounded-2xl border border-surface-800 overflow-hidden flex flex-col shadow-2xl group">
            {/* Viewport Top Bar */}
            <div className="h-8 bg-surface-850 px-3 flex items-center justify-between border-b border-surface-800 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                    selectedHistoricalFrame
                      ? 'bg-slate-700 text-slate-300'
                      : latestScreenshot?.isLive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {selectedHistoricalFrame
                    ? 'Historical Screenshot'
                    : latestScreenshot?.isLive
                    ? 'Live Remote Screen'
                    : 'Recent Visual State'}
                </span>
                <span className="truncate max-w-xs text-slate-300">
                  {latestScreenshot?.caption || 'Isolated cloud execution session'}
                </span>
              </div>

              {displayImageUrl && (
                <a
                  href={displayImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition flex items-center space-x-1"
                >
                  <Maximize2 size={12} />
                  <span>Full View</span>
                </a>
              )}
            </div>

            {/* Viewport Frame */}
            <div className="flex-1 relative flex items-center justify-center bg-black/40 overflow-hidden">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt="Remote Sandbox State"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center space-y-2 p-8">
                  <Monitor size={48} className="mx-auto text-slate-400" />
                  <p className="text-sm font-medium text-slate-400">
                    {task?.status === 'RUNNING'
                      ? 'Awaiting remote display frame from cloud worker...'
                      : 'No live visual stream for the selected task.'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Screenshots from Playwright browser automation and visual assets render here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Historical Screenshot Timeline Carousel */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold text-slate-300 flex items-center space-x-1">
                <Clock size={13} />
                <span>Execution Screenshot Timeline</span>
              </span>
              {selectedHistoricalFrame && (
                <button
                  onClick={() => setSelectedHistoricalFrame(null)}
                  className="text-cyan-400 hover:text-cyan-300 transition text-[11px]"
                >
                  Return to Live View
                </button>
              )}
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
              {screenshotHistory.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2 px-1">
                  Timeline frames populate as workers capture states.
                </div>
              ) : (
                screenshotHistory.map((frame, i) => {
                  const url = frame.imageUrl.startsWith('http')
                    ? frame.imageUrl
                    : `${backendUrl.replace(/\/$/, '')}${frame.imageUrl}`;
                  const isSelected = selectedHistoricalFrame === url;

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedHistoricalFrame(url)}
                      className={`relative flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden border transition ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                          : 'border-surface-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                      }`}
                      title={frame.caption || 'Historical frame'}
                    >
                      <img src={url} alt={`Frame ${i}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1 py-0.5 text-[9px] text-white truncate">
                        {frame.workerType}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Terminal, Step Audit, & Artifacts */}
        <div className="w-5/12 flex flex-col bg-surface-900 overflow-hidden">
          {/* Console Header Tabs */}
          <div className="h-10 border-b border-surface-800 px-3 flex items-center space-x-1 bg-surface-850">
            <button
              onClick={() => setActiveConsoleTab('TERMINAL')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeConsoleTab === 'TERMINAL'
                  ? 'bg-surface-800 text-cyan-400 border border-surface-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal size={14} />
              <span>Live Terminal</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('AUDIT_LOGS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeConsoleTab === 'AUDIT_LOGS'
                  ? 'bg-surface-800 text-cyan-400 border border-surface-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={14} />
              <span>Worker Step Logs</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('ARTIFACTS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeConsoleTab === 'ARTIFACTS'
                  ? 'bg-surface-800 text-cyan-400 border border-surface-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode size={14} />
              <span>Artifacts ({taskArtifacts.length})</span>
            </button>
          </div>

          {/* Console Content */}
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs leading-relaxed">
            {activeConsoleTab === 'TERMINAL' && (
              <div className="bg-black/60 rounded-xl p-3 border border-surface-800 h-full overflow-y-auto space-y-1 text-slate-300 select-text">
                <div className="text-slate-400 pb-1 border-b border-surface-800 mb-2">
                  # Nexora Cloud Sandbox Terminal Stream
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-emerald-400">
                  {liveTerminalLogs ||
                    currentStep?.terminalOutput ||
                    `[Worker] Initialized execution environment.\n[System] Awaiting terminal commands...`}
                </pre>
              </div>
            )}

            {activeConsoleTab === 'AUDIT_LOGS' && (
              <div className="space-y-3 select-text">
                {task?.steps.map((s, i) => (
                  <div key={s.id} className="p-3 rounded-xl bg-surface-850 border border-surface-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-surface-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-200">{s.title}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-800 text-cyan-400 font-mono">
                        {s.workerType}
                      </span>
                    </div>

                    <div className="space-y-1 pl-7 text-[11px] text-slate-400">
                      {s.logs.length === 0 ? (
                        <p className="italic text-slate-400">Step queued...</p>
                      ) : (
                        s.logs.map((line, logIdx) => (
                          <div key={logIdx} className="font-mono text-slate-300">
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeConsoleTab === 'ARTIFACTS' && (
              <div className="space-y-2">
                {taskArtifacts.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    No artifacts generated yet for this task.
                  </div>
                ) : (
                  taskArtifacts.map((art) => {
                    const downloadUrl = art.url.startsWith('http')
                      ? art.url
                      : `${backendUrl.replace(/\/$/, '')}${art.url}`;

                    return (
                      <div
                        key={art.id}
                        className="p-3 rounded-xl bg-surface-850 border border-surface-800 flex items-center justify-between hover:border-cyan-500/30 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-200">{art.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {art.type.toUpperCase()} • {(art.size / 1024).toFixed(1)} KB
                          </div>
                        </div>

                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-750 text-cyan-400 text-xs font-medium transition flex items-center space-x-1"
                        >
                          <span>Open</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
