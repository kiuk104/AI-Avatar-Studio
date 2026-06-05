import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Palette, 
  Image as ImageIcon,
  Loader2,
  Ban,
  History,
  Upload,
  X,
  Zap,
  UserCircle,
  Scissors,
  Eye,
  Shirt,
  Glasses,
  ChevronDown,
  Camera,
  Smile,
  Cloud,
  Wind,
  Ear,
  User as UserIcon,
  AlertTriangle,
  Type,
  Settings,
  MoreHorizontal,
  Circle,
  Check,
  Lock,
  Layers
} from 'lucide-react';
import { generateAvatar, editAvatar } from './services/geminiService';
import { HAIR_GROUPS, ALL_HAIR_STYLES, HAIR_THUMBNAIL_URL, FaceThumbnail, hasFaceThumb } from './components/thumbnails';
import type { HairGroup } from './components/thumbnails';
import { ColorSwatch } from './components/ColorSwatch';
import EmotionSheetTab from './components/EmotionSheetTab';
import { exportAvatarPsd } from './utils/psdExport';
import { loadAvatars, saveAvatar as dbSaveAvatar, deleteAvatar as dbDeleteAvatar, migrateFromLocalStorage, saveEmotionSheet } from './utils/avatarDB';
import type { SavedAvatar, BuilderSettings } from './utils/avatarDB';
import { logApiCall, getTodayUsage, getMonthUsage, getAllUsage, sumUsage, formatTokens, DAILY_WARN, MONTHLY_WARN } from './utils/apiTracker';
import type { DailyUsage } from './utils/apiTracker';

const STYLES = [
  { id: '3d-render', name: '3D Render', description: 'Modern Pixar-style 3D character', prompt: 'Pixar/Disney style 3D rendered character, high quality 3D render, smooth surfaces, soft studio lighting, subsurface scattering on skin' },
  { id: 'memoji', name: 'Memoji', description: 'Apple-style 3D avatar aesthetic', prompt: 'Apple Memoji style, soft 3D cartoon, pastel colors, friendly rounded features, clean 3D render, simple solid background' },
  { id: 'emoji', name: 'Emoji', description: '메신저 이모지 느낌의 플랫 스타일 (famillie-kim)', prompt: 'flat 2D emoji style, simple bold rounded shapes, smooth solid bright colors, minimal shading, clean thick edges, friendly expressive face like a modern messaging-app emoji or sticker, centered, plain solid background' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean, flat vector illustration', prompt: 'flat vector illustration, clean lines, minimal details, simple geometric shapes, limited flat color palette, no gradients, graphic design style' },
  { id: 'pixel-art', name: 'Pixel Art', description: 'Retro 8-bit aesthetic', prompt: 'retro 8-bit pixel art style, clearly pixelated, limited color palette, no anti-aliasing, blocky pixels visible, retro game aesthetic' },
  { id: 'pixel-memoji', name: 'Pixel Memoji', description: '둥근 캐릭터 픽셀 아바타 (감정차트 시트용)', prompt: 'cute pixel-art avatar portrait, chunky visible pixels but soft rounded memoji-like face, warm limited color palette, gentle soft shading, friendly expressive character, clean solid background, NOT a harsh retro game sprite' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon-lit futuristic look', prompt: 'cyberpunk style, neon-lit, dark moody background with neon glow effects, futuristic sci-fi aesthetic, holographic accents, dramatic lighting' },
  { id: 'sketch', name: 'Hand Drawn', description: 'Artistic charcoal or pencil sketch', prompt: 'pencil sketch style, hand-drawn charcoal illustration, artistic hatching and cross-hatching, paper texture, monochrome grayscale, traditional art look' },
  { id: 'anime', name: 'Anime', description: 'Classic Japanese animation style', prompt: 'Japanese anime style, large expressive eyes, cel-shaded coloring, manga aesthetic, clean lineart, vibrant saturated colors, anime character design' },
];

const thumbUrl = (cat: string, opt: string) =>
  `/thumbnails/${cat}-${opt.toLowerCase().replace(/\s+/g, '-')}.png`;

const HAIR_COLORS = {
  natural: { label: '자연 컬러', colors: { 'Black': '#1A1A1A', 'Dark Brown': '#3B2314', 'Brown': '#6B4226', 'Auburn': '#8B3A1A', 'Blonde': '#D4A84B', 'Platinum': '#E8E0D0', 'Gray': '#9E9E9E', 'White': '#F5F5F5' } },
  special: { label: '특수 컬러', colors: { 'Red': '#E53935', 'Pink': '#EC407A', 'Purple': '#8E24AA', 'Blue': '#1E88E5', 'Green': '#43A047' } },
};

const OUTFIT_COLORS: Record<string, string> = {
  'Black': '#1A1A1A', 'White': '#F5F5F5', 'Navy': '#1A237E', 'Red': '#D32F2F',
  'Gray': '#616161', 'Beige': '#D7CCC8', 'Green': '#2E7D32', 'Blue': '#1565C0',
  'Pink': '#E91E63', 'Brown': '#5D4037',
};

// v3 color swatches (color-type attributes). Empty string = sentinel rendered as a ⊘ chip:
// 'None' (blush/eyeshadow) or 'Match Hair' (inherits hair color — brow/facial-hair color).
const EYE_COLORS: Record<string, string> = {
  'Dark Brown': '#3B2314', 'Brown': '#6B4226', 'Hazel': '#8B6B3A', 'Amber': '#C57B2C',
  'Green': '#4A7C3A', 'Blue': '#3A6EA5', 'Gray': '#7B8794',
};
const LIP_COLORS: Record<string, string> = {
  'Natural': '#C68B7B', 'Nude': '#D8A48F', 'Pink': '#E68FA3', 'Coral': '#F08060',
  'Red': '#C8324B', 'Berry': '#8E3B5C', 'Brown': '#8B5A3C',
};
const BLUSH_COLORS: Record<string, string> = {
  'None': '', 'Rosy': '#E8889A', 'Peach': '#F0A878', 'Coral': '#F08060', 'Mauve': '#C08CA8',
};
const EYESHADOW_COLORS: Record<string, string> = {
  'None': '', 'Neutral': '#C9A98C', 'Smoky': '#6B6B6B', 'Warm': '#B5703C', 'Cool': '#7B8FB0',
};
const BROW_COLORS: Record<string, string> = {
  'Match Hair': '', 'Black': '#1A1A1A', 'Brown': '#6B4226', 'Blonde': '#D4A84B', 'Gray': '#9E9E9E',
};
const FACIAL_HAIR_COLORS: Record<string, string> = {
  'Match Hair': '', 'Black': '#1A1A1A', 'Brown': '#6B4226', 'Gray': '#9E9E9E',
};

// v3 shape-type option lists (no thumbnails yet → text-chip fallback; SVG thumbnails in step 5).
const SHAPE_OPTS = {
  freckles: ['None', 'Light', 'Medium', 'Heavy'],
  skinFinish: ['Natural', 'Matte', 'Dewy'],
  forehead: ['Low', 'Average', 'High'],
  chin: ['Round', 'Pointed', 'Square', 'Cleft'],
  cheekbones: ['Low', 'Average', 'High'],
  wrinkles: ['None', 'Light', 'Defined'],
  eyeSize: ['Small', 'Medium', 'Large'],
  eyelid: ['Monolid', 'Single', 'Double'],
  eyelashes: ['Natural', 'Long', 'Dramatic'],
  noseBridge: ['Low', 'Average', 'High'],
  earShape: ['Small', 'Average', 'Large', 'Pointed', 'Round'],
  earPosition: ['High', 'Average', 'Low'],
  facePaint: ['None', 'Cheek Hearts', 'Star', 'Sport Stripes', 'Festival'],
} as const;

const BUILDER_OPTIONS = {
  gender: {
    name: '성별',
    icon: User,
    options: ['Male', 'Female', 'Non-binary'],
    thumbnails: Object.fromEntries(['Male', 'Female', 'Non-binary'].map(s => [s, thumbUrl('gender', s)])),
  },
  skin: {
    name: '피부',
    icon: Smile,
    options: ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Golden', 'Olive'],
    colors: {
      'Fair': '#F9E4D4', 'Light': '#F3D0B5', 'Medium': '#E6B99C',
      'Tan': '#C68E65', 'Deep': '#8D5524', 'Golden': '#E1AD72', 'Olive': '#AD8C6D',
    },
  },
  hair: {
    name: '헤어스타일',
    icon: Scissors,
    options: ALL_HAIR_STYLES,
    thumbnails: Object.fromEntries(ALL_HAIR_STYLES.map(s => [s, HAIR_THUMBNAIL_URL(s)])),
    groups: HAIR_GROUPS,
  },
  eyebrows: {
    name: '눈썹',
    icon: Wind,
    options: ['Natural', 'Thin', 'Thick', 'Arched', 'Straight', 'Bushy'],
    thumbnails: Object.fromEntries(['Natural', 'Thin', 'Thick', 'Arched', 'Straight', 'Bushy'].map(s => [s, thumbUrl('eyebrows', s)])),
  },
  eyes: {
    name: '눈',
    icon: Eye,
    options: ['Round', 'Almond', 'Hooded', 'Monolid', 'Droopy', 'Wide'],
    colors: { 'Brown': '#3E2723', 'Blue': '#0277BD', 'Green': '#2E7D32', 'Grey': '#546E7A', 'Hazel': '#795548', 'Amber': '#FFB300' },
  },
  face: {
    name: '얼굴',
    icon: UserIcon,
    options: ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Long'],
    thumbnails: Object.fromEntries(['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Long'].map(s => [s, thumbUrl('face', s)])),
  },
  nose: {
    name: '코',
    icon: Cloud,
    options: ['Small', 'Pointy', 'Wide', 'Button', 'Hooked', 'Flat'],
    thumbnails: Object.fromEntries(['Small', 'Pointy', 'Wide', 'Button', 'Hooked', 'Flat'].map(s => [s, thumbUrl('nose', s)])),
  },
  lips: {
    name: '입',
    icon: Smile,
    options: ['Natural', 'Thin', 'Full', 'Wide', 'Small', 'Pouty'],
    thumbnails: Object.fromEntries(['Natural', 'Thin', 'Full', 'Wide', 'Small', 'Pouty'].map(s => [s, thumbUrl('lips', s)])),
  },
  facialHair: {
    name: '수염',
    icon: MoreHorizontal,
    options: ['None', 'Stubble', 'Goatee', 'Full Beard', 'Mustache', 'Circle Beard'],
    thumbnails: Object.fromEntries(['None', 'Stubble', 'Goatee', 'Full Beard', 'Mustache', 'Circle Beard'].map(s => [s, thumbUrl('facialHair', s)])),
    genderFilter: Object.fromEntries(['Stubble', 'Goatee', 'Full Beard', 'Mustache', 'Circle Beard'].map(s => [s, ['Male', 'Non-binary']])) as Record<string, string[]>,
  },
  glasses: {
    name: '안경',
    icon: Glasses,
    options: ['None', 'Rectangular', 'Round', 'Aviator', 'Cat Eye', 'Wayfarer'],
    thumbnails: Object.fromEntries(['None', 'Rectangular', 'Round', 'Aviator', 'Cat Eye', 'Wayfarer'].map(s => [s, thumbUrl('glasses', s)])),
  },
  earrings: {
    name: '귀걸이',
    icon: Circle,
    options: ['None', 'Stud', 'Hoop', 'Drop'],
    thumbnails: Object.fromEntries(['None', 'Stud', 'Hoop', 'Drop'].map(s => [s, thumbUrl('earrings', s)])),
  },
  necklace: {
    name: '목걸이',
    icon: Circle,
    options: ['None', 'Chain', 'Pendant', 'Choker'],
    thumbnails: Object.fromEntries(['None', 'Chain', 'Pendant', 'Choker'].map(s => [s, thumbUrl('necklace', s)])),
  },
  headwear: {
    name: '헤드웨어',
    icon: Circle,
    options: ['None', 'Beanie', 'Baseball Cap', 'Beret', 'Fedora', 'Headband', 'Turban'],
    thumbnails: Object.fromEntries(['None', 'Beanie', 'Baseball Cap', 'Beret', 'Fedora', 'Headband', 'Turban'].map(s => [s, thumbUrl('headwear', s)])),
  },
  outfit: {
    name: '옷',
    icon: Shirt,
    options: ['T-Shirt', 'Hoodie', 'Suit', 'Dress', 'Sweater', 'Jacket', 'Tank Top', 'Turtleneck', 'Polo Shirt'],
    thumbnails: Object.fromEntries(['T-Shirt', 'Hoodie', 'Suit', 'Dress', 'Sweater', 'Jacket', 'Tank Top', 'Turtleneck', 'Polo Shirt'].map(s => [s, thumbUrl('outfit', s)])),
    genderFilter: { 'Dress': ['Female', 'Non-binary'] } as Record<string, string[]>,
  },
  // v3 new categories — meta only (name + icon); their attribute controls live in PANELS below.
  ears: {
    name: '귀',
    icon: Ear,
  },
  makeup: {
    name: '화장',
    icon: Palette,
  },
};

// One attribute control inside a category panel. A category may hold several (subsections).
type Attr =
  | {
      kind: 'grid';
      field: keyof BuilderSettings;
      title: string;
      options: readonly string[];
      thumbnails?: Record<string, string>;
      genderFilter?: Record<string, string[]>;
      hairGroups?: true; // special: render HAIR_GROUPS tabs and group styles
    }
  | {
      kind: 'swatch';
      field: keyof BuilderSettings;
      title: string;
      groups: { label?: string; colors: Record<string, string> }[];
      size?: 'sm' | 'md';
    };

// Drives the builder panel: each category → ordered attribute controls. Existing categories are
// here too (single-attribute), so the panel renders through one code path. field/category keys are
// type-checked, so a typo or a field missing from BuilderSettings fails tsc.
const PANELS: Record<keyof typeof BUILDER_OPTIONS, Attr[]> = {
  skin: [
    { kind: 'swatch', field: 'skin', title: 'Skin Tone', groups: [{ colors: (BUILDER_OPTIONS.skin as any).colors }] },
    { kind: 'grid', field: 'freckles', title: 'Freckles', options: SHAPE_OPTS.freckles },
    { kind: 'grid', field: 'skinFinish', title: 'Skin Finish', options: SHAPE_OPTS.skinFinish },
  ],
  face: [
    { kind: 'grid', field: 'face', title: 'Face Shape', options: BUILDER_OPTIONS.face.options, thumbnails: (BUILDER_OPTIONS.face as any).thumbnails },
    { kind: 'grid', field: 'forehead', title: 'Forehead', options: SHAPE_OPTS.forehead },
    { kind: 'grid', field: 'chin', title: 'Chin', options: SHAPE_OPTS.chin },
    { kind: 'grid', field: 'cheekbones', title: 'Cheekbones', options: SHAPE_OPTS.cheekbones },
    { kind: 'grid', field: 'wrinkles', title: 'Wrinkles', options: SHAPE_OPTS.wrinkles },
  ],
  eyebrows: [
    { kind: 'grid', field: 'eyebrows', title: 'Eyebrow Style', options: BUILDER_OPTIONS.eyebrows.options, thumbnails: (BUILDER_OPTIONS.eyebrows as any).thumbnails },
    { kind: 'swatch', field: 'browColor', title: 'Eyebrow Color', groups: [{ colors: BROW_COLORS }] },
  ],
  eyes: [
    { kind: 'grid', field: 'eyes', title: 'Eye Shape', options: BUILDER_OPTIONS.eyes.options },
    { kind: 'grid', field: 'eyeSize', title: 'Eye Size', options: SHAPE_OPTS.eyeSize },
    { kind: 'grid', field: 'eyelid', title: 'Eyelid', options: SHAPE_OPTS.eyelid },
    { kind: 'swatch', field: 'eyeColor', title: 'Eye Color', groups: [{ colors: EYE_COLORS }] },
    { kind: 'grid', field: 'eyelashes', title: 'Eyelashes', options: SHAPE_OPTS.eyelashes },
  ],
  nose: [
    { kind: 'grid', field: 'nose', title: 'Nose Shape', options: BUILDER_OPTIONS.nose.options, thumbnails: (BUILDER_OPTIONS.nose as any).thumbnails },
    { kind: 'grid', field: 'noseBridge', title: 'Nose Bridge', options: SHAPE_OPTS.noseBridge },
  ],
  lips: [
    { kind: 'grid', field: 'lips', title: 'Lip Style', options: BUILDER_OPTIONS.lips.options, thumbnails: (BUILDER_OPTIONS.lips as any).thumbnails },
    { kind: 'swatch', field: 'lipColor', title: 'Lip Color', groups: [{ colors: LIP_COLORS }] },
  ],
  ears: [
    { kind: 'grid', field: 'earShape', title: 'Ear Shape', options: SHAPE_OPTS.earShape },
    { kind: 'grid', field: 'earPosition', title: 'Ear Position', options: SHAPE_OPTS.earPosition },
  ],
  hair: [
    { kind: 'grid', field: 'hair', title: 'Hairstyle', options: ALL_HAIR_STYLES, thumbnails: (BUILDER_OPTIONS.hair as any).thumbnails, hairGroups: true },
    {
      kind: 'swatch', field: 'hairColor', title: 'Hair Color', size: 'sm',
      groups: [
        { label: HAIR_COLORS.natural.label, colors: HAIR_COLORS.natural.colors },
        { label: HAIR_COLORS.special.label, colors: HAIR_COLORS.special.colors },
      ],
    },
  ],
  facialHair: [
    { kind: 'grid', field: 'facialHair', title: 'Facial Hair', options: BUILDER_OPTIONS.facialHair.options, thumbnails: (BUILDER_OPTIONS.facialHair as any).thumbnails, genderFilter: (BUILDER_OPTIONS.facialHair as any).genderFilter },
    { kind: 'swatch', field: 'facialHairColor', title: 'Facial Hair Color', groups: [{ colors: FACIAL_HAIR_COLORS }] },
  ],
  makeup: [
    { kind: 'swatch', field: 'blush', title: 'Blush', groups: [{ colors: BLUSH_COLORS }] },
    { kind: 'swatch', field: 'eyeshadow', title: 'Eyeshadow', groups: [{ colors: EYESHADOW_COLORS }] },
    { kind: 'grid', field: 'facePaint', title: 'Face Paint', options: SHAPE_OPTS.facePaint },
  ],
  glasses: [{ kind: 'grid', field: 'glasses', title: 'Glasses', options: BUILDER_OPTIONS.glasses.options, thumbnails: (BUILDER_OPTIONS.glasses as any).thumbnails }],
  earrings: [{ kind: 'grid', field: 'earrings', title: 'Earrings', options: BUILDER_OPTIONS.earrings.options, thumbnails: (BUILDER_OPTIONS.earrings as any).thumbnails }],
  necklace: [{ kind: 'grid', field: 'necklace', title: 'Necklace', options: BUILDER_OPTIONS.necklace.options, thumbnails: (BUILDER_OPTIONS.necklace as any).thumbnails }],
  headwear: [{ kind: 'grid', field: 'headwear', title: 'Headwear', options: BUILDER_OPTIONS.headwear.options, thumbnails: (BUILDER_OPTIONS.headwear as any).thumbnails }],
  outfit: [
    { kind: 'grid', field: 'outfit', title: 'Outfit', options: BUILDER_OPTIONS.outfit.options, thumbnails: (BUILDER_OPTIONS.outfit as any).thumbnails, genderFilter: (BUILDER_OPTIONS.outfit as any).genderFilter },
    { kind: 'swatch', field: 'outfitColor', title: 'Outfit Color', size: 'sm', groups: [{ colors: OUTFIT_COLORS }] },
  ],
  gender: [{ kind: 'grid', field: 'gender', title: 'Gender', options: BUILDER_OPTIONS.gender.options, thumbnails: (BUILDER_OPTIONS.gender as any).thumbnails }],
};

const MAX_SAVED = 50;

// Human-readable labels for each builder attribute, used to phrase delta-edit instructions.
const LABEL: Record<keyof BuilderSettings, string> = {
  glasses: 'glasses', earrings: 'earrings', necklace: 'necklace', headwear: 'headwear',
  hair: 'hairstyle', hairColor: 'hair color', eyebrows: 'eyebrow style', eyes: 'eye shape',
  face: 'face shape', nose: 'nose shape', lips: 'lip style', facialHair: 'facial hair',
  outfit: 'outfit', outfitColor: 'outfit color', skin: 'skin tone', gender: 'gender',
  // 신규 v3
  freckles: 'freckles', skinFinish: 'skin finish',
  forehead: 'forehead', chin: 'chin', cheekbones: 'cheekbones', wrinkles: 'wrinkles',
  browColor: 'eyebrow color',
  eyeSize: 'eye size', eyelid: 'eyelid type', eyeColor: 'eye color', eyelashes: 'eyelashes',
  noseBridge: 'nose bridge',
  lipColor: 'lip color',
  earShape: 'ear shape', earPosition: 'ear position',
  facialHairColor: 'facial hair color',
  blush: 'blush', eyeshadow: 'eyeshadow', facePaint: 'face paint',
};

// Build an edit instruction containing ONLY the changed attributes. Re-listing everything
// would make the model re-roll the whole character; the delta keeps identity intact.
function describeDelta(prev: BuilderSettings, next: BuilderSettings): string {
  const changes = (Object.keys(next) as (keyof BuilderSettings)[])
    .filter(k => prev[k] !== next[k])
    .map(k => `${LABEL[k]} to "${next[k]}"`);
  return changes.length ? `Change the ${changes.join(', ')}.` : '';
}

// Default attribute snapshot. Module-scoped so it's a stable reference usable inside callbacks
// (loadAvatar merges old saved records against it) without re-creating each render.
const defaultBuilderState: BuilderSettings = {
  gender: 'Male',
  skin: 'Medium',
  hair: 'Short Wavy',
  hairColor: 'Black',
  eyebrows: 'Natural',
  eyes: 'Round',
  face: 'Oval',
  nose: 'Small',
  lips: 'Natural',
  facialHair: 'None',
  glasses: 'None',
  earrings: 'None',
  necklace: 'None',
  headwear: 'None',
  outfit: 'T-Shirt',
  outfitColor: 'Black',
  // 신규 v3 — '없음/보통/Match Hair' 계열(프롬프트 비대화 방지 헬퍼의 생략 기준과 일치)
  freckles: 'None',
  skinFinish: 'Natural',
  forehead: 'Average',
  chin: 'Round',
  cheekbones: 'Average',
  wrinkles: 'None',
  browColor: 'Match Hair',
  eyeSize: 'Medium',
  eyelid: 'Double',
  eyeColor: 'Dark Brown',
  eyelashes: 'Natural',
  noseBridge: 'Average',
  lipColor: 'Natural',
  earShape: 'Average',
  earPosition: 'Average',
  facialHairColor: 'Match Hair',
  blush: 'None',
  eyeshadow: 'None',
  facePaint: 'None',
};

// Builder navigation: two top-level segments, each owning a subset of BUILDER_OPTIONS categories.
// New v3 categories (ears/makeup) slot into `cats` here in step 3. Keys are checked against
// keyof BUILDER_OPTIONS so a typo/missing category fails tsc.
const SEGMENTS = {
  appearance: { label: '외모', cats: ['skin', 'face', 'eyebrows', 'eyes', 'nose', 'lips', 'ears', 'hair', 'facialHair', 'makeup'] },
  style: { label: '스타일', cats: ['glasses', 'earrings', 'necklace', 'headwear', 'outfit', 'gender'] },
} as const satisfies Record<string, { label: string; cats: readonly (keyof typeof BUILDER_OPTIONS)[] }>;
type SegmentKey = keyof typeof SEGMENTS;

export default function App() {
  // Top-level feature tabs: A = 아바타 만들기(create/edit), B = 감정 시트.
  const [activeTab, setActiveTab] = useState<'create' | 'emotion'>('create');
  const [emotionBaseId, setEmotionBaseId] = useState<string | null>(null);
  const [mode, setMode] = useState<'text' | 'builder'>('text');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [savedAvatars, setSavedAvatars] = useState<SavedAvatar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Delta-edit base: identity the current image carries. Edit path is active when these are set.
  const [baseSnapshot, setBaseSnapshot] = useState<BuilderSettings | null>(null);
  const [baseStyleId, setBaseStyleId] = useState<string | null>(null);
  const [currentAvatarId, setCurrentAvatarId] = useState<string | null>(null);
  // First base, kept for "revert to original" (drift recovery). Persistence is a later step.
  const [originalBaseUrl, setOriginalBaseUrl] = useState<string | null>(null);
  const [originalBaseSnapshot, setOriginalBaseSnapshot] = useState<BuilderSettings | null>(null);
  const [originalBaseStyleId, setOriginalBaseStyleId] = useState<string | null>(null);

  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageToday, setUsageToday] = useState<DailyUsage | null>(null);
  const [usageMonth, setUsageMonth] = useState<DailyUsage[]>([]);
  const [usageAll, setUsageAll] = useState<DailyUsage[]>([]);

  // Builder State (defaultBuilderState is module-scoped above)
  const [builderState, setBuilderState] = useState<BuilderSettings>(defaultBuilderState);
  const [activeSegment, setActiveSegment] = useState<SegmentKey>('appearance');
  const [activeCategory, setActiveCategory] = useState<keyof typeof BUILDER_OPTIONS>('skin');
  const [activeHairGroup, setActiveHairGroup] = useState<HairGroup>('short');

  // Switching segment moves focus to its first category (the current one may not belong to it).
  const selectSegment = useCallback((seg: SegmentKey) => {
    setActiveSegment(seg);
    setActiveCategory(SEGMENTS[seg].cats[0]);
  }, []);

  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const refreshUsageStats = useCallback(async () => {
    const [today, month, all] = await Promise.all([getTodayUsage(), getMonthUsage(), getAllUsage()]);
    setUsageToday(today);
    setUsageMonth(month);
    setUsageAll(all);
  }, []);

  // Load avatars + usage from IndexedDB on mount (with localStorage migration)
  useEffect(() => {
    (async () => {
      await migrateFromLocalStorage();
      const avatars = await loadAvatars();
      setSavedAvatars(avatars);
      await refreshUsageStats();
    })();
  }, [refreshUsageStats]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // True when a builder base exists and there are pending changes to apply as a delta edit.
  // Shared by the "수정 적용" button (disabled state) and handleGenerate's edit early-return.
  const isEditBase = mode === 'builder' && !!currentAvatar && !!baseSnapshot;
  const hasPendingEdit = isEditBase &&
    (describeDelta(baseSnapshot!, builderState) !== '' || selectedStyle.id !== baseStyleId);

  // Render one attribute control (subsection) of the active category's panel. `showHeader` is on
  // when the category has more than one attribute (design §5). Closes over builder state/setters.
  const renderAttr = (attr: Attr, showHeader: boolean) => {
    const header = showHeader ? (
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{attr.title}</h3>
    ) : null;

    if (attr.kind === 'swatch') {
      return (
        <div key={attr.field} className="space-y-3">
          {header}
          {attr.groups.map((g, i) => (
            <ColorSwatch
              key={g.label ?? i}
              colors={g.colors}
              selected={builderState[attr.field] ?? ''}
              onSelect={(name) => setBuilderState(prev => ({ ...prev, [attr.field]: name }))}
              label={g.label}
              size={attr.size ?? 'md'}
            />
          ))}
        </div>
      );
    }

    const rawOptions = attr.hairGroups ? HAIR_GROUPS[activeHairGroup].styles : attr.options;
    const options = attr.genderFilter
      ? rawOptions.filter(opt => {
          const allowed = attr.genderFilter![opt];
          return !allowed || allowed.includes(builderState.gender);
        })
      : rawOptions;

    return (
      <div key={attr.field} className="space-y-4">
        {header}
        {attr.hairGroups && (
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(HAIR_GROUPS) as [HairGroup, typeof HAIR_GROUPS[HairGroup]][]).map(([key, group]) => (
              <button
                key={key}
                onClick={() => setActiveHairGroup(key)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeHairGroup === key
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'
                }`}
              >
                {group.label}
                <span className="ml-1.5 text-[9px] opacity-60">{group.styles.length}</span>
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {options.map((opt) => {
            const isSelected = builderState[attr.field] === opt;
            const thumb = attr.thumbnails?.[opt];
            const faceThumb = opt !== 'None' && hasFaceThumb(attr.field, opt); // SVG takes priority over PNG
            const hasVisual = opt === 'None' || faceThumb || !!thumb; // text-chip cells carry the name in the box, no duplicate label
            return (
              <button
                key={opt}
                onClick={() => setBuilderState(prev => ({ ...prev, [attr.field]: opt }))}
                className={`aspect-square rounded-[24px] border-2 flex flex-col items-center justify-center gap-2 transition-all group relative ${
                  isSelected ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                  {opt === 'None' ? (
                    <Ban className={`w-7 h-7 ${isSelected ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  ) : faceThumb ? (
                    <FaceThumbnail field={attr.field} option={opt} size={64} />
                  ) : thumb ? (
                    <img src={thumb} alt={opt} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className={`text-xs font-bold text-center leading-tight px-1 ${isSelected ? 'text-emerald-300' : 'text-zinc-300'}`}>{opt}</span>
                  )}
                </div>
                {hasVisual && (
                  <span className={`text-[10px] font-bold px-2 text-center leading-tight ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {opt}
                  </span>
                )}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-3 h-3 text-black font-bold" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleGenerate = useCallback(async (forceNew = false) => {
    const isEdit = mode === 'builder' && !!currentAvatar && !!baseSnapshot && !forceNew;

    // ----- Edit path: feed current avatar back as reference, change only the delta -----
    if (isEdit) {
      const attrDelta = describeDelta(baseSnapshot!, builderState);
      const styleChanged = selectedStyle.id !== baseStyleId;
      if (!attrDelta && !styleChanged) return; // nothing changed — skip the call (save quota)

      const instruction = [
        attrDelta,
        styleChanged ? `Re-render the SAME person in the "${selectedStyle.name}" art style.` : '',
      ].filter(Boolean).join(' ');

      setIsGenerating(true);
      setError(null);

      let result: Awaited<ReturnType<typeof editAvatar>>;
      try {
        result = await editAvatar(currentAvatar!, instruction, selectedStyle.name);
      } catch (err) {
        setError(`Failed to apply edit: ${err instanceof Error ? err.message : String(err)}`);
        console.error('[edit] Gemini call failed:', err);
        setIsGenerating(false);
        return;
      }

      setCurrentAvatar(result.imageUrl);
      setBaseSnapshot({ ...builderState });
      setBaseStyleId(selectedStyle.id);
      // originalBaseUrl / originalBaseSnapshot stay put — they anchor "revert to original".

      // Bookkeeping: log usage + in-place library update. Non-fatal if it fails.
      try {
        if (result.usage) {
          await logApiCall(result.usage);
          await refreshUsageStats();
        }

        // In-place update of the same library record (avoid history spam).
        if (currentAvatarId) {
          const existing = savedAvatars.find(a => a.id === currentAvatarId);
          const updated: SavedAvatar = {
            ...(existing ?? {}),                 // preserve originalBase* + emotionSheet
            id: currentAvatarId,
            createdAt: existing?.createdAt ?? Date.now(),
            imageUrl: result.imageUrl,
            settings: { ...builderState },
            styleId: selectedStyle.id,
            mode: 'builder',
            prompt: undefined,
          };
          await dbSaveAvatar(updated);
          setSavedAvatars(prev => prev.map(a => (a.id === currentAvatarId ? updated : a)));
        } else {
          // No record to update (e.g. edited a base that was never saved) — create one,
          // anchoring the original base to the pre-edit image/settings.
          const created: SavedAvatar = {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            imageUrl: result.imageUrl,
            settings: { ...builderState },
            styleId: selectedStyle.id,
            mode: 'builder',
            originalBaseUrl: originalBaseUrl ?? currentAvatar ?? result.imageUrl,
            originalBaseSnapshot: originalBaseSnapshot ?? baseSnapshot ?? { ...builderState },
            originalBaseStyleId: originalBaseStyleId ?? baseStyleId ?? selectedStyle.id,
          };
          await dbSaveAvatar(created);
          setCurrentAvatarId(created.id);
          setSavedAvatars(prev => [created, ...prev].slice(0, MAX_SAVED));
        }
        showToast('Edit applied!');
      } catch (err) {
        console.error('[edit] save/log failed:', err);
        setError(`Edited, but saving failed: ${err instanceof Error ? err.message : String(err)}`);
        showToast('Edited (not saved to library)');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // ----- Create path: confirm a fresh identity from text/spec -----
    let finalPrompt = prompt;
    let stylePrompt = selectedStyle.prompt;

    if (mode === 'builder') {
      // Build a structured spec so Gemini treats each attribute as a strict constraint
      const base = [
        `[CHARACTER SPEC — follow every attribute exactly]`,
        `Gender: ${builderState.gender}`,
        `Skin tone: ${builderState.skin}`,
        `Hair style: ${builderState.hair}`,
        `Hair color: ${builderState.hairColor}`,
        `Eyebrow style: ${builderState.eyebrows}`,
        `Eye shape: ${builderState.eyes}`,
        `Face shape: ${builderState.face}`,
        `Nose shape: ${builderState.nose}`,
        `Lip style: ${builderState.lips}`,
        `Facial hair: ${builderState.facialHair}`,
        `Glasses: ${builderState.glasses}`,
        `Earrings: ${builderState.earrings}`,
        `Necklace: ${builderState.necklace}`,
        `Headwear: ${builderState.headwear}`,
        `Outfit: ${builderState.outfitColor} ${builderState.outfit}`,
      ];

      // v3 refinements (color / makeup / fine shape). Only emit non-default values so the spec
      // stays lean — defaults match defaultBuilderState (§7, §10 prompt-bloat guard).
      const b = builderState;
      const extra: string[] = [];
      const addAttr = (label: string, value: string | undefined, def: string, text?: (v: string) => string) => {
        if (value && value !== def) extra.push(`${label}: ${text ? text(value) : value}`);
      };
      addAttr('Freckles', b.freckles, 'None', v => `${v.toLowerCase()} freckles`);
      addAttr('Skin finish', b.skinFinish, 'Natural');
      addAttr('Forehead', b.forehead, 'Average', v => `${v.toLowerCase()} forehead`);
      addAttr('Chin', b.chin, 'Round', v => `${v.toLowerCase()} chin`);
      addAttr('Cheekbones', b.cheekbones, 'Average', v => v === 'High' ? 'high and prominent' : 'low and flat');
      addAttr('Wrinkles', b.wrinkles, 'None', v => `${v.toLowerCase()} wrinkles`);
      addAttr('Eyebrow color', b.browColor, 'Match Hair');
      addAttr('Eye size', b.eyeSize, 'Medium', v => `${v.toLowerCase()} eyes`);
      addAttr('Eyelid', b.eyelid, 'Double', v => v === 'Monolid' ? 'monolid (no crease)' : 'single eyelid');
      addAttr('Eye color', b.eyeColor, 'Dark Brown');
      addAttr('Eyelashes', b.eyelashes, 'Natural', v => v === 'Dramatic' ? 'dramatic voluminous lashes' : 'long lashes');
      addAttr('Nose bridge', b.noseBridge, 'Average', v => `${v.toLowerCase()} nose bridge`);
      addAttr('Lip color', b.lipColor, 'Natural');
      addAttr('Ear shape', b.earShape, 'Average', v => `${v.toLowerCase()} ears`);
      addAttr('Ear position', b.earPosition, 'Average', v => v === 'High' ? 'high-set' : 'low-set');
      if (b.facialHair !== 'None') addAttr('Facial hair color', b.facialHairColor, 'Match Hair'); // moot without facial hair
      addAttr('Blush', b.blush, 'None', v => `${v.toLowerCase()} blush`);
      addAttr('Eyeshadow', b.eyeshadow, 'None', v => `${v.toLowerCase()} eyeshadow`);
      addAttr('Face paint', b.facePaint, 'None');

      const spec = [...base, ...extra].join('\n');

      finalPrompt = `Generate an avatar in "${selectedStyle.name}" art style: ${selectedStyle.prompt}.\nEXACTLY match the character specification below. Do NOT deviate from any attribute — each one is intentionally chosen by the user.\n\n${spec}\n\nIMPORTANT: Render the character exactly as specified above. Do not change, add, or omit any feature. The ENTIRE image must be rendered in "${selectedStyle.name}" style as described above. Front-facing view, centered, clean solid background.`;
      // stylePrompt already set to selectedStyle.prompt above — do not override
    } else {
      // For text mode, default to front view if no camera-related keywords are present
      const cameraKeywords = ['view', 'angle', 'shot', 'profile', 'facing', 'side', 'back', 'top', 'bottom'];
      const hasCameraSetting = cameraKeywords.some(keyword => finalPrompt.toLowerCase().includes(keyword));

      if (!hasCameraSetting && finalPrompt.trim()) {
        finalPrompt = `${finalPrompt}, front view, facing camera`;
      }
    }

    if (!finalPrompt.trim() && mode === 'text') return;

    setIsGenerating(true);
    setError(null);

    // Generation is the expensive, fail-prone step — its failure is the only one that means
    // "couldn't generate". Persistence/logging run afterwards and must not discard a good image.
    let result: Awaited<ReturnType<typeof generateAvatar>>;
    try {
      // Reference image is a TEXT-mode feature. In builder mode it must NOT be sent — a leftover
      // upload would make Gemini copy the reference's style and ignore the selected art style
      // (symptom: every style renders the same). Only pass it for text-mode generations.
      const refForGen = mode === 'text' ? (referenceImage || undefined) : undefined;
      result = await generateAvatar(finalPrompt, stylePrompt, refForGen);
    } catch (err) {
      setError(`Failed to generate avatar: ${err instanceof Error ? err.message : String(err)}`);
      console.error('[generate] Gemini call failed:', err);
      setIsGenerating(false);
      return;
    }

    setCurrentAvatar(result.imageUrl);
    // Establish the editable base up front so a later save/log hiccup can't strand it
    // (builder only — text saves carry a default snapshot, so no edit base).
    if (mode === 'builder') {
      const snap = { ...builderState };
      setBaseSnapshot(snap);
      setBaseStyleId(selectedStyle.id);
      setOriginalBaseUrl(result.imageUrl);
      setOriginalBaseSnapshot(snap);
      setOriginalBaseStyleId(selectedStyle.id);
    } else {
      setBaseSnapshot(null);
      setBaseStyleId(null);
      setOriginalBaseUrl(null);
      setOriginalBaseSnapshot(null);
      setOriginalBaseStyleId(null);
    }

    const saved: SavedAvatar = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      imageUrl: result.imageUrl,
      settings: { ...builderState },
      styleId: selectedStyle.id,
      mode,
      prompt: mode === 'text' ? prompt : undefined,
      // Builder avatars anchor their original base here (text saves have no edit base).
      ...(mode === 'builder' ? {
        originalBaseUrl: result.imageUrl,
        originalBaseSnapshot: { ...builderState },
        originalBaseStyleId: selectedStyle.id,
      } : {}),
    };

    // Bookkeeping: log usage + persist. Failures here are non-fatal — the avatar still stands.
    try {
      if (result.usage) {
        await logApiCall(result.usage);
        await refreshUsageStats();
      }
      await dbSaveAvatar(saved);
      setSavedAvatars(prev => [saved, ...prev].slice(0, MAX_SAVED));
      setCurrentAvatarId(saved.id);
      showToast('Avatar saved!');
    } catch (err) {
      console.error('[generate] save/log failed:', err);
      setError(`Generated, but saving failed: ${err instanceof Error ? err.message : String(err)}`);
      showToast('Generated (not saved to library)');
    } finally {
      setIsGenerating(false);
    }
  }, [mode, prompt, selectedStyle, builderState, referenceImage, currentAvatar, baseSnapshot, baseStyleId, currentAvatarId, savedAvatars, originalBaseUrl, originalBaseSnapshot, originalBaseStyleId, showToast, refreshUsageStats]);

  const revertToOriginal = useCallback(() => {
    if (!originalBaseUrl || !originalBaseSnapshot) return;
    setCurrentAvatar(originalBaseUrl);
    setBuilderState(originalBaseSnapshot);
    setBaseSnapshot(originalBaseSnapshot);
    // Restore the style too, so the selector matches the reverted image and no spurious
    // style delta is pending right after reverting (selectedStyle === baseStyleId).
    if (originalBaseStyleId) {
      const s = STYLES.find(x => x.id === originalBaseStyleId);
      if (s) setSelectedStyle(s);
      setBaseStyleId(originalBaseStyleId);
    }
    showToast('Reverted to original');
  }, [originalBaseUrl, originalBaseSnapshot, originalBaseStyleId, showToast]);

  const loadAvatar = useCallback((avatar: SavedAvatar) => {
    setCurrentAvatar(avatar.imageUrl);
    // Merge against defaults so legacy records (saved before v3 fields existed) get every field
    // filled. Otherwise builderState (defaults applied on edit) would differ from baseSnapshot
    // (raw record) and produce a spurious delta the moment the user opens the avatar.
    const merged = { ...defaultBuilderState, ...avatar.settings };
    setBuilderState(merged);
    setCurrentAvatarId(avatar.id);
    const style = STYLES.find(s => s.id === avatar.styleId);
    if (style) setSelectedStyle(style);
    if (avatar.mode === 'text' && avatar.prompt) {
      setMode('text');
      setPrompt(avatar.prompt);
      // Text-origin saves don't carry a meaningful builder snapshot — no edit base.
      setBaseSnapshot(null);
      setBaseStyleId(null);
      setOriginalBaseUrl(null);
      setOriginalBaseSnapshot(null);
      setOriginalBaseStyleId(null);
    } else {
      setMode('builder');
      // Builder-origin save becomes the editable base — "수정 적용" keeps identity. Base snapshot
      // must use the same merged settings as builderState so the initial delta is empty.
      setBaseSnapshot(merged);
      setBaseStyleId(avatar.styleId);
      // Prefer the persisted original base; fall back to current for legacy records.
      setOriginalBaseUrl(avatar.originalBaseUrl ?? avatar.imageUrl);
      setOriginalBaseSnapshot({ ...defaultBuilderState, ...(avatar.originalBaseSnapshot ?? avatar.settings) });
      setOriginalBaseStyleId(avatar.originalBaseStyleId ?? avatar.styleId);
    }
    showToast('Avatar loaded — tweak and apply edits');
  }, [showToast]);

  const deleteAvatar = useCallback(async (id: string) => {
    await dbDeleteAvatar(id);
    setSavedAvatars(prev => prev.filter(a => a.id !== id));
    showToast('Avatar deleted');
  }, [showToast]);

  // Library card entry points — reuse existing logic, just route between tabs.
  const goEditAvatar = useCallback((avatar: SavedAvatar) => {
    loadAvatar(avatar);
    setActiveTab('create');
  }, [loadAvatar]);

  const goEmotionSheet = useCallback((avatar: SavedAvatar) => {
    setEmotionBaseId(avatar.id);
    setActiveTab('emotion');
  }, []);

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `avatar-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-emerald-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Avatar Studio</h1>
              <p className="text-zinc-400 text-sm">AI-Powered Profile Creations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>{savedAvatars.length} Created</span>
            </div>
            <button
              onClick={() => setShowUsageModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                (() => {
                  const monthCost = sumUsage(usageMonth).cost;
                  const todayCost = usageToday?.estimatedCost ?? 0;
                  if (monthCost >= MONTHLY_WARN) return 'border-red-500/50 text-red-400 hover:bg-red-500/10';
                  if (todayCost >= DAILY_WARN) return 'border-orange-500/50 text-orange-400 hover:bg-orange-500/10';
                  return 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50';
                })()
              }`}
            >
              {(() => {
                const monthCost = sumUsage(usageMonth).cost;
                const todayCost = usageToday?.estimatedCost ?? 0;
                if (monthCost >= MONTHLY_WARN || todayCost >= DAILY_WARN) return <AlertTriangle className="w-3.5 h-3.5" />;
                return <Zap className="w-3.5 h-3.5" />;
              })()}
              <span>{'\u20AC'}{(usageToday?.estimatedCost ?? 0).toFixed(3)}</span>
            </button>
          </div>
        </header>

        {/* Top-level feature tabs */}
        <div className="flex p-1.5 bg-zinc-900/80 rounded-2xl border border-zinc-800 mb-12 max-w-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <UserCircle className="w-5 h-5" />
            아바타 만들기
          </button>
          <button
            onClick={() => setActiveTab('emotion')}
            className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'emotion' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Smile className="w-5 h-5" />
            감정 시트
          </button>
        </div>

        {activeTab === 'create' && (
        <main className="grid lg:grid-cols-[1fr_400px] gap-12">
          {/* Left Column: Editor */}
          <section className="space-y-8">
            {/* Mode Toggle */}
            <div className="flex p-1 bg-zinc-900/80 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setMode('text')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'text' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Text Prompt
              </button>
              <button
                onClick={() => setMode('builder')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'builder' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Palette className="w-4 h-4" />
                Avatar Builder
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'text' ? (
                <motion.div
                  key="text-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Who are you creating?
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. A cool cat with sunglasses, a futuristic knight, a friendly robot..."
                      className="w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Reference Image (Optional)
                    </label>
                    <div className="flex gap-4 items-start">
                      <label className={`flex-1 h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        referenceImage ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'
                      }`}>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        {referenceImage ? (
                          <div className="relative w-full h-full p-2">
                            <img src={referenceImage} className="w-full h-full object-contain rounded-xl" alt="Reference" />
                            <button 
                              onClick={(e) => { e.preventDefault(); setReferenceImage(null); }}
                              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-zinc-600 mb-2" />
                            <span className="text-xs text-zinc-500">Click or drag to upload</span>
                          </>
                        )}
                      </label>
                      <div className="w-1/3 text-xs text-zinc-500 space-y-2">
                        <p>Upload a photo to guide the AI. It will try to maintain the pose or features.</p>
                        <p className="text-[10px] opacity-60">Max size: 5MB</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="builder-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] overflow-hidden flex flex-col h-[600px]"
                >
                  {/* Top: 외모/스타일 2-segment toggle + horizontal category icon bar */}
                  <div className="bg-zinc-900/80 border-b border-zinc-800">
                    <div className="flex gap-1 px-3 pt-3">
                      {(Object.entries(SEGMENTS) as [SegmentKey, typeof SEGMENTS[SegmentKey]][]).map(([key, seg]) => (
                        <button
                          key={key}
                          onClick={() => selectSegment(key)}
                          className={`px-4 py-2 rounded-t-xl text-sm font-bold transition-all ${
                            activeSegment === key
                              ? 'bg-black/20 text-white'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {seg.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide p-3">
                      {SEGMENTS[activeSegment].cats.map((category) => {
                        const config = BUILDER_OPTIONS[category];
                        const Icon = config.icon;
                        const isActive = activeCategory === category;
                        return (
                          <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`shrink-0 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all group ${
                              isActive
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-zinc-500 group-hover:text-emerald-400'}`} />
                            <span className="text-[11px] font-medium whitespace-nowrap">{(config as any).name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Main Options Area */}
                  <div className="flex-1 flex flex-col bg-black/20 min-h-0">
                    <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                      <h2 className="text-lg font-bold">{(BUILDER_OPTIONS[activeCategory] as any).name}</h2>
                      {isEditBase && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Identity Locked</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
                      {(() => {
                        const attrs = PANELS[activeCategory];
                        const showHeaders = attrs.length > 1; // §5: subsection headers only when multiple attributes
                        return attrs.map(attr => renderAttr(attr, showHeaders));
                      })()}
                    </div>

                    <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        {isEditBase
                          ? 'Tweak attributes or style, then press "수정 적용" to apply changes while keeping the same person.'
                          : 'Pick attributes, then press "새 아바타" to generate your base avatar.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Choose a Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`p-4 rounded-2xl border text-left transition-all group ${
                      selectedStyle.id === style.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">{style.name}</div>
                    <div className="text-[10px] opacity-60 leading-tight">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {isEditBase ? (
              // Edit mode: apply delta (primary) + start a fresh identity (secondary).
              <div className="flex gap-3">
                <button
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating || !hasPendingEdit}
                  className="flex-[2] py-5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/10 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> 적용 중...</>
                  ) : (
                    <><Check className="w-6 h-6" /> 수정 적용</>
                  )}
                </button>
                <button
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  className="flex-1 py-5 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" /> 새 아바타
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleGenerate(true)}
                disabled={isGenerating || (mode === 'text' && !prompt.trim())}
                className="w-full py-5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/10 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                {isGenerating ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Generating Magic...</>
                ) : (
                  <><Sparkles className="w-6 h-6" /> {mode === 'builder' ? '아바타 생성' : 'Generate Avatar'}</>
                )}
              </button>
            )}

            {isEditBase && originalBaseUrl && currentAvatar !== originalBaseUrl && (
              <button
                onClick={revertToOriginal}
                disabled={isGenerating}
                className="w-full py-2.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 원본으로 되돌리기
              </button>
            )}

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-400/10 py-3 rounded-xl border border-red-400/20">
                {error}
              </p>
            )}
          </section>

          {/* Right Column: Preview */}
          <section className="space-y-8">
            <div className="aspect-square bg-zinc-900/50 border border-zinc-800 rounded-[32px] flex items-center justify-center relative overflow-hidden group">
              <AnimatePresence mode="wait">
                {currentAvatar ? (
                  <motion.div
                    key={currentAvatar}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="w-full h-full"
                  >
                    <img
                      src={currentAvatar}
                      alt="Generated Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button
                        onClick={() => downloadImage(currentAvatar)}
                        className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => handleGenerate(!isEditBase)}
                        className="p-4 bg-emerald-500 text-black rounded-full hover:scale-110 transition-transform"
                      >
                        <RefreshCw className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-4 px-8">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                      <ImageIcon className="w-8 h-8 text-zinc-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-300">Preview Area</h3>
                      <p className="text-sm text-zinc-500">Your masterpiece will appear here</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
              
              {isGenerating && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-emerald-500 font-medium animate-pulse">
                      {isEditBase ? 'Updating Avatar...' : 'Dreaming...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Re-render in the selected style — edit path keeps identity when a base exists */}
            {currentAvatar && !isGenerating && (
              <button
                onClick={() => handleGenerate(!isEditBase)}
                className="w-full py-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/40 text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {isEditBase ? `Re-render as ${selectedStyle.name}` : `Regenerate as ${selectedStyle.name}`}
              </button>
            )}

            {/* Export current avatar as a single-layer PSD for hand-editing */}
            {currentAvatar && !isGenerating && (
              <button
                onClick={async () => {
                  try {
                    await exportAvatarPsd(currentAvatar, `avatar-${Date.now()}.psd`);
                  } catch (err) {
                    console.error('[avatar] PSD export failed:', err);
                    setError('PSD 내보내기에 실패했습니다.');
                  }
                }}
                title="단일 레이어, 투명 배경. Photoshop 보정용."
                className="w-full py-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/40 text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                PSD로 내보내기
              </button>
            )}

            {/* History */}
            {savedAvatars.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  Recent Creations
                  <span className="ml-2 text-xs text-zinc-600">({savedAvatars.length}/{MAX_SAVED})</span>
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {savedAvatars.map((avatar) => (
                    <div
                      key={avatar.id}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative group ${
                        currentAvatar === avatar.imageUrl ? 'border-emerald-500 scale-95' : 'border-transparent hover:border-zinc-700'
                      }`}
                    >
                      <img src={avatar.imageUrl} alt="Saved avatar" className="w-full h-full object-cover" />
                      {avatar.emotionSheet && (
                        <div className="absolute top-1 left-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow" title="감정 시트 저장됨">
                          <Smile className="w-3 h-3 text-black" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                        <button
                          onClick={() => goEditAvatar(avatar)}
                          className="px-2.5 py-1 bg-emerald-500 text-black text-[9px] font-bold uppercase rounded-lg hover:bg-emerald-400 transition-colors"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => goEmotionSheet(avatar)}
                          className="px-2.5 py-1 bg-zinc-700 text-white text-[9px] font-bold uppercase rounded-lg hover:bg-zinc-600 transition-colors flex items-center gap-1"
                        >
                          <Smile className="w-3 h-3" /> 감정
                        </button>
                        <button
                          onClick={() => deleteAvatar(avatar.id)}
                          className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
        )}

        {activeTab === 'emotion' && (
          <EmotionSheetTab
            savedAvatars={savedAvatars}
            emotionBaseId={emotionBaseId}
            setEmotionBaseId={setEmotionBaseId}
            onGoCreate={() => setActiveTab('create')}
            styles={STYLES}
            onLogUsage={async (usage) => {
              if (usage) {
                await logApiCall(usage);
                await refreshUsageStats();
              }
            }}
            onPersistSheet={async (avatarId, meta, dataUrl) => {
              await saveEmotionSheet(avatarId, dataUrl);
              const existing = savedAvatars.find(a => a.id === avatarId);
              if (!existing) return;
              const updated = { ...existing, emotionSheet: meta };
              await dbSaveAvatar(updated);
              setSavedAvatars(prev => prev.map(a => (a.id === avatarId ? updated : a)));
            }}
            showToast={showToast}
          />
        )}

        {/* Footer Info */}
        <footer className="mt-24 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-xs">
          <p>© 2026 AI Avatar Studio. Powered by Gemini 2.5 Flash Image.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">API Status</a>
          </div>
        </footer>
      </div>

      {/* Usage Modal */}
      <AnimatePresence>
        {showUsageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUsageModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  API Usage
                </h2>
                <button onClick={() => setShowUsageModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(() => {
                const today = { calls: usageToday?.calls ?? 0, tokens: (usageToday?.inputTokens ?? 0) + (usageToday?.outputTokens ?? 0), cost: usageToday?.estimatedCost ?? 0 };
                const month = sumUsage(usageMonth);
                const monthTokens = month.inputTokens + month.outputTokens;
                const all = sumUsage(usageAll);
                const monthCostWarn = month.cost >= MONTHLY_WARN;
                const todayCostWarn = today.cost >= DAILY_WARN;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className={`rounded-xl p-4 ${todayCostWarn ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-zinc-800/60'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Today</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-zinc-400">Calls</span><span className="font-mono font-bold">{today.calls}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400">Tokens</span><span className="font-mono font-bold">{formatTokens(today.tokens)}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400">Cost</span><span className={`font-mono font-bold ${todayCostWarn ? 'text-orange-400' : ''}`}>{'\u20AC'}{today.cost.toFixed(4)}</span></div>
                        </div>
                      </div>
                      <div className={`rounded-xl p-4 ${monthCostWarn ? 'bg-red-500/10 border border-red-500/30' : 'bg-zinc-800/60'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">This Month</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-zinc-400">Calls</span><span className="font-mono font-bold">{month.calls}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400">Tokens</span><span className="font-mono font-bold">{formatTokens(monthTokens)}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400">Cost</span><span className={`font-mono font-bold ${monthCostWarn ? 'text-red-400' : ''}`}>{'\u20AC'}{month.cost.toFixed(4)}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Total Cost</span>
                      <span className="text-lg font-mono font-bold">{'\u20AC'}{all.cost.toFixed(4)}</span>
                    </div>

                    {(todayCostWarn || monthCostWarn) && (
                      <div className={`mt-4 flex items-start gap-2 text-xs rounded-lg p-3 ${monthCostWarn ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{monthCostWarn ? `Monthly cost exceeds \u20AC${MONTHLY_WARN.toFixed(2)} limit` : `Daily cost exceeds \u20AC${DAILY_WARN.toFixed(2)} limit`}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-emerald-500 text-black text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
