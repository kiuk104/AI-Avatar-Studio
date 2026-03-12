import React from 'react';

interface HairThumbnailProps {
  style: string;
  size?: number;
  className?: string;
}

// --- Color Palette ---
const C = {
  hair: '#4A3728',
  hairMid: '#6B4F3B',
  hairLight: '#8B6B4F',
  hairShine: '#A68565',
  skin: '#D4A574',
  skinShadow: '#B8895A',
  skinLight: '#E8C098',
  eye: '#1A1A1A',
  eyeShine: 'rgba(255,255,255,0.55)',
  nose: '#B8895A',
  mouth: '#C4756A',
  tie: '#7B6B3A',
  tieLight: '#A69050',
  shave: 'rgba(74,55,40,0.25)',
};

// --- Shared SVG definitions for gradients ---
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="ht-skin" cx="0.45" cy="0.35" r="0.6">
      <stop offset="0%" stopColor={C.skinLight} />
      <stop offset="100%" stopColor={C.skin} />
    </radialGradient>
    <linearGradient id="ht-hair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={C.hairLight} />
      <stop offset="40%" stopColor={C.hair} />
      <stop offset="100%" stopColor={C.hair} />
    </linearGradient>
    <linearGradient id="ht-hairSide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={C.hairMid} />
      <stop offset="100%" stopColor={C.hair} />
    </linearGradient>
    <radialGradient id="ht-shine" cx="0.4" cy="0.2" r="0.5">
      <stop offset="0%" stopColor={C.hairShine} opacity="0.6" />
      <stop offset="100%" stopColor={C.hairShine} opacity="0" />
    </radialGradient>
  </defs>
);

// --- Face Base (shared across all styles) ---
const FaceBase: React.FC = () => (
  <g>
    {/* Neck */}
    <rect x="27" y="52" width="10" height="8" rx="3" fill={C.skin} />
    {/* Head shape */}
    <ellipse cx="32" cy="36" rx="17" ry="20" fill="url(#ht-skin)" />
    {/* Chin shape */}
    <ellipse cx="32" cy="52" rx="10" ry="5" fill="url(#ht-skin)" />
    {/* Left ear */}
    <ellipse cx="15.5" cy="37" rx="3.5" ry="5" fill={C.skin} />
    <ellipse cx="15.5" cy="37" rx="2.2" ry="3.5" fill={C.skinShadow} opacity="0.25" />
    {/* Right ear */}
    <ellipse cx="48.5" cy="37" rx="3.5" ry="5" fill={C.skin} />
    <ellipse cx="48.5" cy="37" rx="2.2" ry="3.5" fill={C.skinShadow} opacity="0.25" />
    {/* Left eye white */}
    <ellipse cx="25" cy="36" rx="4" ry="3.2" fill="white" opacity="0.9" />
    {/* Left iris */}
    <ellipse cx="25.5" cy="36.2" rx="2.2" ry="2.6" fill="#3E2B1A" />
    <ellipse cx="25.5" cy="36.2" rx="1.5" ry="1.8" fill={C.eye} />
    <ellipse cx="24.8" cy="35.2" rx="0.8" ry="0.8" fill="white" opacity="0.7" />
    {/* Right eye white */}
    <ellipse cx="39" cy="36" rx="4" ry="3.2" fill="white" opacity="0.9" />
    {/* Right iris */}
    <ellipse cx="39.5" cy="36.2" rx="2.2" ry="2.6" fill="#3E2B1A" />
    <ellipse cx="39.5" cy="36.2" rx="1.5" ry="1.8" fill={C.eye} />
    <ellipse cx="38.8" cy="35.2" rx="0.8" ry="0.8" fill="white" opacity="0.7" />
    {/* Eyebrows */}
    <path d="M21 31.5 Q25 29.5 29 31" stroke={C.hair} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <path d="M35 31 Q39 29.5 43 31.5" stroke={C.hair} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    {/* Nose */}
    <path d="M30 42 Q32 44.5 34 42" stroke={C.nose} strokeWidth="1.1" fill="none" strokeLinecap="round" />
    <circle cx="29.5" cy="42.5" r="0.6" fill={C.nose} opacity="0.4" />
    <circle cx="34.5" cy="42.5" r="0.6" fill={C.nose} opacity="0.4" />
    {/* Mouth */}
    <path d="M27.5 47.5 Q32 50 36.5 47.5" stroke={C.mouth} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    {/* Cheek blush */}
    <ellipse cx="20" cy="43" rx="3" ry="2" fill="#E8A090" opacity="0.2" />
    <ellipse cx="44" cy="43" rx="3" ry="2" fill="#E8A090" opacity="0.2" />
  </g>
);

type HairLayer = {
  behind?: React.ReactNode;
  front: React.ReactNode;
};

// Helper: hair texture strands
const Strands: React.FC<{ paths: string[]; color?: string; opacity?: number }> = ({
  paths, color = C.hairLight, opacity = 0.3,
}) => (
  <g>
    {paths.map((d, i) => (
      <path key={i} d={d} stroke={color} strokeWidth="0.6" fill="none" opacity={opacity} strokeLinecap="round" />
    ))}
  </g>
);

const HAIR_LAYERS: Record<string, HairLayer> = {
  // ==================== SHORT STYLES ====================

  'Bald': {
    front: (
      <g>
        {/* Scalp highlight */}
        <ellipse cx="28" cy="20" rx="10" ry="5" fill="white" opacity="0.08" />
        <ellipse cx="26" cy="18" rx="5" ry="3" fill="white" opacity="0.06" />
      </g>
    ),
  },

  'Buzz Cut': {
    front: (
      <g>
        {/* Main buzz shape */}
        <path d="M15 34 Q14 20 20 15 Q26 10 32 10 Q38 10 44 15 Q50 20 49 34" fill={C.hair} />
        {/* Texture stipple */}
        <path d="M15 34 Q14 20 20 15 Q26 10 32 10 Q38 10 44 15 Q50 20 49 34" fill="url(#ht-shine)" />
        {/* Hairline edge */}
        <path d="M17 30 Q18 22 24 17 Q30 13 32 13 Q34 13 40 17 Q46 22 47 30"
          stroke={C.hairMid} strokeWidth="0.5" fill="none" opacity="0.5" />
        <Strands paths={[
          'M24 13 L24 18', 'M28 12 L28 17', 'M32 11 L32 16',
          'M36 12 L36 17', 'M40 13 L40 18',
        ]} opacity={0.15} />
      </g>
    ),
  },

  'Crew Cut': {
    front: (
      <g>
        {/* Slightly longer on top than buzz */}
        <path d="M15 33 Q14 18 22 13 Q28 9 32 8 Q36 9 42 13 Q50 18 49 33" fill={C.hair} />
        {/* Top volume */}
        <path d="M20 16 Q26 7 32 6 Q38 7 44 16" fill={C.hair} />
        <path d="M20 16 Q26 7 32 6 Q38 7 44 16" fill="url(#ht-shine)" />
        {/* Side fade */}
        <path d="M15 33 Q14 26 17 20" stroke={C.skinShadow} strokeWidth="0.6" fill="none" opacity="0.3" />
        <path d="M49 33 Q50 26 47 20" stroke={C.skinShadow} strokeWidth="0.6" fill="none" opacity="0.3" />
        <Strands paths={[
          'M24 9 L22 16', 'M28 7 L27 14', 'M32 6 L32 13',
          'M36 7 L37 14', 'M40 9 L42 16',
        ]} opacity={0.2} />
      </g>
    ),
  },

  'Short Wavy': {
    front: (
      <g>
        {/* Main hair volume */}
        <path d="M14 33 Q13 17 20 12 Q26 7 32 7 Q38 7 44 12 Q51 17 50 33
               Q48 28 44 26 Q40 22 36 25 Q32 21 28 25 Q24 22 20 26 Q16 28 14 33 Z"
          fill="url(#ht-hair)" />
        {/* Wave texture */}
        <path d="M18 14 Q22 6 28 10 Q32 5 36 10 Q42 6 46 14" fill={C.hair} />
        <path d="M20 15 Q24 9 28 12 Q32 7 36 12 Q40 9 44 15" fill={C.hairMid} opacity="0.5" />
        {/* Shine */}
        <path d="M24 10 Q32 6 40 10 Q36 8 32 9 Q28 8 24 10" fill={C.hairShine} opacity="0.4" />
        <Strands paths={[
          'M22 10 Q24 14 22 20', 'M28 8 Q30 12 28 18',
          'M36 8 Q34 12 36 18', 'M42 10 Q40 14 42 20',
        ]} />
      </g>
    ),
  },

  'Side Part': {
    front: (
      <g>
        {/* Right side volume */}
        <path d="M22 12 Q30 7 42 10 Q51 14 50 32 Q48 26 46 22 Q42 16 34 14 Q28 13 22 15 Z"
          fill="url(#ht-hair)" />
        {/* Left side shorter */}
        <path d="M14 33 Q13 20 18 14 Q22 10 24 12 L22 15 Q16 20 15 30 Z" fill={C.hair} />
        {/* Top sweep */}
        <path d="M22 12 Q18 14 14 20 L14 33 Q14 28 16 24 Q18 18 22 14 Z" fill={C.hair} />
        {/* Part line */}
        <path d="M22 12 Q20 16 18 22" stroke={C.skin} strokeWidth="1.2" fill="none" opacity="0.5" />
        {/* Shine on swept side */}
        <path d="M30 9 Q38 7 46 14 L44 16 Q38 10 30 12 Z" fill={C.hairShine} opacity="0.35" />
        <Strands paths={[
          'M26 11 Q34 8 44 14', 'M28 13 Q36 10 46 18',
          'M30 15 Q38 12 48 22',
        ]} />
      </g>
    ),
  },

  'Slicked Back': {
    front: (
      <g>
        {/* Main slicked shape */}
        <path d="M14 34 Q13 18 20 13 Q26 9 32 8 Q38 9 44 13 Q51 18 50 34
               Q48 28 46 24 Q42 18 32 16 Q22 18 18 24 Q16 28 14 34 Z"
          fill="url(#ht-hair)" />
        {/* Combed-back texture */}
        <Strands paths={[
          'M20 14 Q22 18 20 28', 'M24 12 Q26 16 24 26',
          'M28 11 Q30 15 28 24', 'M32 10 Q32 15 32 23',
          'M36 11 Q34 15 36 24', 'M40 12 Q38 16 40 26',
          'M44 14 Q42 18 44 28',
        ]} color={C.hairShine} opacity={0.25} />
        {/* Shine stripe */}
        <path d="M26 10 Q32 8 38 10 Q34 9 30 9 Z" fill={C.hairShine} opacity="0.5" />
        {/* Gel shine */}
        <path d="M22 13 Q32 9 42 13" fill="white" opacity="0.08" />
      </g>
    ),
  },

  'Undercut': {
    front: (
      <g>
        {/* Shaved sides */}
        <path d="M15 33 Q14 24 17 18 L20 20 Q17 25 17 33 Z" fill={C.shave} />
        <path d="M49 33 Q50 24 47 18 L44 20 Q47 25 47 33 Z" fill={C.shave} />
        {/* Longer top swept to side */}
        <path d="M20 18 Q22 10 32 8 Q42 10 44 18
               Q44 14 40 12 Q36 9 32 9 Q28 9 24 12 Q20 14 20 18 Z"
          fill={C.hair} />
        <path d="M20 18 Q24 10 32 8 Q40 10 44 18 Q42 22 38 20 Q32 16 26 20 Q22 22 20 18 Z"
          fill="url(#ht-hair)" />
        {/* Swept direction */}
        <path d="M24 12 Q32 6 44 12 Q40 16 34 14 Q28 12 22 16 Z" fill={C.hairMid} />
        {/* Shine */}
        <path d="M28 9 Q32 7 38 9 Q34 8 30 8 Z" fill={C.hairShine} opacity="0.5" />
        {/* Fade line */}
        <path d="M17 20 Q18 18 20 17" stroke={C.skinShadow} strokeWidth="0.7" fill="none" opacity="0.6" />
        <path d="M47 20 Q46 18 44 17" stroke={C.skinShadow} strokeWidth="0.7" fill="none" opacity="0.6" />
      </g>
    ),
  },

  'Mohawk': {
    front: (
      <g>
        {/* Shaved sides */}
        <path d="M15 33 Q14 22 18 16 L21 19 Q17 24 17 33 Z" fill={C.shave} />
        <path d="M49 33 Q50 22 46 16 L43 19 Q47 24 47 33 Z" fill={C.shave} />
        {/* Central mohawk strip */}
        <path d="M27 16 Q28 2 32 0 Q36 2 37 16" fill={C.hair} />
        <path d="M28 16 Q29 4 32 2 Q35 4 36 16" fill="url(#ht-hair)" />
        {/* Mohawk volume/spikes */}
        <path d="M28 8 Q30 0 32 -1 Q34 0 36 8" fill={C.hair} />
        {/* Base on head */}
        <path d="M26 18 Q28 14 32 13 Q36 14 38 18" fill={C.hair} />
        {/* Texture */}
        <Strands paths={[
          'M30 2 L30 14', 'M32 0 L32 13', 'M34 2 L34 14',
        ]} color={C.hairShine} opacity={0.3} />
        {/* Shine */}
        <path d="M30 3 Q32 1 34 3 Q32 2 30 3" fill={C.hairShine} opacity="0.5" />
      </g>
    ),
  },

  // ==================== MEDIUM STYLES ====================

  'Top Knot': {
    front: (
      <g>
        {/* Shaved sides */}
        <path d="M15 33 Q14 24 18 17 L21 20 Q17 25 17 33 Z" fill={C.shave} />
        <path d="M49 33 Q50 24 46 17 L43 20 Q47 25 47 33 Z" fill={C.shave} />
        {/* Hair gathered up */}
        <path d="M24 18 Q24 12 32 10 Q40 12 40 18" fill={C.hair} />
        {/* Bun */}
        <ellipse cx="32" cy="6" rx="7" ry="6.5" fill={C.hair} />
        <ellipse cx="32" cy="6" rx="7" ry="6.5" fill="url(#ht-shine)" />
        {/* Bun texture */}
        <path d="M26 6 Q29 3 32 2 Q35 3 38 6" stroke={C.hairMid} strokeWidth="0.7" fill="none" opacity="0.5" />
        <path d="M27 8 Q30 5 32 4 Q34 5 37 8" stroke={C.hairMid} strokeWidth="0.5" fill="none" opacity="0.4" />
        {/* Hair tie */}
        <ellipse cx="32" cy="12" rx="5" ry="2" fill={C.tie} />
        <ellipse cx="32" cy="12" rx="4" ry="1.3" fill={C.tieLight} opacity="0.5" />
      </g>
    ),
  },

  'Man Bun': {
    behind: (
      <g>
        {/* Bun at back */}
        <ellipse cx="44" cy="18" rx="8" ry="7" fill={C.hair} />
        <ellipse cx="44" cy="18" rx="8" ry="7" fill="url(#ht-shine)" />
      </g>
    ),
    front: (
      <g>
        {/* Hair swept back */}
        <path d="M14 34 Q13 18 20 13 Q26 9 32 8 Q38 9 44 13 Q51 18 50 34
               Q48 28 44 22 Q38 16 32 15 Q26 16 20 22 Q16 28 14 34 Z"
          fill="url(#ht-hair)" />
        {/* Swept texture */}
        <Strands paths={[
          'M22 14 Q28 18 34 16', 'M26 12 Q32 16 38 14',
          'M30 10 Q36 14 42 12',
        ]} opacity={0.2} />
        {/* Hair tie */}
        <ellipse cx="46" cy="22" rx="3" ry="2.5" fill={C.tie} />
        <ellipse cx="46" cy="22" rx="2" ry="1.5" fill={C.tieLight} opacity="0.5" />
        {/* Bun wrap lines */}
        <path d="M38 14 Q42 12 48 14" stroke={C.hairMid} strokeWidth="0.5" fill="none" opacity="0.4" />
        <path d="M40 16 Q44 14 50 16" stroke={C.hairMid} strokeWidth="0.5" fill="none" opacity="0.3" />
      </g>
    ),
  },

  'Bob Cut': {
    front: (
      <g>
        {/* Top volume */}
        <path d="M14 34 Q13 16 32 10 Q51 16 50 34 Q48 26 44 20 Q38 15 32 14 Q26 15 20 20 Q16 26 14 34 Z"
          fill="url(#ht-hair)" />
        {/* Left bob side */}
        <path d="M14 30 Q12 26 12 22 L11 46 Q12 50 18 50 L18 44 Q14 44 14 38 Z" fill="url(#ht-hairSide)" />
        {/* Right bob side */}
        <path d="M50 30 Q52 26 52 22 L53 46 Q52 50 46 50 L46 44 Q50 44 50 38 Z" fill="url(#ht-hairSide)" />
        {/* Inward curve */}
        <path d="M11 44 Q14 51 18 50" stroke={C.hairLight} strokeWidth="0.8" fill="none" opacity="0.4" />
        <path d="M53 44 Q50 51 46 50" stroke={C.hairLight} strokeWidth="0.8" fill="none" opacity="0.4" />
        {/* Shine */}
        <path d="M22 12 Q32 9 42 12 L38 15 Q32 12 26 15 Z" fill={C.hairShine} opacity="0.35" />
        <Strands paths={[
          'M13 28 L12 42', 'M14 26 L13 40', 'M50 26 L51 40', 'M51 28 L52 42',
        ]} opacity={0.15} />
      </g>
    ),
  },

  'Bangs': {
    front: (
      <g>
        {/* Main hair volume */}
        <path d="M14 34 Q13 16 32 10 Q51 16 50 34 Q48 28 44 20 Q38 14 32 13 Q26 14 20 20 Q16 28 14 34 Z"
          fill="url(#ht-hair)" />
        {/* Side hair */}
        <path d="M14 30 L12 46 Q13 48 16 48 L16 34 Z" fill="url(#ht-hairSide)" />
        <path d="M50 30 L52 46 Q51 48 48 48 L48 34 Z" fill="url(#ht-hairSide)" />
        {/* Bangs fringe - key feature */}
        <path d="M16 22 Q18 28 22 30 L24 32 Q20 30 18 26 Z" fill={C.hair} />
        <path d="M18 20 Q22 28 28 32 L30 33 Q24 30 20 24 Z" fill={C.hairMid} />
        <path d="M22 18 Q26 26 32 30 Q28 28 24 22 Z" fill={C.hair} />
        <path d="M28 16 Q32 24 38 28 Q34 26 30 20 Z" fill={C.hairMid} />
        <path d="M34 16 Q36 22 40 26 Q38 24 36 18 Z" fill={C.hair} />
        <path d="M38 17 Q40 22 44 24 Q42 22 40 18 Z" fill={C.hairMid} />
        {/* Bangs bottom edge */}
        <path d="M16 24 Q20 32 28 33 Q32 32 36 30 Q42 26 48 22"
          stroke={C.hair} strokeWidth="1.5" fill="none" opacity="0.3" />
        {/* Shine */}
        <path d="M22 14 Q28 10 36 14 Q30 12 24 14 Z" fill={C.hairShine} opacity="0.4" />
      </g>
    ),
  },

  'Pixie Cut': {
    front: (
      <g>
        {/* Short pixie volume */}
        <path d="M14 33 Q13 18 22 12 Q28 8 32 8 Q36 8 42 12 Q51 18 50 33
               Q48 28 44 22 Q38 16 32 15 Q26 16 20 22 Q16 28 14 33 Z"
          fill="url(#ht-hair)" />
        {/* Asymmetric longer piece on one side */}
        <path d="M14 28 Q12 22 14 16 Q16 12 22 10 L18 14 Q14 18 13 24 Z" fill={C.hair} />
        <path d="M14 28 L12 36 Q13 38 16 36 L16 30 Z" fill={C.hairMid} />
        {/* Textured top */}
        <path d="M22 10 Q28 5 36 8 Q32 6 26 8 Z" fill={C.hair} />
        <Strands paths={[
          'M20 12 Q18 18 16 26', 'M24 10 Q22 16 20 22',
          'M28 9 Q28 14 26 18', 'M34 9 Q36 14 38 16',
          'M40 11 Q42 14 44 18',
        ]} opacity={0.25} />
        {/* Shine */}
        <path d="M24 10 Q30 7 36 10 Q32 8 26 9 Z" fill={C.hairShine} opacity="0.4" />
      </g>
    ),
  },

  // ==================== LONG STYLES ====================

  'Long Straight': {
    behind: (
      <g>
        <path d="M12 26 Q10 30 9 42 L8 60 Q10 62 18 62 L18 44 Q18 34 14 28 Z" fill={C.hair} />
        <path d="M52 26 Q54 30 55 42 L56 60 Q54 62 46 62 L46 44 Q46 34 50 28 Z" fill={C.hair} />
      </g>
    ),
    front: (
      <g>
        {/* Main top */}
        <path d="M14 34 Q13 16 32 10 Q51 16 50 34 Q48 28 44 20 Q38 14 32 13 Q26 14 20 20 Q16 28 14 34 Z"
          fill="url(#ht-hair)" />
        {/* Left curtain */}
        <path d="M14 30 Q12 26 12 20 L10 52 Q11 56 14 56 L14 34 Z" fill="url(#ht-hairSide)" />
        {/* Right curtain */}
        <path d="M50 30 Q52 26 52 20 L54 52 Q53 56 50 56 L50 34 Z" fill="url(#ht-hairSide)" />
        {/* Center part */}
        <path d="M32 10 L32 18" stroke={C.skin} strokeWidth="1" opacity="0.4" />
        {/* Strand texture */}
        <Strands paths={[
          'M12 24 L10 50', 'M13 22 L11 48', 'M52 24 L54 50', 'M51 22 L53 48',
          'M14 20 L12 44', 'M50 20 L52 44',
        ]} opacity={0.15} />
        {/* Shine */}
        <path d="M22 12 Q32 9 42 12 Q36 10 28 10 Z" fill={C.hairShine} opacity="0.4" />
      </g>
    ),
  },

  'Ponytail': {
    behind: (
      <g>
        {/* Ponytail body */}
        <path d="M48 20 Q56 18 58 24 Q60 34 57 46 Q55 52 50 54
               Q52 48 53 40 Q54 30 51 24 Z" fill={C.hair} />
        <path d="M50 50 Q53 56 49 60 Q47 58 49 54 Z" fill={C.hair} />
        {/* Tail strands */}
        <Strands paths={[
          'M52 24 Q54 34 52 48', 'M54 26 Q56 36 54 50',
        ]} opacity={0.2} />
      </g>
    ),
    front: (
      <g>
        {/* Swept-back top */}
        <path d="M14 34 Q13 16 32 10 Q51 16 50 34
               Q48 26 44 20 Q38 14 32 13 Q26 14 20 20 Q16 26 14 34 Z"
          fill="url(#ht-hair)" />
        {/* Pulled-back texture */}
        <Strands paths={[
          'M20 16 Q28 20 40 16', 'M22 18 Q30 22 42 18',
          'M24 20 Q32 24 44 20',
        ]} color={C.hairShine} opacity={0.2} />
        {/* Hair tie */}
        <ellipse cx="50" cy="22" rx="3" ry="3.5" fill={C.tie} />
        <ellipse cx="50" cy="22" rx="2" ry="2.2" fill={C.tieLight} opacity="0.5" />
        {/* Shine */}
        <path d="M26 12 Q32 9 38 12 Q34 10 28 10 Z" fill={C.hairShine} opacity="0.4" />
      </g>
    ),
  },

  'Braids': {
    behind: (
      <g>
        <path d="M16 38 L14 60 Q16 62 18 60 L20 38 Z" fill={C.hair} />
        <path d="M44 38 L42 60 Q44 62 46 60 L48 38 Z" fill={C.hair} />
      </g>
    ),
    front: (
      <g>
        {/* Top */}
        <path d="M14 34 Q13 16 32 10 Q51 16 50 34 Q48 28 44 20 Q38 14 32 13 Q26 14 20 20 Q16 28 14 34 Z"
          fill="url(#ht-hair)" />
        <path d="M32 10 L32 18" stroke={C.skin} strokeWidth="0.8" opacity="0.4" />
        {/* Left braid */}
        <g>
          {[0, 1, 2, 3, 4].map(i => (
            <path key={`lb${i}`}
              d={`M${15 + (i % 2 ? -1 : 1)} ${34 + i * 5} L${15 + (i % 2 ? 1 : -1)} ${38 + i * 5} L${17 + (i % 2 ? -1 : 1)} ${38 + i * 5} Z`}
              fill={i % 2 ? C.hairMid : C.hair} />
          ))}
          <circle cx="15" cy="58" r="2" fill={C.tie} />
        </g>
        {/* Right braid */}
        <g>
          {[0, 1, 2, 3, 4].map(i => (
            <path key={`rb${i}`}
              d={`M${49 + (i % 2 ? 1 : -1)} ${34 + i * 5} L${49 + (i % 2 ? -1 : 1)} ${38 + i * 5} L${47 + (i % 2 ? 1 : -1)} ${38 + i * 5} Z`}
              fill={i % 2 ? C.hairMid : C.hair} />
          ))}
          <circle cx="49" cy="58" r="2" fill={C.tie} />
        </g>
        {/* Shine */}
        <path d="M22 12 Q32 9 42 12 Q36 10 28 10 Z" fill={C.hairShine} opacity="0.35" />
      </g>
    ),
  },

  'Curly Afro': {
    front: (
      <g>
        {/* Large afro silhouette */}
        <path d="M6 40 Q4 28 8 16 Q12 8 20 5 Q26 1 32 1 Q38 1 44 5 Q52 8 56 16 Q60 28 58 40
               Q58 46 54 48 Q52 38 52 32 Q52 18 32 12 Q12 18 12 32 Q12 38 10 48 Q6 46 6 40 Z"
          fill={C.hair} />
        {/* Curly texture - circles */}
        {[
          [8, 22, 3.5], [56, 22, 3.5], [6, 34, 3], [58, 34, 3],
          [12, 10, 3], [52, 10, 3], [22, 3, 2.5], [42, 3, 2.5],
          [32, 1, 2.5], [10, 28, 2.5], [54, 28, 2.5],
          [16, 6, 2], [48, 6, 2],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={C.hair} />
        ))}
        {/* Inner texture bumps */}
        {[
          [14, 14, 2], [50, 14, 2], [20, 6, 1.5], [44, 6, 1.5],
          [28, 2, 1.5], [36, 2, 1.5],
        ].map(([cx, cy, r], i) => (
          <circle key={`t${i}`} cx={cx} cy={cy} r={r} fill={C.hairMid} opacity="0.4" />
        ))}
        {/* Shine highlight */}
        <path d="M20 4 Q28 0 38 3 Q32 -1 24 2 Z" fill={C.hairShine} opacity="0.35" />
        <ellipse cx="18" cy="10" rx="4" ry="2.5" fill={C.hairShine} opacity="0.15" />
      </g>
    ),
  },

  'Double Bun': {
    front: (
      <g>
        {/* Top hair base */}
        <path d="M14 34 Q13 18 22 13 Q28 9 32 9 Q36 9 42 13 Q51 18 50 34
               Q48 28 44 22 Q38 16 32 15 Q26 16 20 22 Q16 28 14 34 Z"
          fill="url(#ht-hair)" />
        {/* Center part */}
        <path d="M32 9 L32 18" stroke={C.skin} strokeWidth="0.8" opacity="0.4" />
        {/* Left bun */}
        <circle cx="20" cy="8" r="7" fill={C.hair} />
        <circle cx="20" cy="8" r="7" fill="url(#ht-shine)" />
        <path d="M14 8 Q17 4 20 3 Q23 4 26 8" stroke={C.hairMid} strokeWidth="0.6" fill="none" opacity="0.4" />
        {/* Right bun */}
        <circle cx="44" cy="8" r="7" fill={C.hair} />
        <circle cx="44" cy="8" r="7" fill="url(#ht-shine)" />
        <path d="M38 8 Q41 4 44 3 Q47 4 50 8" stroke={C.hairMid} strokeWidth="0.6" fill="none" opacity="0.4" />
        {/* Bun wraps */}
        <path d="M15 10 Q20 14 25 10" stroke={C.hairMid} strokeWidth="0.5" fill="none" opacity="0.3" />
        <path d="M39 10 Q44 14 49 10" stroke={C.hairMid} strokeWidth="0.5" fill="none" opacity="0.3" />
      </g>
    ),
  },

  // ==================== SPECIAL STYLES ====================

  'Cornrows': {
    front: (
      <g>
        {/* Base tight to scalp */}
        <path d="M15 34 Q14 18 22 13 Q28 9 32 9 Q36 9 42 13 Q50 18 49 34" fill={C.hair} opacity="0.6" />
        {/* Cornrow lines - front to back */}
        {[20, 24, 28, 32, 36, 40, 44].map((x, i) => (
          <g key={i}>
            <path
              d={`M${x} ${14 + Math.abs(x - 32) * 0.3} Q${x} ${20 + Math.abs(x - 32) * 0.2} ${x + (x < 32 ? -2 : x > 32 ? 2 : 0)} 28`}
              stroke={C.hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path
              d={`M${x} ${14 + Math.abs(x - 32) * 0.3} Q${x} ${20 + Math.abs(x - 32) * 0.2} ${x + (x < 32 ? -2 : x > 32 ? 2 : 0)} 28`}
              stroke={C.hairMid} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />
          </g>
        ))}
        {/* Scalp lines between rows */}
        {[22, 26, 30, 34, 38, 42].map((x, i) => (
          <path key={`s${i}`}
            d={`M${x} ${14 + Math.abs(x - 32) * 0.3} L${x + (x < 32 ? -1 : 1)} 26`}
            stroke={C.skin} strokeWidth="0.5" fill="none" opacity="0.3" />
        ))}
        {/* Shine */}
        <path d="M26 12 Q32 10 38 12 Q34 11 30 11 Z" fill={C.hairShine} opacity="0.3" />
      </g>
    ),
  },

  'Dreadlocks': {
    behind: (
      <g>
        {/* Back dreads */}
        <path d="M14 30 L10 58 Q12 60 15 58 L18 34 Z" fill={C.hair} />
        <path d="M50 30 L54 58 Q52 60 49 58 L46 34 Z" fill={C.hair} />
        <path d="M22 28 L18 56 Q20 58 22 56 L24 30 Z" fill={C.hairMid} />
        <path d="M42 28 L46 56 Q44 58 42 56 L40 30 Z" fill={C.hairMid} />
      </g>
    ),
    front: (
      <g>
        {/* Top volume */}
        <path d="M14 34 Q13 16 32 10 Q51 16 50 34 Q48 28 44 20 Q38 14 32 13 Q26 14 20 20 Q16 28 14 34 Z"
          fill="url(#ht-hair)" />
        {/* Individual dread locks hanging */}
        {[
          ['M14 30 Q12 38 10 50 Q11 52 13 50 Q14 42 15 34', C.hair],
          ['M17 28 Q16 36 15 46 Q16 48 18 46 Q18 38 18 32', C.hairMid],
          ['M48 28 Q48 36 49 46 Q48 48 46 46 Q46 38 47 32', C.hairMid],
          ['M50 30 Q52 38 54 50 Q53 52 51 50 Q50 42 49 34', C.hair],
        ].map(([d, fill], i) => (
          <path key={i} d={d as string} fill={fill as string} />
        ))}
        {/* Dread texture bumps */}
        {[
          [11, 40, 1.5], [13, 44, 1.3], [16, 38, 1.3], [17, 42, 1.2],
          [53, 40, 1.5], [51, 44, 1.3], [48, 38, 1.3], [47, 42, 1.2],
        ].map(([cx, cy, r], i) => (
          <circle key={`b${i}`} cx={cx} cy={cy} r={r} fill={C.hairMid} opacity="0.3" />
        ))}
        {/* Shine */}
        <path d="M22 12 Q32 9 42 12 Q36 10 28 10 Z" fill={C.hairShine} opacity="0.35" />
      </g>
    ),
  },
};

// --- Hair group definitions for subcategory tabs ---
export type HairGroup = 'short' | 'medium' | 'long' | 'special';

export const HAIR_GROUPS: Record<HairGroup, { label: string; styles: string[] }> = {
  short: {
    label: '짧은 머리',
    styles: ['Bald', 'Buzz Cut', 'Crew Cut', 'Short Wavy', 'Side Part', 'Slicked Back', 'Undercut', 'Mohawk'],
  },
  medium: {
    label: '중간 머리',
    styles: ['Top Knot', 'Man Bun', 'Bob Cut', 'Bangs', 'Pixie Cut'],
  },
  long: {
    label: '긴 머리',
    styles: ['Long Straight', 'Ponytail', 'Braids', 'Curly Afro', 'Double Bun'],
  },
  special: {
    label: '특수 스타일',
    styles: ['Cornrows', 'Dreadlocks'],
  },
};

export const ALL_HAIR_STYLES = Object.values(HAIR_GROUPS).flatMap(g => g.styles);

export function HAIR_THUMBNAIL_URL(style: string): string {
  const filename = style.toLowerCase().replace(/\s+/g, '-') + '.png';
  return `/thumbnails/${filename}`;
}

export const HairThumbnail: React.FC<HairThumbnailProps> = ({
  style,
  size = 64,
  className = '',
}) => {
  const layers = HAIR_LAYERS[style];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`${style} hairstyle`}
    >
      <Defs />
      {layers?.behind}
      <FaceBase />
      {layers?.front}
    </svg>
  );
};
