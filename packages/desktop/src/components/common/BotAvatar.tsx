import React from 'react';

export type BotShape =
  | 'squircle'
  | 'circle'
  | 'cup'
  | 'capsule'
  | 'triangle'
  | 'hexagon'
  | 'cloud'
  | 'teardrop';

export const BOT_SHAPES: { key: BotShape; name: string }[] = [
  { key: 'squircle', name: 'Squircle' },
  { key: 'circle', name: 'Round' },
  { key: 'cup', name: 'Cup' },
  { key: 'capsule', name: 'Capsule' },
  { key: 'triangle', name: 'Triangle' },
  { key: 'hexagon', name: 'Hexagon' },
  { key: 'cloud', name: 'Cloud' },
  { key: 'teardrop', name: 'Drop' },
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

interface BotAvatarProps {
  shape?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showGlow?: boolean;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

// Map legacy worker avatar keys to cute shapes
const legacyKeyToShape: Record<string, BotShape> = {
  orchestrator: 'circle',
  operations: 'hexagon',
  social: 'cloud',
  developer: 'squircle',
  research: 'teardrop',
  writing: 'capsule',
  browser: 'cup',
  image: 'triangle',
  video: 'squircle',
  files: 'circle',
};

export const normalizeBotShape = (shapeOrKey?: string): BotShape => {
  if (!shapeOrKey) return 'circle';
  if (BOT_SHAPES.some((s) => s.key === shapeOrKey)) {
    return shapeOrKey as BotShape;
  }
  return legacyKeyToShape[shapeOrKey] || 'circle';
};

export const BotAvatar: React.FC<BotAvatarProps> = ({
  shape = 'circle',
  color = '#3B82F6',
  size = 'md',
  className = '',
  showGlow = false,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 44;
  const normalizedShape = normalizeBotShape(shape);

  const renderShapePath = () => {
    switch (normalizedShape) {
      case 'squircle':
        return <rect x="8" y="8" width="84" height="84" rx="26" fill={color} />;
      case 'circle':
        return <circle cx="50" cy="50" r="44" fill={color} />;
      case 'cup':
        return (
          <path
            d="M 14 24 Q 14 18 22 18 L 78 18 Q 86 18 86 24 L 78 72 Q 76 84 64 86 L 36 86 Q 24 84 22 72 Z"
            fill={color}
          />
        );
      case 'capsule':
        return <rect x="8" y="22" width="84" height="56" rx="28" fill={color} />;
      case 'triangle':
        return (
          <path
            d="M 44 18 Q 50 10 56 18 L 88 68 Q 94 78 84 82 L 16 82 Q 6 78 12 68 Z"
            fill={color}
          />
        );
      case 'hexagon':
        return (
          <polygon
            points="50,14 86,34 86,70 50,90 14,70 14,34"
            fill={color}
            stroke={color}
            strokeWidth="10"
            strokeLinejoin="round"
          />
        );
      case 'cloud':
        return (
          <path
            d="M 28 78 L 74 78 C 86 78 88 66 86 58 C 84 50 78 48 74 48 C 72 32 58 26 48 28 C 38 30 34 38 32 44 C 20 44 14 54 16 64 C 18 74 24 78 28 78 Z"
            fill={color}
          />
        );
      case 'teardrop':
        return (
          <path
            d="M 50 12 C 50 12 84 48 84 66 C 84 82 70 90 50 90 C 30 90 16 82 16 66 C 16 48 50 12 50 12 Z"
            fill={color}
          />
        );
      default:
        return <circle cx="50" cy="50" r="44" fill={color} />;
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center relative flex-shrink-0 select-none ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        filter: showGlow ? `drop-shadow(0 6px 16px ${color}60)` : undefined,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={pixelSize}
        height={pixelSize}
        className="w-full h-full overflow-visible"
      >
        {/* Geometric Shape Body */}
        {renderShapePath()}

        {/* Signature Slanted Cut-Out White Eyes */}
        <g fill="#FFFFFF">
          {/* Left Eye */}
          <rect
            x="40"
            y="43"
            width="6"
            height="15"
            rx="3"
            transform="rotate(-18 43 50.5)"
          />
          {/* Right Eye */}
          <rect
            x="56"
            y="43"
            width="6"
            height="15"
            rx="3"
            transform="rotate(-18 59 50.5)"
          />
        </g>
      </svg>
    </div>
  );
};
