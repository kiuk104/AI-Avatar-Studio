/**
 * PSD 내보내기 (ag-psd) — Photoshop 손편집용 레이어드 PSD 생성.
 * 재임포트는 만들지 않는다(파일 교체 워크플로우).
 */
import { writePsd, type Psd, type Layer } from 'ag-psd';
import { loadImage } from './sheetCompositor';

function canvasOf(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d 컨텍스트를 얻지 못했습니다');
  draw(ctx);
  return canvas;
}

function downloadPsdBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: 'image/vnd.adobe.photoshop' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 기능 A — 현재 아바타를 단일 레이어('avatar', 투명 배경) PSD로 내보낸다. */
export async function exportAvatarPsd(dataUrl: string, filename: string): Promise<void> {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = canvasOf(w, h, ctx => ctx.drawImage(img, 0, 0));
  const psd: Psd = {
    width: w,
    height: h,
    canvas,
    children: [{ name: 'avatar', left: 0, top: 0, canvas }],
  };
  downloadPsdBuffer(writePsd(psd), filename);
}

/**
 * 기능 B — 합성 시트를 칸별 레이어로 분해한 레이어드 PSD.
 * 칸 i → 레이어(name=order[i], left=(i%cols)*cell, top=floor(i/cols)*cell, cell×cell).
 * 칸 경계 가이드 포함. 시트의 타일을 슬라이스하므로 생성 직후·복원 후 모두 동작.
 */
export async function exportEmotionSheetPsd(opts: {
  sheetUrl: string;
  order: string[];
  cols: number;
  rows: number;
  cell: number;
  filename: string;
}): Promise<void> {
  const { sheetUrl, order, cols, rows, cell, filename } = opts;
  const sheet = await loadImage(sheetUrl);
  const width = cols * cell;
  const height = rows * cell;

  const doc = canvasOf(width, height, ctx => ctx.drawImage(sheet, 0, 0, width, height));

  const children: Layer[] = order.map((name, i) => {
    const left = (i % cols) * cell;
    const top = Math.floor(i / cols) * cell;
    const tile = canvasOf(cell, cell, ctx =>
      ctx.drawImage(sheet, left, top, cell, cell, 0, 0, cell, cell),
    );
    return { name, left, top, canvas: tile };
  });

  // Cell-boundary guides (Photoshop document guides).
  const guides: { location: number; direction: 'horizontal' | 'vertical' }[] = [];
  for (let c = 1; c < cols; c++) guides.push({ location: c * cell, direction: 'vertical' });
  for (let r = 1; r < rows; r++) guides.push({ location: r * cell, direction: 'horizontal' });

  const psd: Psd = {
    width,
    height,
    canvas: doc,
    children,
    imageResources: {
      gridAndGuidesInformation: { guides },
    },
  };
  downloadPsdBuffer(writePsd(psd), filename);
}
