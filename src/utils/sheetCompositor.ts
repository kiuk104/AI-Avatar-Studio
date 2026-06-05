/**
 * 표정 셀들을 한 장의 스프라이트 시트(아틀라스)로 합성한다 — 브라우저 canvas 버전.
 * (배치 스크립트의 sharp composite 대체. 배치식 동일: left=(i%cols)*cell, top=floor(i/cols)*cell)
 */

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = url;
  });
}

/**
 * @param cellUrls 표정 순서대로의 셀 이미지 dataURL 배열 (길이 = cols*rows)
 * @returns 합성된 시트 PNG dataURL
 */
export async function composeSheet(
  cellUrls: string[],
  cols: number,
  rows: number,
  cell: number,
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d 컨텍스트를 얻지 못했습니다');

  const imgs = await Promise.all(cellUrls.map(loadImage));
  imgs.forEach((img, i) => {
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cell;
    // 소스가 1:1이므로 정사각 리사이즈만(별도 cover 불필요)
    ctx.drawImage(img, x, y, cell, cell);
  });

  return canvas.toDataURL('image/png');
}

/** dryRun용: 단색 셀 dataURL 생성 (API 없이 합성/매니페스트 검증). */
export function solidCell(bg: [number, number, number], cell: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = cell;
  canvas.height = cell;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d 컨텍스트를 얻지 못했습니다');
  ctx.fillStyle = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`;
  ctx.fillRect(0, 0, cell, cell);
  return canvas.toDataURL('image/png');
}
