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
  ChevronRight,
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
  Zap as ZapIcon,
  User as UserIcon,
  Type,
  Settings,
  MoreHorizontal,
  Circle,
  Check
} from 'lucide-react';
import { generateAvatar } from './services/geminiService';
import { HAIR_GROUPS, ALL_HAIR_STYLES, HAIR_THUMBNAIL_URL } from './components/thumbnails';
import type { HairGroup } from './components/thumbnails';
import { ColorSwatch } from './components/ColorSwatch';

const STYLES = [
  { id: '3d-render', name: '3D Render', description: 'Modern Pixar-style 3D character', prompt: '3D Pixar style, high detail, soft lighting' },
  { id: 'memoji', name: 'Memoji', description: 'Apple-style 3D avatar aesthetic', prompt: 'iPhone Memoji style, 3D emoji aesthetic, clean 3D render, Apple aesthetic' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean, flat vector illustration', prompt: 'flat minimalist vector illustration, clean lines' },
  { id: 'pixel-art', name: 'Pixel Art', description: 'Retro 8-bit aesthetic', prompt: 'retro pixel art, 16-bit aesthetic' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon-lit futuristic look', prompt: 'cyberpunk aesthetic, neon lighting, futuristic' },
  { id: 'sketch', name: 'Hand Drawn', description: 'Artistic charcoal or pencil sketch', prompt: 'artistic pencil sketch, hand-drawn texture' },
  { id: 'anime', name: 'Anime', description: 'Classic Japanese animation style', prompt: 'modern anime style, vibrant colors' },
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
};

// --- Saved Avatar Types ---
type BuilderSettings = {
  gender: string; skin: string; hair: string; hairColor: string;
  eyebrows: string; eyes: string; face: string; nose: string;
  lips: string; facialHair: string; glasses: string; earrings: string;
  necklace: string; headwear: string; outfit: string; outfitColor: string;
};

type SavedAvatar = {
  id: string;
  createdAt: number;
  imageUrl: string;
  settings: BuilderSettings;
  styleId: string;
  mode: 'text' | 'builder';
  prompt?: string;
};

const STORAGE_KEY = 'avatar-studio-saved';
const MAX_SAVED = 20;

function loadSaved(): SavedAvatar[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistSaved(items: SavedAvatar[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_SAVED)));
}

export default function App() {
  const [mode, setMode] = useState<'text' | 'builder'>('text');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [savedAvatars, setSavedAvatars] = useState<SavedAvatar[]>(loadSaved);
  const [error, setError] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [autoGenEnabled, setAutoGenEnabled] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Builder State
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
  };
  const [builderState, setBuilderState] = useState<BuilderSettings>(defaultBuilderState);
  const [activeCategory, setActiveCategory] = useState<keyof typeof BUILDER_OPTIONS>('gender');
  const [activeHairGroup, setActiveHairGroup] = useState<HairGroup>('short');

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Derived: history images for backward compat
  const history = savedAvatars.map(a => a.imageUrl);

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

  const handleGenerate = useCallback(async (isAuto = false) => {
    let finalPrompt = prompt;
    let stylePrompt = selectedStyle.prompt;
    
    if (mode === 'builder') {
      const parts: string[] = [
        `A 3D Memoji ${builderState.gender.toLowerCase()} character`,
        `with ${builderState.skin} skin`,
        `${builderState.hairColor} colored ${builderState.hair} hair`,
        `${builderState.eyebrows} eyebrows`,
        `${builderState.eyes} eyes`,
        `${builderState.face} face shape`,
        `${builderState.nose} nose`,
        `${builderState.lips} lips`,
      ];
      if (builderState.facialHair !== 'None') parts.push(`${builderState.facialHair} facial hair`);
      if (builderState.glasses !== 'None') parts.push(`wearing ${builderState.glasses} glasses`);
      if (builderState.earrings !== 'None') parts.push(`wearing ${builderState.earrings} earrings`);
      if (builderState.necklace !== 'None') parts.push(`wearing a ${builderState.necklace} necklace`);
      if (builderState.headwear !== 'None') parts.push(`wearing a ${builderState.headwear}`);
      parts.push(`wearing a ${builderState.outfitColor} ${builderState.outfit}`);
      parts.push('Front view, clean background.');
      finalPrompt = parts.join(', ');
      stylePrompt = 'iPhone Memoji style, 3D emoji aesthetic, clean 3D render, Apple aesthetic, high quality, studio lighting';
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
    try {
      const imageUrl = await generateAvatar(finalPrompt, stylePrompt, referenceImage || undefined);
      setCurrentAvatar(imageUrl);

      const saved: SavedAvatar = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        imageUrl,
        settings: { ...builderState },
        styleId: selectedStyle.id,
        mode,
        prompt: mode === 'text' ? prompt : undefined,
      };
      setSavedAvatars(prev => {
        const next = [saved, ...prev].slice(0, MAX_SAVED);
        persistSaved(next);
        return next;
      });
      if (!isAuto) showToast('Avatar saved!');
    } catch (err) {
      if (!isAuto) {
        setError('Failed to generate avatar. Please try again.');
      }
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [mode, prompt, selectedStyle, builderState, referenceImage, showToast]);

  const loadAvatar = useCallback((avatar: SavedAvatar) => {
    setCurrentAvatar(avatar.imageUrl);
    setBuilderState(avatar.settings);
    const style = STYLES.find(s => s.id === avatar.styleId);
    if (style) setSelectedStyle(style);
    if (avatar.mode === 'text' && avatar.prompt) {
      setMode('text');
      setPrompt(avatar.prompt);
    } else {
      setMode('builder');
    }
    showToast('Settings restored!');
  }, [showToast]);

  const deleteAvatar = useCallback((id: string) => {
    setSavedAvatars(prev => {
      const next = prev.filter(a => a.id !== id);
      persistSaved(next);
      return next;
    });
    showToast('Avatar deleted');
  }, [showToast]);

  // Auto-generation effect for Builder Mode
  useEffect(() => {
    if (mode === 'builder' && autoGenEnabled) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      debounceTimer.current = setTimeout(() => {
        handleGenerate(true);
      }, 1000); // 1 second debounce
    }
    
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [builderState, mode, autoGenEnabled, handleGenerate]);

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
          </div>
        </header>

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
                  className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] overflow-hidden flex flex-col md:flex-row h-[600px]"
                >
                  {/* Sidebar Categories */}
                  <div className="w-full md:w-64 bg-zinc-900/80 border-r border-zinc-800 flex flex-col">
                    <div className="p-6 border-b border-zinc-800">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categories</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                      {Object.entries(BUILDER_OPTIONS).map(([category, config]) => {
                        const Icon = config.icon;
                        const isActive = activeCategory === category;
                        return (
                          <button
                            key={category}
                            onClick={() => setActiveCategory(category as keyof typeof BUILDER_OPTIONS)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                              isActive 
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-zinc-500 group-hover:text-emerald-400'}`} />
                            <span className="text-sm font-medium">{(config as any).name}</span>
                            {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Main Options Area */}
                  <div className="flex-1 flex flex-col bg-black/20">
                    <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                      <h2 className="text-lg font-bold">{(BUILDER_OPTIONS[activeCategory] as any).name}</h2>
                      <div className="flex items-center gap-2">
                        <ZapIcon className={`w-4 h-4 text-emerald-400 ${isGenerating ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Sync</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
                      {/* Color Palette (if applicable) */}
                      {'colors' in BUILDER_OPTIONS[activeCategory] && (
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Color Palette</h3>
                          <ColorSwatch
                            colors={(BUILDER_OPTIONS[activeCategory] as any).colors}
                            selected={builderState[activeCategory]}
                            onSelect={(name) => setBuilderState(prev => ({ ...prev, [activeCategory]: name }))}
                          />
                        </div>
                      )}

                      {/* Hair color swatches */}
                      {activeCategory === 'hair' && (
                        <div className="space-y-3">
                          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hair Color</h3>
                          <ColorSwatch
                            colors={HAIR_COLORS.natural.colors}
                            selected={builderState.hairColor}
                            onSelect={(name) => setBuilderState(prev => ({ ...prev, hairColor: name }))}
                            label={HAIR_COLORS.natural.label}
                            size="sm"
                          />
                          <ColorSwatch
                            colors={HAIR_COLORS.special.colors}
                            selected={builderState.hairColor}
                            onSelect={(name) => setBuilderState(prev => ({ ...prev, hairColor: name }))}
                            label={HAIR_COLORS.special.label}
                            size="sm"
                          />
                        </div>
                      )}

                      {/* Outfit color swatches */}
                      {activeCategory === 'outfit' && (
                        <div className="space-y-3">
                          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Outfit Color</h3>
                          <ColorSwatch
                            colors={OUTFIT_COLORS}
                            selected={builderState.outfitColor}
                            onSelect={(name) => setBuilderState(prev => ({ ...prev, outfitColor: name }))}
                            size="sm"
                          />
                        </div>
                      )}

                      {/* Visual Options Grid */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Style Options</h3>

                        {/* Hair subcategory tabs */}
                        {activeCategory === 'hair' && (
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
                          {(() => {
                            const config = BUILDER_OPTIONS[activeCategory];
                            const rawOptions = activeCategory === 'hair'
                              ? HAIR_GROUPS[activeHairGroup].styles
                              : config.options;

                            // Apply gender filter
                            const genderFilters = (config as any).genderFilter as Record<string, string[]> | undefined;
                            const filteredOptions = genderFilters
                              ? rawOptions.filter(opt => {
                                  const allowed = genderFilters[opt];
                                  return !allowed || allowed.includes(builderState.gender);
                                })
                              : rawOptions;

                            return filteredOptions.map((opt) => {
                              const isSelected = builderState[activeCategory] === opt;

                              return (
                                <button
                                  key={opt}
                                  onClick={() => setBuilderState(prev => ({ ...prev, [activeCategory]: opt }))}
                                  className={`aspect-square rounded-[24px] border-2 flex flex-col items-center justify-center gap-2 transition-all group relative ${
                                    isSelected
                                      ? 'bg-emerald-500/10 border-emerald-500'
                                      : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                                  }`}
                                >
                                  <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                                    {'thumbnails' in config ? (
                                      <img
                                        src={(config as any).thumbnails[opt]}
                                        alt={opt}
                                        className="w-full h-full object-cover rounded-xl"
                                      />
                                    ) : 'emojis' in config ? (
                                      <span className="text-4xl">{(config as any).emojis[opt]}</span>
                                    ) : (
                                      <div
                                        className="w-10 h-10 rounded-full border border-white/10"
                                        style={{ backgroundColor: (config as any).colors?.[opt] || '#333' }}
                                      />
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 text-center leading-tight ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                    {opt}
                                  </span>
                                  {isSelected && (
                                    <div className="absolute top-3 right-3">
                                      <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="w-3 h-3 text-black font-bold" />
                                      </div>
                                    </div>
                                  )}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-[10px] text-zinc-400 max-w-[200px] leading-tight">
                          Real-time generation active. Changes reflect instantly in the preview.
                        </p>
                      </div>
                      <button 
                        onClick={() => setAutoGenEnabled(!autoGenEnabled)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          autoGenEnabled 
                            ? 'bg-emerald-500 text-black' 
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {autoGenEnabled ? 'Auto-Sync ON' : 'Auto-Sync OFF'}
                      </button>
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

            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || (mode === 'text' && !prompt.trim())}
              className={`w-full py-5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl ${
                mode === 'builder' && autoGenEnabled 
                  ? 'bg-zinc-800 text-zinc-400 cursor-default' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/10'
              } disabled:bg-zinc-800 disabled:text-zinc-600`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {mode === 'builder' && autoGenEnabled ? 'Syncing...' : 'Generating Magic...'}
                </>
              ) : (
                <>
                  {mode === 'builder' && autoGenEnabled ? (
                    <>
                      <Zap className="w-6 h-6 text-emerald-500" />
                      Real-time Sync Active
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Generate Avatar
                    </>
                  )}
                </>
              )}
            </button>

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
                        onClick={handleGenerate}
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
                      {mode === 'builder' && autoGenEnabled ? 'Updating Avatar...' : 'Dreaming...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Regenerate with style button */}
            {currentAvatar && !isGenerating && (
              <button
                onClick={() => handleGenerate()}
                className="w-full py-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/40 text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate as {selectedStyle.name}
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
                      <img src={avatar.imageUrl} alt="Saved avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                        <button
                          onClick={() => loadAvatar(avatar)}
                          className="px-2.5 py-1 bg-emerald-500 text-black text-[9px] font-bold uppercase rounded-lg hover:bg-emerald-400 transition-colors"
                        >
                          Load
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
