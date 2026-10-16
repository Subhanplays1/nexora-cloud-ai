import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Bot } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  BotAvatar,
  BOT_CHARACTERS,
  PALETTE_COLORS,
} from '../common/BotAvatar';

interface SuggestionPreset {
  name: string;
  description: string;
  characterKey: string;
  colorHex: string;
  systemPrompt: string;
  initialFacts: string[];
}

const PRESET_SUGGESTIONS: SuggestionPreset[] = [
  {
    name: 'Night Shift',
    description: 'Works overnight and preps your morning digest',
    characterKey: 'operations',
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
    characterKey: 'social',
    colorHex: '#EC4899',
    systemPrompt:
      'You are Inbox Triage, an expert communication assistant. You categorize incoming messages, prioritize urgency, draft contextual replies matching the user style, and shield from spam.',
    initialFacts: [
      'Prioritizes high-urgency notifications',
      'Drafts concise, friendly professional replies',
    ],
  },
  {
    name: 'Research Scout',
    description: 'Conducts deep technical research and cites verified sources',
    characterKey: 'research',
    colorHex: '#3B82F6',
    systemPrompt:
      'You are Research Scout, an analytical intelligence bot. You cross-check sources, conduct deep investigations, compile structured briefs, and cite references accurately.',
    initialFacts: [
      'Prefers bullet-pointed executive summaries',
      'Always cites sources and dates',
    ],
  },
  {
    name: 'Code Crafter',
    description: 'Scaffolds full-stack apps and verifies tests in persistent sandboxes',
    characterKey: 'developer',
    colorHex: '#14B8A6',
    systemPrompt:
      'You are Code Crafter, a senior engineering bot. You scaffold modern applications, write clean modular TypeScript code, and verify tests in persistent sandboxes.',
    initialFacts: [
      'Primary workspace is on drive D:\\nexora-ai',
      'Favors TypeScript, React 19, and Tailwind CSS',
    ],
  },
];

export const BotCreatorView: React.FC = () => {
  const { createAgent, generateAgentFromPrompt } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedCharacter, setSelectedCharacter] = useState('orchestrator');
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
        avatarKey: selectedCharacter,
        colorHex: selectedColor,
        systemPrompt: `You are ${botName}, a specialized autonomous personal assistant created exclusively for Subhan Zahid. Always remember context, follow instructions strictly, and execute tasks thoroughly.`,
        initialFacts: description.trim() ? [`Primary focus: ${description.trim()}`] : [],
      });
    } catch (err) {
      console.error('Failed to create bot:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplySuggestion = (s: SuggestionPreset) => {
    setName(s.name);
    setDescription(s.description);
    setSelectedCharacter(s.characterKey);
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
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-[#0f1117] text-slate-800 dark:text-slate-100 overflow-y-auto font-sans select-none">
      {/* Top Header Matching Screenshot */}
      <div className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 px-8 flex items-center justify-between bg-white/70 dark:bg-[#0f1117]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center space-x-2.5">
          <BotAvatar characterKey={selectedCharacter} color={selectedColor} size={26} />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {name.trim() || 'New Bot'}
          </span>
        </div>
      </div>

      {/* Main Studio Body Matching Screenshot Layout */}
      <div className="flex-1 max-w-xl w-full mx-auto px-6 py-10 flex flex-col items-center space-y-7">
        {/* Large Central 3D Mascot PFP Preview */}
        <div className="relative group transition-transform duration-300 hover:scale-105">
          <BotAvatar
            characterKey={selectedCharacter}
            color={selectedColor}
            size={110}
            showGlow
            roundness="full"
          />
        </div>

        {/* 10-Color Palette Swatches with Outer Selection Ring */}
        <div className="flex items-center justify-center space-x-2.5 pt-1">
          {PALETTE_COLORS.map((c) => {
            const isSelected = selectedColor === c.hex;
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => setSelectedColor(c.hex)}
                className={`relative w-6 h-6 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#0f1117] scale-110 shadow-sm'
                    : 'hover:scale-110 opacity-90 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            );
          })}
        </div>

        {/* Row of 10 Adorable 3D Characters Provided by User */}
        <div className="flex items-center justify-center space-x-2 max-w-full overflow-x-auto py-1 px-1">
          {BOT_CHARACTERS.map((char) => {
            const isSelected = selectedCharacter === char.key;
            return (
              <button
                key={char.key}
                type="button"
                onClick={() => setSelectedCharacter(char.key)}
                className={`p-1.5 rounded-2xl transition-all duration-150 cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-sm scale-110'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 opacity-80 hover:opacity-100'
                }`}
                title={`${char.name}: ${char.role}`}
              >
                <BotAvatar
                  characterKey={char.key}
                  color={selectedColor}
                  size={32}
                  roundness="rounded"
                />
              </button>
            );
          })}
        </div>

        {/* Bot Name Form */}
        <form onSubmit={handleCreate} className="w-full max-w-md space-y-5 pt-1">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 pl-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Bot"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              autoFocus
            />
          </div>

          {/* Optional Instructions */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between pl-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Instructions or Mission (Optional)
              </label>
              <button
                type="button"
                onClick={handleAiSynthesis}
                disabled={isAiGenerating || (!description.trim() && !name.trim())}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-semibold disabled:opacity-40"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={11} />
                    <span>Auto-Design with Main Agent</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should this bot do? E.g., 'Draft technical YouTube scripts' or 'Monitor emails overnight'..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none font-sans"
            />
          </div>

          {/* "Get started" Pill Button Matching Screenshot */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 text-white flex items-center space-x-2"
              style={{ backgroundColor: selectedColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating Bot...</span>
                </>
              ) : (
                <>
                  <span>Get started</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggestions Section Matching Screenshot Cards */}
        <div className="w-full max-w-md pt-6 text-left space-y-3">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider pl-1">
            Suggestions
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PRESET_SUGGESTIONS.map((s) => (
              <div
                key={s.name}
                onClick={() => handleApplySuggestion(s)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center space-x-3.5 group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
                  <BotAvatar
                    characterKey={s.characterKey}
                    color={s.colorHex}
                    size={44}
                    roundness="rounded"
                  />
                </div>

                <div className="space-y-0.5 truncate">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition truncate">
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
