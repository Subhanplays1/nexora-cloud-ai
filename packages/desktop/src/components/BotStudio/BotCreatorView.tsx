import React, { useState } from 'react';
import { Sparkles, ArrowRight, Bot, Check, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkerAvatar } from '../common/WorkerAvatar';

export const PALETTE_COLORS = [
  { name: 'Brown', hex: '#8B5A2B' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Slate', hex: '#4B5563' },
];

export const MASCOT_KEYS = [
  'orchestrator',
  'research',
  'writing',
  'image',
  'video',
  'browser',
  'developer',
  'social',
  'operations',
  'files',
];

interface SuggestionCard {
  name: string;
  description: string;
  avatarKey: string;
  colorHex: string;
  systemPrompt: string;
  initialFacts: string[];
}

const SUGGESTIONS: SuggestionCard[] = [
  {
    name: 'Night Shift',
    description: 'Works overnight and preps your morning digest',
    avatarKey: 'operations',
    colorHex: '#F97316',
    systemPrompt:
      'You are Night Shift, a tireless overnight autonomous worker. You organize tasks, run health checks, prepare morning briefings, and summarize overnight events while the user sleeps.',
    initialFacts: [
      'Prepares morning executive briefings',
      'Runs background operations and summaries',
    ],
  },
  {
    name: 'Inbox Triage',
    description: 'Sorts your email and drafts replies in your voice',
    avatarKey: 'social',
    colorHex: '#EC4899',
    systemPrompt:
      'You are Inbox Triage, an expert communication assistant. You categorize incoming messages, prioritize urgency, draft contextual replies matching the user style, and shield from spam.',
    initialFacts: [
      'Prioritizes high-urgency notifications',
      'Drafts concise, friendly professional replies',
    ],
  },
  {
    name: 'Research Analyst',
    description: 'Conducts deep technical research and cites verified sources',
    avatarKey: 'research',
    colorHex: '#3B82F6',
    systemPrompt:
      'You are Research Analyst, an inquisitive and analytical intelligence bot. You cross-check sources, conduct deep web investigations, compile structured briefs, and cite references accurately.',
    initialFacts: [
      'Prefers bullet-pointed executive summaries',
      'Always cites sources and dates',
    ],
  },
  {
    name: 'Code Architect',
    description: 'Scaffolds full-stack apps and executes sandboxed terminal tests',
    avatarKey: 'developer',
    colorHex: '#14B8A6',
    systemPrompt:
      'You are Code Architect, a senior engineering bot. You scaffold modern applications, write clean modular TypeScript code, and verify tests in persistent sandboxes.',
    initialFacts: [
      'Primary workspace is on drive D:',
      'Favors TypeScript, React 19, and Tailwind CSS',
    ],
  },
];

export const BotCreatorView: React.FC = () => {
  const { createAgent, generateAgentFromPrompt } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedMascot, setSelectedMascot] = useState('orchestrator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const botName = name.trim() || 'New Bot';

    setIsSubmitting(true);
    try {
      await createAgent({
        name: botName,
        description: description.trim() || 'Custom autonomous desktop assistant',
        avatarKey: selectedMascot,
        colorHex: selectedColor,
        systemPrompt: `You are ${botName}, a specialized autonomous personal assistant created to help the user. Always remember context, follow instructions strictly, and execute tasks thoroughly.`,
        initialFacts: description.trim() ? [`Primary focus: ${description.trim()}`] : [],
      });
    } catch (err) {
      console.error('Failed to create bot:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplySuggestion = (s: SuggestionCard) => {
    setName(s.name);
    setDescription(s.description);
    setSelectedMascot(s.avatarKey);
    setSelectedColor(s.colorHex);
  };

  const handleAiSynthesis = async () => {
    if (!description.trim() && !name.trim()) return;
    const req = description.trim() || `An autonomous assistant named ${name.trim()}`;

    setIsAiGenerating(true);
    try {
      await generateAgentFromPrompt(req);
    } catch (err) {
      console.error('Failed to auto-synthesize agent:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-surface-950 text-slate-800 dark:text-slate-100 overflow-y-auto font-sans transition-colors duration-200">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-200 dark:border-surface-800 px-8 flex items-center justify-between bg-slate-50/60 dark:bg-surface-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center space-x-2.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: selectedColor }}
          >
            <Bot size={12} />
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {name.trim() || 'New Bot'}
          </span>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 flex flex-col items-center space-y-6">
        {/* Large Mascot Circle Preview */}
        <div className="relative group">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center p-3 transition-all duration-300 shadow-xl"
            style={{
              backgroundColor: selectedColor,
              boxShadow: `0 12px 30px ${selectedColor}40`,
            }}
          >
            <WorkerAvatar
              type={selectedMascot}
              size="xl"
              showGlow={false}
              className="filter drop-shadow-md select-none transform transition hover:scale-110"
            />
          </div>
        </div>

        {/* 10-Color Palette Swatches */}
        <div className="flex items-center justify-center space-x-2.5 pt-1">
          {PALETTE_COLORS.map((c) => {
            const isSelected = selectedColor === c.hex;
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => setSelectedColor(c.hex)}
                className={`w-6 h-6 rounded-full transition-transform duration-200 cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-cyan-500 scale-125 dark:ring-offset-surface-950 shadow-md'
                    : 'hover:scale-115 opacity-90 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
              </button>
            );
          })}
        </div>

        {/* 10-Mascot Shape Selector */}
        <div className="flex items-center justify-center space-x-2 overflow-x-auto py-2 px-1 max-w-full">
          {MASCOT_KEYS.map((k) => {
            const isSelected = selectedMascot === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedMascot(k)}
                className={`p-1.5 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-sm ring-2 ring-cyan-500/40 scale-110'
                    : 'border-slate-200 dark:border-surface-800 hover:border-slate-300 dark:hover:border-surface-700 bg-slate-100/60 dark:bg-surface-900/40'
                }`}
                title={`Select ${k} mascot`}
              >
                <WorkerAvatar type={k} size="sm" showGlow={false} />
              </button>
            );
          })}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleCreate} className="w-full space-y-4 pt-2">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Bot"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-750 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              autoFocus
            />
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Instructions or Requirements (Optional)
              </label>
              <button
                type="button"
                onClick={handleAiSynthesis}
                disabled={isAiGenerating || (!description.trim() && !name.trim())}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1 font-semibold disabled:opacity-40"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Main Agent Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Auto-Generate with Main Agent</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should this bot do for you? E.g., 'Draft technical YouTube scripts' or 'Monitor my emails overnight'..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-750 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none font-sans"
            />
          </div>

          {/* Action Button: Get started */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-xl font-semibold text-sm transition shadow-md disabled:opacity-50 text-white flex items-center space-x-2"
              style={{ backgroundColor: selectedColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating Bot...</span>
                </>
              ) : (
                <>
                  <span>Get started</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggestions Section */}
        <div className="w-full pt-6 text-left space-y-3">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-1">
            Suggestions
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {SUGGESTIONS.map((s) => (
              <div
                key={s.name}
                onClick={() => handleApplySuggestion(s)}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-surface-900/80 border border-slate-200/80 dark:border-surface-800 hover:border-slate-300 dark:hover:border-surface-700 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center space-x-3.5 group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 p-1.5 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: s.colorHex }}
                >
                  <WorkerAvatar type={s.avatarKey} size="sm" showGlow={false} />
                </div>

                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                    {s.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {s.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
