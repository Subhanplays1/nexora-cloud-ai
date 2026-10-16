import React from 'react';
import researchImg from '../../assets/avatars/research.png';
import writingImg from '../../assets/avatars/writing.png';
import imageImg from '../../assets/avatars/image.png';
import videoImg from '../../assets/avatars/video.png';
import browserImg from '../../assets/avatars/browser.png';
import developerImg from '../../assets/avatars/developer.png';
import socialImg from '../../assets/avatars/social.png';
import operationsImg from '../../assets/avatars/operations.png';
import filesImg from '../../assets/avatars/files.png';
import orchestratorImg from '../../assets/avatars/orchestrator.png';

export type AvatarWorkerType =
  | 'RESEARCH'
  | 'WRITING'
  | 'IMAGE'
  | 'VIDEO'
  | 'BROWSER'
  | 'DEVELOPER'
  | 'SOCIAL'
  | 'OPERATIONS'
  | 'FILES'
  | 'ORCHESTRATOR'
  | string;

export interface WorkerInfo {
  type: string;
  name: string;
  title: string;
  accent: string;
  bgGradient: string;
  borderColor: string;
  glowColor: string;
}

export const WORKER_REGISTRY: Record<string, WorkerInfo> = {
  ORCHESTRATOR: {
    type: 'ORCHESTRATOR',
    name: 'Nexora Brain',
    title: 'Autonomous Commander',
    accent: 'text-indigo-400',
    bgGradient: 'from-indigo-950/70 via-surface-900 to-indigo-900/40',
    borderColor: 'border-indigo-500/50',
    glowColor: 'shadow-indigo-500/30',
  },
  RESEARCH: {
    type: 'RESEARCH',
    name: 'Inspector Neo',
    title: 'Web & Deep Research',
    accent: 'text-blue-400',
    bgGradient: 'from-blue-950/70 via-surface-900 to-cyan-950/40',
    borderColor: 'border-blue-500/50',
    glowColor: 'shadow-blue-500/30',
  },
  WRITING: {
    type: 'WRITING',
    name: 'Scribe Pixel',
    title: 'Script & Copy Specialist',
    accent: 'text-purple-400',
    bgGradient: 'from-purple-950/70 via-surface-900 to-indigo-950/40',
    borderColor: 'border-purple-500/50',
    glowColor: 'shadow-purple-500/30',
  },
  IMAGE: {
    type: 'IMAGE',
    name: 'Palette Nova',
    title: 'Visuals & 16:9 Art',
    accent: 'text-emerald-400',
    bgGradient: 'from-emerald-950/70 via-surface-900 to-teal-950/40',
    borderColor: 'border-emerald-500/50',
    glowColor: 'shadow-emerald-500/30',
  },
  VIDEO: {
    type: 'VIDEO',
    name: 'Director Ray',
    title: 'Video & Timeline Editor',
    accent: 'text-rose-400',
    bgGradient: 'from-rose-950/70 via-surface-900 to-red-950/40',
    borderColor: 'border-rose-500/50',
    glowColor: 'shadow-rose-500/30',
  },
  BROWSER: {
    type: 'BROWSER',
    name: 'Scout Dash',
    title: 'Playwright Sandbox',
    accent: 'text-amber-400',
    bgGradient: 'from-amber-950/70 via-surface-900 to-orange-950/40',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-amber-500/30',
  },
  DEVELOPER: {
    type: 'DEVELOPER',
    name: 'Code Spark',
    title: 'Terminal & Workspace',
    accent: 'text-cyan-400',
    bgGradient: 'from-cyan-950/70 via-surface-900 to-sky-950/40',
    borderColor: 'border-cyan-500/50',
    glowColor: 'shadow-cyan-500/30',
  },
  SOCIAL: {
    type: 'SOCIAL',
    name: 'Pulse Ping',
    title: 'Distribution & Outreach',
    accent: 'text-pink-400',
    bgGradient: 'from-pink-950/70 via-surface-900 to-fuchsia-950/40',
    borderColor: 'border-pink-500/50',
    glowColor: 'shadow-pink-500/30',
  },
  OPERATIONS: {
    type: 'OPERATIONS',
    name: 'Gear Bolt',
    title: 'Cron & System Health',
    accent: 'text-yellow-400',
    bgGradient: 'from-yellow-950/70 via-surface-900 to-amber-950/40',
    borderColor: 'border-yellow-500/50',
    glowColor: 'shadow-yellow-500/30',
  },
  FILES: {
    type: 'FILES',
    name: 'Vault Keeper',
    title: 'Storage & Artifacts',
    accent: 'text-teal-400',
    bgGradient: 'from-teal-950/70 via-surface-900 to-slate-900/40',
    borderColor: 'border-teal-500/50',
    glowColor: 'shadow-teal-500/30',
  },
};

const avatarMap: Record<string, string> = {
  RESEARCH: researchImg,
  WRITING: writingImg,
  IMAGE: imageImg,
  VIDEO: videoImg,
  BROWSER: browserImg,
  DEVELOPER: developerImg,
  SOCIAL: socialImg,
  OPERATIONS: operationsImg,
  FILES: filesImg,
  ORCHESTRATOR: orchestratorImg,
};

interface WorkerAvatarProps {
  type: AvatarWorkerType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'IDLE' | 'BUSY' | 'COMPLETED' | 'ERROR';
  className?: string;
  showGlow?: boolean;
}

export const WorkerAvatar: React.FC<WorkerAvatarProps> = ({
  type,
  size = 'md',
  status,
  className = '',
  showGlow = true,
}) => {
  const normType = (type || 'ORCHESTRATOR').toUpperCase();
  const imgSrc = avatarMap[normType] || orchestratorImg;
  const info = WORKER_REGISTRY[normType] || WORKER_REGISTRY.ORCHESTRATOR;

  const sizeStyles = {
    xs: 'w-6 h-6',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-36 h-36',
  }[size];

  const roundedStyles = {
    xs: 'rounded-lg p-0.5',
    sm: 'rounded-xl p-1',
    md: 'rounded-2xl p-1.5',
    lg: 'rounded-2xl p-2',
    xl: 'rounded-3xl p-3',
    '2xl': 'rounded-3xl p-4',
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeStyles} ${className}`}>
      <div
        className={`w-full h-full ${roundedStyles} overflow-hidden bg-gradient-to-b ${info.bgGradient} border ${
          showGlow ? `${info.borderColor} shadow-lg ${info.glowColor}` : 'border-surface-750/70'
        } backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-105 ${
          status === 'BUSY' ? 'ring-2 ring-cyan-400/50 animate-pulse' : ''
        }`}
      >
        <img
          src={imgSrc}
          alt={info.name}
          className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] select-none transition-transform duration-300 hover:scale-110"
          draggable={false}
        />
      </div>

      {status === 'BUSY' && (
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-surface-950" />
        </span>
      )}

      {status === 'COMPLETED' && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 z-10">
          <span className="inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-surface-950 shadow-sm" />
        </span>
      )}
    </div>
  );
};
