import React from 'react';

// Parametric face thumbnail for builder shape options. One neutral base; only the selected
// part varies (design §8). Physical colors are hardcoded hex — theme-independent (no dark-mode
// inversion). Same 64×64 coordinate system as HairThumbnail so the two read consistently.

type Jaw = 'round' | 'pointed' | 'square' | 'cleft' | 'heart' | 'diamond';
type EyeShape = 'round' | 'almond' | 'hooded' | 'monolid' | 'droopy' | 'wide';
type Crease = 'double' | 'single' | 'none';
type Brow = 'natural' | 'thin' | 'thick' | 'arched' | 'straight' | 'bushy';
type NoseW = 'small' | 'pointy' | 'wide' | 'button' | 'hooked' | 'flat';
type Bridge = 'average' | 'low' | 'high';
type Lip = 'natural' | 'thin' | 'full' | 'wide' | 'small' | 'pouty';
type EarShape = 'round' | 'pointed';
type Beard = 'none' | 'stubble' | 'goatee' | 'full' | 'mustache' | 'circle';
type Cheek = 'none' | 'high' | 'low';

interface FaceParams {
  headRy: number;
  foreheadY: number; // hairline offset: + lowers hairline (less forehead), − raises it (more)
  jaw: Jaw;
  cheek: Cheek;
  eyeRx: number;
  eyeRy: number;
  eyeShape: EyeShape;
  crease: Crease;
  brow: Brow;
  noseW: NoseW;
  bridge: Bridge;
  lip: Lip;
  earRy: number;
  earCy: number;
  earShape: EarShape;
  beard: Beard;
  wrinkle: number; // 0 none, 1 light, 2 defined
}

const DEFAULTS: FaceParams = {
  headRy: 20, foreheadY: 0, jaw: 'round', cheek: 'none',
  eyeRx: 4, eyeRy: 3.2, eyeShape: 'round', crease: 'double',
  brow: 'natural', noseW: 'small', bridge: 'average', lip: 'natural',
  earRy: 5, earCy: 37, earShape: 'round', beard: 'none', wrinkle: 0,
};

// field → option → partial override. Presence here = a thumbnail exists for that combo.
const OVERRIDES: Record<string, Record<string, Partial<FaceParams>>> = {
  face: { Oval: {}, Round: { headRy: 19, jaw: 'round' }, Square: { jaw: 'square' }, Heart: { jaw: 'heart' }, Diamond: { jaw: 'diamond' }, Long: { headRy: 23 } },
  forehead: { Low: { foreheadY: 2.5 }, Average: {}, High: { foreheadY: -2.5 } },
  chin: { Round: {}, Pointed: { jaw: 'pointed' }, Square: { jaw: 'square' }, Cleft: { jaw: 'cleft' } },
  cheekbones: { Low: { cheek: 'low' }, Average: {}, High: { cheek: 'high' } },
  wrinkles: { Light: { wrinkle: 1 }, Defined: { wrinkle: 2 } },
  eyes: { Round: {}, Almond: { eyeShape: 'almond' }, Hooded: { eyeShape: 'hooded' }, Monolid: { eyeShape: 'monolid', crease: 'none' }, Droopy: { eyeShape: 'droopy' }, Wide: { eyeShape: 'wide', eyeRx: 4.6 } },
  eyeSize: { Small: { eyeRx: 3, eyeRy: 2.5 }, Medium: {}, Large: { eyeRx: 5, eyeRy: 4 } },
  eyelid: { Monolid: { crease: 'none' }, Single: { crease: 'single' }, Double: { crease: 'double' } },
  eyebrows: { Natural: {}, Thin: { brow: 'thin' }, Thick: { brow: 'thick' }, Arched: { brow: 'arched' }, Straight: { brow: 'straight' }, Bushy: { brow: 'bushy' } },
  nose: { Small: {}, Pointy: { noseW: 'pointy' }, Wide: { noseW: 'wide' }, Button: { noseW: 'button' }, Hooked: { noseW: 'hooked' }, Flat: { noseW: 'flat' } },
  noseBridge: { Low: { bridge: 'low' }, Average: {}, High: { bridge: 'high' } },
  lips: { Natural: {}, Thin: { lip: 'thin' }, Full: { lip: 'full' }, Wide: { lip: 'wide' }, Small: { lip: 'small' }, Pouty: { lip: 'pouty' } },
  earShape: { Small: { earRy: 4 }, Average: {}, Large: { earRy: 6.2 }, Pointed: { earShape: 'pointed' }, Round: { earShape: 'round', earRy: 5.5 } },
  earPosition: { High: { earCy: 33.5 }, Average: {}, Low: { earCy: 40.5 } },
  facialHair: { Stubble: { beard: 'stubble' }, Goatee: { beard: 'goatee' }, 'Full Beard': { beard: 'full' }, Mustache: { beard: 'mustache' }, 'Circle Beard': { beard: 'circle' } },
};

export function hasFaceThumb(field: string, option: string): boolean {
  return !!OVERRIDES[field]?.[option];
}

const C = {
  skin: '#E8B98F',
  skinLight: '#F4D2AC',
  skinShadow: '#C9985F',
  hair: '#4A3728',
  brow: '#4A3728',
  iris: '#5A3A22',
  pupil: '#1A1A1A',
  nose: '#C28F58',
  mouth: '#C4756A',
  beard: '#3A2B1E',
  line: 'rgba(150,110,75,0.55)',
};

const Defs: React.FC = () => (
  <defs>
    <radialGradient id="ft-skin" cx="0.45" cy="0.35" r="0.65">
      <stop offset="0%" stopColor={C.skinLight} />
      <stop offset="100%" stopColor={C.skin} />
    </radialGradient>
  </defs>
);

// --- head outline (forehead via hairline cap, jaw via chin overlay) ---
function Head({ p }: { p: FaceParams }) {
  const topY = 36 - p.headRy;
  const hairlineY = 19 + p.foreheadY;
  return (
    <g>
      <rect x="27" y="52" width="10" height="8" rx="3" fill={C.skin} />
      <ellipse cx="32" cy="36" rx="17" ry={p.headRy} fill="url(#ft-skin)" />
      {/* jaw / chin shaping overlaid in skin */}
      {p.jaw === 'pointed' && <path d="M22 50 Q32 62 42 50 Q38 54 32 55 Q26 54 22 50 Z" fill="url(#ft-skin)" />}
      {p.jaw === 'square' && <path d="M19 48 L19 53 Q19 56 24 56 L40 56 Q45 56 45 53 L45 48 Z" fill="url(#ft-skin)" />}
      {p.jaw === 'heart' && (
        <>
          <ellipse cx="20" cy="40" rx="4" ry="6" fill="url(#ft-skin)" />
          <ellipse cx="44" cy="40" rx="4" ry="6" fill="url(#ft-skin)" />
          <path d="M24 51 Q32 60 40 51 Q36 55 32 56 Q28 55 24 51 Z" fill="url(#ft-skin)" />
        </>
      )}
      {p.jaw === 'diamond' && (
        <>
          <ellipse cx="18.5" cy="38" rx="4" ry="7" fill="url(#ft-skin)" />
          <ellipse cx="45.5" cy="38" rx="4" ry="7" fill="url(#ft-skin)" />
          <path d="M24 51 Q32 61 40 51 Q36 55 32 56 Q28 55 24 51 Z" fill="url(#ft-skin)" />
        </>
      )}
      {p.jaw === 'cleft' && <path d="M32 53 L32 56.5" stroke={C.skinShadow} strokeWidth="1" strokeLinecap="round" opacity="0.7" />}
      {/* hairline cap → visualizes forehead height */}
      <path
        d={`M14 ${hairlineY} Q13 ${topY + 2} 20 ${topY - 2} Q26 ${topY - 6} 32 ${topY - 6} Q38 ${topY - 6} 44 ${topY - 2} Q51 ${topY + 2} 50 ${hairlineY} Q41 ${hairlineY - 3} 32 ${hairlineY - 2} Q23 ${hairlineY - 3} 14 ${hairlineY} Z`}
        fill={C.hair}
      />
    </g>
  );
}

function Ears({ p }: { p: FaceParams }) {
  const rx = p.earShape === 'round' ? 4 : 3.4;
  return (
    <g>
      {[15.5, 48.5].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={p.earCy} rx={rx} ry={p.earRy} fill={C.skin} />
          <ellipse cx={cx} cy={p.earCy} rx={rx * 0.6} ry={p.earRy * 0.6} fill={C.skinShadow} opacity="0.25" />
          {p.earShape === 'pointed' && (
            <path d={`M${cx} ${p.earCy - p.earRy} L${cx + (i ? 2 : -2)} ${p.earCy - p.earRy - 3} L${cx + (i ? 0.5 : -0.5)} ${p.earCy - p.earRy + 1} Z`} fill={C.skin} />
          )}
        </g>
      ))}
    </g>
  );
}

function Cheeks({ p }: { p: FaceParams }) {
  if (p.cheek === 'none') return null;
  const cy = p.cheek === 'high' ? 40 : 45;
  const op = p.cheek === 'high' ? 0.4 : 0.25;
  return (
    <g>
      <ellipse cx="20.5" cy={cy} rx="4.5" ry="2.6" fill={C.skinShadow} opacity={op} />
      <ellipse cx="43.5" cy={cy} rx="4.5" ry="2.6" fill={C.skinShadow} opacity={op} />
    </g>
  );
}

function Eye({ cx, p }: { cx: number; p: FaceParams }) {
  const { eyeRx, eyeRy, eyeShape, crease } = p;
  const cy = 36;
  return (
    <g>
      {eyeShape === 'almond' ? (
        <path d={`M${cx - eyeRx} ${cy} Q${cx} ${cy - eyeRy * 1.1} ${cx + eyeRx} ${cy} Q${cx} ${cy + eyeRy} ${cx - eyeRx} ${cy} Z`} fill="white" opacity="0.92" />
      ) : (
        <ellipse cx={cx} cy={cy} rx={eyeRx} ry={eyeShape === 'wide' ? eyeRy : eyeRy} fill="white" opacity="0.92" />
      )}
      {/* iris + pupil */}
      <ellipse cx={cx + 0.4} cy={cy + 0.2} rx={Math.min(eyeRx * 0.6, 2.4)} ry={Math.min(eyeRy * 0.85, 2.7)} fill={C.iris} />
      <ellipse cx={cx + 0.4} cy={cy + 0.2} rx={Math.min(eyeRx * 0.4, 1.6)} ry={Math.min(eyeRy * 0.6, 1.9)} fill={C.pupil} />
      <circle cx={cx - 0.4} cy={cy - 0.8} r="0.7" fill="white" opacity="0.75" />
      {/* hooded / droopy upper lid */}
      {eyeShape === 'hooded' && <path d={`M${cx - eyeRx - 0.5} ${cy - eyeRy + 0.3} Q${cx} ${cy - eyeRy - 1.2} ${cx + eyeRx + 0.5} ${cy - eyeRy + 0.3}`} stroke={C.skinShadow} strokeWidth="1.6" fill={C.skin} opacity="0.9" />}
      {eyeShape === 'droopy' && <path d={`M${cx + eyeRx} ${cy - 0.5} Q${cx + eyeRx + 1.5} ${cy + 1.5} ${cx + eyeRx} ${cy + 2}`} stroke={C.skinShadow} strokeWidth="0.9" fill="none" opacity="0.6" />}
      {/* eyelid crease */}
      {crease === 'double' && <path d={`M${cx - eyeRx} ${cy - eyeRy - 0.6} Q${cx} ${cy - eyeRy - 1.8} ${cx + eyeRx} ${cy - eyeRy - 0.6}`} stroke={C.skinShadow} strokeWidth="0.6" fill="none" opacity="0.55" />}
      {crease === 'single' && <path d={`M${cx - eyeRx} ${cy - eyeRy - 0.3} L${cx + eyeRx} ${cy - eyeRy - 0.3}`} stroke={C.skinShadow} strokeWidth="0.4" fill="none" opacity="0.4" />}
    </g>
  );
}

function Brows({ p }: { p: FaceParams }) {
  const sw = p.brow === 'thin' ? 1 : p.brow === 'thick' || p.brow === 'bushy' ? 2.6 : 1.6;
  const left =
    p.brow === 'straight' ? 'M21 31 L29 31'
      : p.brow === 'arched' ? 'M21 31.5 Q25 28 29 31'
        : 'M21 31.5 Q25 29.5 29 31';
  const right =
    p.brow === 'straight' ? 'M35 31 L43 31'
      : p.brow === 'arched' ? 'M35 31 Q39 28 43 31.5'
        : 'M35 31 Q39 29.5 43 31.5';
  return (
    <g>
      <path d={left} stroke={C.brow} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <path d={right} stroke={C.brow} strokeWidth={sw} fill="none" strokeLinecap="round" />
      {p.brow === 'bushy' && (
        <>
          <path d="M21 33 Q25 31 29 32.5" stroke={C.brow} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M35 32.5 Q39 31 43 33" stroke={C.brow} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
        </>
      )}
    </g>
  );
}

function Nose({ p }: { p: FaceParams }) {
  const bridgeLine =
    p.bridge === 'high' ? <path d="M32 33 L32 42" stroke={C.skinShadow} strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
      : p.bridge === 'low' ? null
        : <path d="M32 38 L32 42" stroke={C.skinShadow} strokeWidth="0.6" opacity="0.4" strokeLinecap="round" />;
  let tip: React.ReactNode;
  switch (p.noseW) {
    case 'pointy': tip = <path d="M30.5 43 Q32 45.5 33.5 43" stroke={C.nose} strokeWidth="1.1" fill="none" strokeLinecap="round" />; break;
    case 'wide': tip = <><path d="M29 42.5 Q32 45.5 35 42.5" stroke={C.nose} strokeWidth="1.2" fill="none" strokeLinecap="round" /><circle cx="28.8" cy="43" r="0.9" fill={C.nose} opacity="0.45" /><circle cx="35.2" cy="43" r="0.9" fill={C.nose} opacity="0.45" /></>; break;
    case 'button': tip = <circle cx="32" cy="43" r="1.8" fill={C.nose} opacity="0.3" />; break;
    case 'hooked': tip = <path d="M31 38 Q34 41 32.5 44 Q32 45 31 44" stroke={C.nose} strokeWidth="1" fill="none" strokeLinecap="round" />; break;
    case 'flat': tip = <path d="M28.5 43 Q32 44.5 35.5 43" stroke={C.nose} strokeWidth="1.4" fill="none" strokeLinecap="round" />; break;
    default: tip = <path d="M30 42 Q32 44.5 34 42" stroke={C.nose} strokeWidth="1.1" fill="none" strokeLinecap="round" />; // small
  }
  return <g>{bridgeLine}{tip}{p.noseW !== 'wide' && p.noseW !== 'button' && <><circle cx="29.8" cy="42.6" r="0.6" fill={C.nose} opacity="0.4" /><circle cx="34.2" cy="42.6" r="0.6" fill={C.nose} opacity="0.4" /></>}</g>;
}

function Mouth({ p }: { p: FaceParams }) {
  switch (p.lip) {
    case 'thin': return <path d="M28 47.5 L36 47.5" stroke={C.mouth} strokeWidth="1" fill="none" strokeLinecap="round" />;
    case 'full': return <path d="M27.5 47 Q32 44.8 36.5 47 Q32 51 27.5 47 Z" fill={C.mouth} opacity="0.85" />;
    case 'pouty': return <><path d="M28.5 46.8 Q32 45.2 35.5 46.8 Q32 48 28.5 46.8 Z" fill={C.mouth} opacity="0.8" /><path d="M28 47.6 Q32 51.2 36 47.6 Q32 49.5 28 47.6 Z" fill={C.mouth} opacity="0.9" /></>;
    case 'wide': return <path d="M25.5 47.5 Q32 50.5 38.5 47.5" stroke={C.mouth} strokeWidth="1.4" fill="none" strokeLinecap="round" />;
    case 'small': return <path d="M29.5 47.5 Q32 49 34.5 47.5" stroke={C.mouth} strokeWidth="1.3" fill="none" strokeLinecap="round" />;
    default: return <path d="M27.5 47.5 Q32 50 36.5 47.5" stroke={C.mouth} strokeWidth="1.3" fill="none" strokeLinecap="round" />;
  }
}

function Beard({ p }: { p: FaceParams }) {
  switch (p.beard) {
    case 'stubble': return <path d="M19 42 Q20 54 32 56 Q44 54 45 42 Q44 50 32 52 Q20 50 19 42 Z" fill={C.beard} opacity="0.22" />;
    case 'full': return <path d="M18 40 Q19 55 32 57 Q45 55 46 40 Q44 49 38 49 Q32 50 26 49 Q20 49 18 40 Z" fill={C.beard} opacity="0.9" />;
    case 'goatee': return <><path d="M28 49 Q32 53 36 49 Q34 54 32 55 Q30 54 28 49 Z" fill={C.beard} opacity="0.9" /><path d="M28 45 Q32 47 36 45" stroke={C.beard} strokeWidth="1.4" fill="none" strokeLinecap="round" /></>;
    case 'mustache': return <path d="M27 45.5 Q32 47.5 37 45.5 Q34 44 32 44.4 Q30 44 27 45.5 Z" fill={C.beard} opacity="0.9" />;
    case 'circle': return <><path d="M27 45.5 Q32 47.5 37 45.5 Q34 44 32 44.4 Q30 44 27 45.5 Z" fill={C.beard} opacity="0.9" /><path d="M28 49 Q32 54 36 49 Q34 55 32 56 Q30 55 28 49 Z" fill={C.beard} opacity="0.9" /></>;
    default: return null;
  }
}

function Wrinkles({ p }: { p: FaceParams }) {
  if (!p.wrinkle) return null;
  const op = p.wrinkle === 2 ? 0.7 : 0.4;
  const sw = p.wrinkle === 2 ? 0.7 : 0.5;
  return (
    <g stroke={C.line} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={op}>
      <path d="M22 27 Q32 25.5 42 27" />
      <path d="M23 29.5 Q32 28 41 29.5" />
      {p.wrinkle === 2 && <path d="M24 31.8 Q32 30.5 40 31.8" />}
      {/* nasolabial */}
      <path d="M28 43 Q26 46 27 48.5" />
      <path d="M36 43 Q38 46 37 48.5" />
    </g>
  );
}

export const FaceThumbnail: React.FC<{ field: string; option: string; size?: number }> = ({
  field, option, size = 64,
}) => {
  const p: FaceParams = { ...DEFAULTS, ...(OVERRIDES[field]?.[option] ?? {}) };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${option} ${field}`}
    >
      <Defs />
      <Head p={p} />
      <Ears p={p} />
      <Cheeks p={p} />
      <Eye cx={25} p={p} />
      <Eye cx={39} p={p} />
      <Brows p={p} />
      <Nose p={p} />
      <Mouth p={p} />
      <Beard p={p} />
      <Wrinkles p={p} />
    </svg>
  );
};
