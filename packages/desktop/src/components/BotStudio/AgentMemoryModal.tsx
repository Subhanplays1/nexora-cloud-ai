import React, { useState } from 'react';
import { X, Brain, Plus, Trash2, ShieldCheck, Clock, Lightbulb } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkerAvatar } from '../common/WorkerAvatar';

export const AgentMemoryModal: React.FC = () => {
  const { activeAgent, isMemoryModalOpen, setIsMemoryModalOpen, addAgentFact, removeAgentFact } = useApp();
  const [newFact, setNewFact] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isMemoryModalOpen || !activeAgent) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    setIsAdding(true);
    try {
      await addAgentFact(activeAgent.id, newFact.trim());
      setNewFact('');
    } finally {
      setIsAdding(false);
    }
  };

  const facts = activeAgent.memory?.userFacts || [];
  const instructions = activeAgent.memory?.instructions || [];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-surface-900 border border-surface-750 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-800 pb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center p-1 shadow-md"
              style={{ backgroundColor: activeAgent.colorHex }}
            >
              <WorkerAvatar type={activeAgent.avatarKey} size="sm" showGlow={false} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{activeAgent.name}'s Brain & Memory</span>
                {activeAgent.isMainAgent && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30">
                    Main Agent
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Persistent context and facts this bot permanently remembers about you
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMemoryModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Memory Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Add New Fact Input */}
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Plus size={13} className="text-cyan-400" />
              <span>Teach {activeAgent.name} a new fact about you</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="E.g. 'I work at night', 'My YouTube channel is @SubhanTech'..."
                className="flex-1 bg-surface-950 border border-surface-750 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={!newFact.trim() || isAdding}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-sm"
              >
                {isAdding ? 'Saving...' : 'Remember'}
              </button>
            </div>
          </form>

          {/* Remembered Facts List */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Brain size={14} className="text-indigo-400" />
              <span>Remembered Facts ({facts.length})</span>
            </div>

            {facts.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-850/60 border border-surface-800 text-xs text-slate-400 italic text-center">
                No personalized facts remembered yet. Teach this agent above or chat with it!
              </div>
            ) : (
              <div className="space-y-1.5">
                {facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-850 border border-surface-800 hover:border-surface-700 flex items-center justify-between text-xs transition group"
                  >
                    <div className="flex items-center space-x-2 text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                      <span>{fact}</span>
                    </div>

                    <button
                      onClick={() => removeAgentFact(activeAgent.id, fact)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition"
                      title="Forget this fact"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Working Instructions */}
          {instructions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Lightbulb size={14} className="text-amber-400" />
                <span>Operating Guidelines</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-850/60 border border-surface-800 space-y-1 text-xs text-slate-300">
                {instructions.map((ins, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="text-slate-400">•</span>
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Persistent Guarantee Badge */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2.5 text-xs text-emerald-300">
            <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
            <span>
              This agent reads these facts during every turn. Closing the app will never erase memory.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-surface-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1">
            <Clock size={12} />
            <span>
              Last synced: {new Date(activeAgent.memory?.lastUpdated || Date.now()).toLocaleTimeString()}
            </span>
          </div>

          <button
            onClick={() => setIsMemoryModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-750 text-slate-200 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
