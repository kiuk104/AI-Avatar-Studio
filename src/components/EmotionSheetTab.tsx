import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Smile, UserCircle, Sparkles, Download, Loader2, AlertTriangle, RefreshCw, Play, FlaskConical, FileJson, Save, Layers,
} from 'lucide-react';
import { exportEmotionSheetPsd } from '../utils/psdExport';
import type { SavedAvatar, EmotionSheetMeta } from '../utils/avatarDB';
import { loadEmotionSheet } from '../utils/avatarDB';
import type { GeminiUsage } from '../services/geminiService';
import { generateExpressionCell } from '../services/geminiService';
import {
  getExpressions, gridFor, defaultCellFor, CELL_PRESETS, type ExpressionSet,
} from '../utils/emotionExpressions';
import { composeSheet, solidCell } from '../utils/sheetCompositor';

type StyleDef = { id: string; name: string; prompt: string };

type Props = {
  savedAvatars: SavedAvatar[];
  emotionBaseId: string | null;
  setEmotionBaseId: (id: string | null) => void;
  onGoCreate: () => void;
  styles: StyleDef[];
  onLogUsage: (usage: GeminiUsage | null) => void | Promise<void>;
  onPersistSheet: (avatarId: string, meta: EmotionSheetMeta, dataUrl: string) => Promise<void>;
  showToast: (msg: string) => void;
};

const MAX_RETRY = 3; // per-cell automatic retries before aborting

function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function EmotionSheetTab({
  savedAvatars, emotionBaseId, setEmotionBaseId, onGoCreate, styles, onLogUsage, onPersistSheet, showToast,
}: Props) {
  const [set, setSet] = useState<ExpressionSet>('bucket9');
  const [cell, setCell] = useState<number>(defaultCellFor('bucket9'));
  const [member, setMember] = useState('member');
  const [dryRun, setDryRun] = useState(false);
  const [cells, setCells] = useState<(string | null)[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; currentId: string | null }>({ done: 0, total: 0, currentId: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenningIndex, setRegenningIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [psdBusy, setPsdBusy] = useState(false);
  const cancelRef = useRef(false);

  const base = savedAvatars.find(a => a.id === emotionBaseId) ?? null;
  const expressions = getExpressions(set);
  const { cols, rows } = gridFor(set);
  const total = expressions.length;
  const sheetPx = cols * cell;
  const heavy = set === 'full100' && cell === 256;
  const styleName = base ? (styles.find(s => s.id === base.styleId)?.name ?? '') : '';

  const filledCount = cells.filter(Boolean).length;
  const allReady = cells.length === total && filledCount === total;

  // Manual set change: reset working cells (grid size differs) + cell default.
  const handleSetChange = (newSet: ExpressionSet) => {
    setSet(newSet);
    setCell(defaultCellFor(newSet));
    setCells(new Array(getExpressions(newSet).length).fill(null));
    setSheetUrl(null);
    setError(null);
    setProgress({ done: 0, total: getExpressions(newSet).length, currentId: null });
  };

  // Manual cell-size change: keep cells, invalidate the composed sheet (recompose button shows).
  const handleCellSizeChange = (c: number) => {
    setCell(c);
    setSheetUrl(null);
  };

  // Restore a previously-saved sheet when the base changes (runs only on base switch).
  useEffect(() => {
    const b = savedAvatars.find(a => a.id === emotionBaseId);
    const meta = b?.emotionSheet;
    setCells([]);
    setSheetUrl(null);
    setError(null);
    setProgress({ done: 0, total: 0, currentId: null });
    if (b && meta) {
      setSet(meta.set);
      setCell(meta.cell);
      setMember(meta.member);
      let stale = false;
      loadEmotionSheet(b.id).then(url => { if (!stale && url) setSheetUrl(url); });
      return () => { stale = true; };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotionBaseId]);

  const runGeneration = useCallback(async (resume: boolean) => {
    if (!base) return;
    const lockSettings = base.mode === 'builder' ? base.settings : null;
    const working = resume && cells.length === total ? [...cells] : new Array(total).fill(null);
    cancelRef.current = false;
    setIsGenerating(true);
    setError(null);
    setSheetUrl(null);

    for (let i = 0; i < total; i++) {
      if (cancelRef.current) { setIsGenerating(false); return; }
      if (working[i]) continue; // resume: skip already-done cells
      const expr = expressions[i];
      setProgress({ done: i, total, currentId: expr.id });

      let ok = false;
      for (let attempt = 0; attempt < MAX_RETRY && !ok; attempt++) {
        try {
          if (dryRun) {
            working[i] = solidCell(expr.bg, 64);
          } else {
            const result = await generateExpressionCell(base.imageUrl, expr.desc, styleName, lockSettings);
            working[i] = result.imageUrl;
            await onLogUsage(result.usage);
          }
          ok = true;
        } catch (err) {
          if (attempt === MAX_RETRY - 1) {
            console.error(`[emotion] cell "${expr.id}" failed:`, err);
            setCells([...working]);
            setError(`표정 "${expr.id}" 생성 실패 (${filledCountOf(working)}/${total} 완료): ${err instanceof Error ? err.message : String(err)}`);
            setIsGenerating(false);
            return;
          }
        }
      }
      setCells([...working]);
    }

    setProgress({ done: total, total, currentId: null });
    try {
      const url = await composeSheet(working as string[], cols, rows, cell);
      setSheetUrl(url);
      showToast('감정 시트 완성!');
    } catch (err) {
      setError(`시트 합성 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
    setIsGenerating(false);
  }, [base, cells, total, expressions, dryRun, styleName, onLogUsage, cols, rows, cell, showToast]);

  const recompose = useCallback(async () => {
    if (!allReady) return;
    setError(null);
    try {
      const url = await composeSheet(cells as string[], cols, rows, cell);
      setSheetUrl(url);
    } catch (err) {
      setError(`시트 합성 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [allReady, cells, cols, rows, cell]);

  // Regenerate a single cell (e.g. one that drifted), then recompose the sheet.
  const regenerateCell = useCallback(async (i: number) => {
    if (!base || isGenerating || regenningIndex !== null) return;
    const expr = expressions[i];
    const lockSettings = base.mode === 'builder' ? base.settings : null;
    setRegenningIndex(i);
    setError(null);
    try {
      let url: string;
      if (dryRun) {
        url = solidCell(expr.bg, 64);
      } else {
        const result = await generateExpressionCell(base.imageUrl, expr.desc, styleName, lockSettings);
        url = result.imageUrl;
        await onLogUsage(result.usage);
      }
      const working = [...cells];
      working[i] = url;
      setCells(working);
      if (working.length === total && working.every(Boolean)) {
        setSheetUrl(await composeSheet(working as string[], cols, rows, cell));
      }
    } catch (err) {
      console.error(`[emotion] regenerate cell "${expr.id}" failed:`, err);
      setError(`표정 "${expr.id}" 재생성 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRegenningIndex(null);
    }
  }, [base, isGenerating, regenningIndex, expressions, dryRun, styleName, onLogUsage, cells, total, cols, rows, cell]);

  const exportManifest = useCallback(() => {
    const manifest = {
      member,
      cols, rows, cell,
      set,
      order: expressions.map(e => e.id),
      style: styleName,
      model: 'gemini-2.5-flash-image',
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `${member}-manifest.json`);
    URL.revokeObjectURL(url);
  }, [member, cols, rows, cell, set, expressions, styleName]);

  // Persist the composed sheet to the selected avatar ("내 아바타에 저장").
  const saveSheet = useCallback(async () => {
    if (!base || !sheetUrl) return;
    setSaving(true);
    setError(null);
    try {
      const meta: EmotionSheetMeta = {
        set, cols, rows, cell,
        order: expressions.map(e => e.id),
        member,
        updatedAt: Date.now(),
      };
      await onPersistSheet(base.id, meta, sheetUrl);
      showToast('내 아바타에 저장됨');
    } catch (err) {
      console.error('[emotion] persist failed:', err);
      setError(`저장 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [base, sheetUrl, set, cols, rows, cell, expressions, member, onPersistSheet, showToast]);

  // Export a layered PSD (cell=layer, name=expression id, + boundary guides) for hand-editing.
  const exportPsd = useCallback(async () => {
    if (!sheetUrl) return;
    setPsdBusy(true);
    setError(null);
    try {
      await exportEmotionSheetPsd({
        sheetUrl, order: expressions.map(e => e.id), cols, rows, cell, filename: `${member}.psd`,
      });
    } catch (err) {
      console.error('[emotion] PSD export failed:', err);
      setError(`PSD 내보내기 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPsdBusy(false);
    }
  }, [sheetUrl, expressions, cols, rows, cell, member]);

  // ── No base avatars yet ──
  if (savedAvatars.length === 0) {
    return (
      <section>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-12 flex flex-col items-center text-center gap-5">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
            <Smile className="w-9 h-9 text-zinc-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-zinc-200">먼저 아바타를 만들어 주세요</h3>
            <p className="text-sm text-zinc-500 max-w-sm">감정 시트는 만들어 둔 아바타를 베이스로 표정 세트를 생성합니다.</p>
          </div>
          <button onClick={onGoCreate} className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center gap-2 transition-colors">
            <UserCircle className="w-5 h-5" /> 아바타 만들러 가기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="grid lg:grid-cols-[1fr_420px] gap-12">
      {/* Left: controls */}
      <div className="space-y-8">
        {/* Base picker */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <UserCircle className="w-4 h-4" /> 베이스 아바타 선택
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {savedAvatars.map((a) => (
              <button
                key={a.id}
                onClick={() => setEmotionBaseId(a.id)}
                disabled={isGenerating}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all disabled:opacity-50 ${
                  emotionBaseId === a.id ? 'border-emerald-500 scale-95' : 'border-transparent hover:border-zinc-700'
                }`}
              >
                <img src={a.imageUrl} alt="Base" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Set toggle */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Smile className="w-4 h-4" /> 표정 세트
          </label>
          <div className="flex p-1 bg-zinc-900/80 rounded-2xl border border-zinc-800">
            {([['bucket9', '9 표정', '빠름'], ['full100', '100 표정', '정밀']] as const).map(([key, title, sub]) => (
              <button
                key={key}
                onClick={() => handleSetChange(key)}
                disabled={isGenerating}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                  set === key ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {title} <span className="text-[10px] opacity-70 font-medium">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cell size */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">셀 크기</label>
          <div className="flex gap-3">
            {CELL_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => handleCellSizeChange(c)}
                disabled={isGenerating}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all disabled:opacity-50 ${
                  cell === c ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {c}px
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            시트 해상도: <span className="font-mono text-zinc-300">{sheetPx}×{sheetPx}px</span> ({cols}×{rows} 칸)
          </p>
          {heavy && (
            <p className="text-xs text-orange-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> 100칸×256px = {sheetPx}²px — RN 번들에 무거움. 128px 권장.
            </p>
          )}
        </div>

        {/* Member name + dry run */}
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">멤버 이름 (파일명)</label>
            <input
              value={member}
              onChange={(e) => setMember(e.target.value.trim() || 'member')}
              disabled={isGenerating}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => setDryRun(v => !v)}
            disabled={isGenerating}
            title="API 없이 단색 칸으로 합성/매니페스트만 검증"
            className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all disabled:opacity-50 ${
              dryRun ? 'bg-amber-500/15 border-amber-500/50 text-amber-400' : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <FlaskConical className="w-4 h-4" /> 드라이런 {dryRun ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Generate / cancel / resume */}
        <div className="space-y-3">
          {isGenerating ? (
            <button
              onClick={() => { cancelRef.current = true; }}
              className="w-full py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-3 transition-colors"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              생성 중 [{progress.done}/{progress.total}] {progress.currentId ?? ''} — 취소
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => runGeneration(false)}
                disabled={!base}
                className="flex-[2] py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center gap-2 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                {dryRun ? '드라이런 생성' : `감정 시트 생성 (${total}회 호출)`}
              </button>
              {filledCount > 0 && filledCount < total && (
                <button
                  onClick={() => runGeneration(true)}
                  disabled={!base}
                  className="flex-1 py-4 rounded-2xl border border-zinc-700 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400 font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4" /> 이어서
                </button>
              )}
            </div>
          )}
          {set === 'full100' && !dryRun && !isGenerating && (
            <p className="text-xs text-orange-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> 100회 Gemini 호출 — 시간·쿼터·비용에 유의하세요.
            </p>
          )}
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 py-3 px-4 rounded-xl border border-red-400/20">{error}</p>
          )}
        </div>
      </div>

      {/* Right: preview + export */}
      <div className="space-y-6">
        <div className="aspect-square bg-zinc-900/50 border border-zinc-800 rounded-[32px] flex items-center justify-center overflow-hidden relative">
          {sheetUrl ? (
            <img src={sheetUrl} alt="Emotion sheet" className="w-full h-full object-contain bg-black/20" />
          ) : base ? (
            <img src={base.imageUrl} alt="Selected base" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="text-center space-y-3 px-8">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                <Smile className="w-7 h-7 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">왼쪽에서 베이스를 선택하세요</p>
            </div>
          )}
          {isGenerating && !sheetUrl && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-emerald-400 text-sm font-medium">{progress.done}/{progress.total} 표정 생성 중…</p>
            </div>
          )}
        </div>

        {/* Recompose hint when cells exist but sheet not composed at current size */}
        {allReady && !sheetUrl && !isGenerating && (
          <button onClick={recompose} className="w-full py-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/40 text-sm font-medium text-zinc-300 hover:text-emerald-400 transition-all flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> 현재 셀 크기({cell}px)로 시트 합성
          </button>
        )}

        {/* Per-cell editor — click a drifted cell to regenerate just that one */}
        {filledCount > 0 && !isGenerating && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">셀 (클릭 시 재생성)</p>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {expressions.map((expr, i) => {
                const url = cells[i];
                const busy = regenningIndex === i;
                return (
                  <button
                    key={expr.id}
                    onClick={() => regenerateCell(i)}
                    disabled={regenningIndex !== null}
                    title={`${expr.id} — 재생성`}
                    className="aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 relative group disabled:cursor-default"
                  >
                    {url ? (
                      <img src={url} alt={expr.id} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-600">{i + 1}</div>
                    )}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${busy ? 'bg-black/70 opacity-100' : 'bg-black/50 opacity-0 group-hover:opacity-100'}`}>
                      {busy ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> : <RefreshCw className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Export */}
        {sheetUrl && (
          <div className="space-y-3">
            <button
              onClick={saveSheet}
              disabled={saving || !base}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              내 아바타에 저장
            </button>
            <div className="flex gap-3">
              <button onClick={() => downloadDataUrl(sheetUrl, `${member}.png`)} className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                <Download className="w-4 h-4" /> {member}.png
              </button>
              <button onClick={exportManifest} className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                <FileJson className="w-4 h-4" /> manifest.json
              </button>
            </div>
            <button
              onClick={exportPsd}
              disabled={psdBusy}
              title="칸별 레이어 + 경계 가이드. Photoshop에서 손편집 후 PNG로 교체."
              className="w-full py-3 rounded-2xl border border-zinc-700 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {psdBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              레이어드 PSD ({member}.psd)
            </button>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">famillie-kim 연동</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                시트를 에셋으로 복사하고 <span className="text-zinc-300 font-mono">avatarSheets.js</span>에 등록하세요:
              </p>
              <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap bg-black/30 rounded-lg p-2.5 leading-relaxed">{`copy ${member}.png  E:\\Coding\\famillie-kim\\src\\assets\\avatars\\${member}.png

avatarSheets.js → SHEETS 에 추가:
  ${member}: { source: require('../../../assets/avatars/${member}.png'),
    cols:${cols}, rows:${rows}, cell:${cell}, set:'${set}', order: EXPRESSIONS }`}</pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function filledCountOf(arr: (string | null)[]): number {
  return arr.filter(Boolean).length;
}
