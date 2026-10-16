import React from 'react';

import orchestratorImg from '../../assets/avatars/orchestrator.png';
import researchImg from '../../assets/avatars/research.png';
import writingImg from '../../assets/avatars/writing.png';
import imageImg from '../../assets/avatars/image.png';
import videoImg from '../../assets/avatars/video.png';
import browserImg from '../../assets/avatars/browser.png';
import developerImg from '../../assets/avatars/developer.png';
import socialImg from '../../assets/avatars/social.png';
import operationsImg from '../../assets/avatars/operations.png';
import filesImg from '../../assets/avatars/files.png';

export interface BotCharacter {
  key: string;
  name: string;
  role: string;
  img: string;
  defaultColor: string;
}

export const BOT_CHARACTERS: BotCharacter[] = [
  {
    key: 'orchestrator',
    name: 'Orchestrator',
    role: 'Commander & Planner',
    img: orchestratorImg,
    defaultColor: '#3B82F6',
  },
  {
    key: 'research',
    name: 'Researcher',
    role: 'Deep Web & Intel',
    img: researchImg,
    defaultColor: '#3B82F6',
  },
  {
    key: 'writing',
    name: 'Writer',
    role: 'Scripts & Copywriting',
    img: writingImg,
    defaultColor: '#8B5CF6',
  },
  {
    key: 'image',
    name: 'Artist',
    role: 'Visuals & UI Design',
    img: imageImg,
    defaultColor: '#10B981',
  },
  {
    key: 'video',
    name: 'Director',
    role: 'Video & Timeline',
    img: videoImg,
    defaultColor: '#EF4444',
  },
  {
    key: 'browser',
    name: 'Navigator',
    role: 'Web Browser & Actions',
    img: browserImg,
    defaultColor: '#F97316',
  },
  {
    key: 'developer',
    name: 'Engineer',
    role: 'Code & Sandboxes',
    img: developerImg,
    defaultColor: '#14B8A6',
  },
  {
    key: 'social',
    name: 'Messenger',
    role: 'Inbox & Communication',
    img: socialImg,
    defaultColor: '#EC4899',
  },
  {
    key: 'operations',
    name: 'Operations',
    role: 'Overnight & DevOps',
    img: operationsImg,
    defaultColor: '#F59E0B',
  },
  {
    key: 'files',
    name: 'Vault Keeper',
    role: 'Files & Storage',
    img: filesImg,
    defaultColor: '#4B5563',
  },
];

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

const charKeyMap: Record<string, string> = {
  orchestrator: 'orchestrator',
  research: 'research',
  writing: 'writing',
  image: 'image',
  video: 'video',
  browser: 'browser',
  developer: 'developer',
  social: 'social',
  operations: 'operations',
  files: 'files',
  // Geometric fallbacks to corresponding 3D characters
  circle: 'orchestrator',
  teardrop: 'research',
  capsule: 'writing',
  triangle: 'image',
  squircle: 'developer',
  cup: 'browser',
  cloud: 'social',
  hexagon: 'operations',
};

export const getCharacterByKey = (key?: string): BotCharacter => {
  const norm = (key || 'orchestrator').toLowerCase();
  const matchedKey = charKeyMap[norm] || 'orchestrator';
  return BOT_CHARACTERS.find((c) => c.key === matchedKey) || BOT_CHARACTERS[0];
};

interface BotAvatarProps {
  shape?: string;
  characterKey?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  showGlow?: boolean;
  roundness?: 'full' | 'rounded';
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
  '2xl': 120,
};

export const BotAvatar: React.FC<BotAvatarProps> = ({
  shape,
  characterKey,
  color,
  size = 'md',
  className = '',
  showGlow = false,
  roundness = 'full',
}) => {
  const char = getCharacterByKey(characterKey || shape);
  const effectiveColor = color || char.defaultColor || '#3B82F6';
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 44;

  const roundedClass = roundness === 'full' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${roundedClass} ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        backgroundColor: `${effectiveColor}18`,
        border: `1.5px solid ${effectiveColor}40`,
        boxShadow: showGlow ? `0 10px 25px ${effectiveColor}35` : undefined,
      }}
      title={`${char.name} (${char.role})`}
    >
      <img
        src={char.img}
        alt={char.name}
        className="w-full h-full object-contain p-0.5 filter drop-shadow-sm select-none pointer-events-none transition-transform duration-200 hover:scale-105"
        draggable={false}
      />
    </div>
  );
};
