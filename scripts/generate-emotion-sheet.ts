/**
 * 감정 세트(표정 시트) 생성기
 *
 * 베이스 아바타 1장을 기준으로, 9가지 표정을 referenceImage 로 일관되게 생성하고
 * 3×3 스프라이트 시트(아틀라스) 1장 + manifest.json 으로 합성한다.
 *
 * 출력 시트는 famillie-kim 의 감정차트에서 (row,col)로 한 칸씩 잘라 쓴다.
 * 표정 순서는 famillie-kim/src/screens/parent/emotion/emotionExpressions.js 의
 * EXPRESSIONS 배열과 반드시 동일해야 한다.
 *
 * 사용 예:
 *   npx tsx scripts/generate-emotion-sheet.ts --member dad --base "한국인 40대 남성, 짧은 검은 머리, 안경"
 *   npx tsx scripts/generate-emotion-sheet.ts --member mom --base-image ./out/mom-base.png
 *   npx tsx scripts/generate-emotion-sheet.ts --member dad --base "..." --dry-run   (API 없이 합성만 테스트)
 */
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config({ path: ".env.local" });

// ── 9버킷 표정 (emotionExpressions.js EXPRESSIONS 와 동일 순서) ──
const EXPRESSIONS: { id: string; desc: string; bg: [number, number, number] }[] = [
  { id: "neutral",        desc: "calm neutral expression, relaxed face, slight closed-mouth", bg: [176, 190, 197] },
  { id: "red_mild",       desc: "annoyed and frustrated, furrowed brows, slight frown",         bg: [229, 57, 53] },
  { id: "red_intense",    desc: "very angry, almost enraged, shouting with open mouth, sharp lowered brows", bg: [197, 40, 40] },
  { id: "yellow_mild",    desc: "happy and cheerful, warm smile, bright eyes",                   bg: [249, 168, 37] },
  { id: "yellow_intense", desc: "ecstatic and excited, big open joyful smile, raised eyebrows",  bg: [245, 127, 23] },
  { id: "blue_mild",      desc: "down and worried, gentle frown, sad downturned eyes",           bg: [30, 136, 229] },
  { id: "blue_intense",   desc: "very sad, teary eyes, deep frown, sorrowful",                   bg: [21, 101, 192] },
  { id: "green_mild",     desc: "content and peaceful, soft gentle closed-mouth smile",          bg: [67, 160, 71] },
  { id: "green_intense",  desc: "blissful and serene, eyes softly closed, warm relaxed smile",   bg: [46, 125, 50] },
];

const COLS = 3;
const ROWS = 3;

// ── 인자 파싱 ──
function arg(key: string, def = ""): string {
  const i = process.argv.indexOf(`--${key}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const member    = arg("member", "member");
const cell      = parseInt(arg("cell", "256"), 10);
const baseText  = arg("base", "");
const baseImage = arg("base-image", "");
const style     = arg("style", "Apple Memoji style, 3D Pixar-style character, head and shoulders, front-facing, soft studio lighting, clean solid light-gray background");
const outDir    = path.resolve(arg("out", `out/emotion-sheets/${member}`));
const dryRun     = process.argv.includes("--dry-run");
const keepCells  = process.argv.includes("--keep-cells");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

function fileToDataUrl(p: string): string {
  const buf = fs.readFileSync(p);
  const ext = (path.extname(p).slice(1) || "png").toLowerCase();
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

async function genImage(prompt: string, ref?: string): Promise<Buffer> {
  const parts: any[] = [{ text: prompt }];
  if (ref) {
    const m = ref.match(/^data:(image\/\w+);base64,(.+)$/);
    if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
  }
  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts },
    config: { imageConfig: { aspectRatio: "1:1" } },
  });
  for (const p of res.candidates?.[0]?.content?.parts || []) {
    if (p.inlineData) return Buffer.from(p.inlineData.data!, "base64");
  }
  throw new Error("Gemini 응답에서 이미지 데이터를 찾지 못했습니다");
}

function promptFor(desc: string): string {
  return `${style}. The SAME character/person as the provided reference image — keep the identity, hairstyle, skin tone, glasses and facial features EXACTLY the same. Change ONLY the facial expression to: ${desc}. Keep framing, scale and lighting consistent across renders.`;
}

// 드라이런: API 없이 사분면 색 단색 칸으로 합성만 검증
async function placeholderCell(bg: [number, number, number]): Promise<Buffer> {
  return await sharp({
    create: { width: cell, height: cell, channels: 4, background: { r: bg[0], g: bg[1], b: bg[2], alpha: 1 } },
  }).png().toBuffer();
}

async function main() {
  if (!dryRun && !process.env.GEMINI_API_KEY) {
    console.error("[오류] .env.local 에 GEMINI_API_KEY 가 없습니다. (또는 --dry-run 으로 합성만 테스트)");
    process.exit(1);
  }
  if (!dryRun && !baseText && !baseImage) {
    console.error("[오류] --base \"설명\" 또는 --base-image <경로> 중 하나가 필요합니다.");
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  console.log(`\n감정 세트 생성: member=${member}  cell=${cell}px  ${dryRun ? "(DRY-RUN)" : ""}`);
  console.log(`출력 폴더: ${outDir}\n`);

  // 1) 베이스 참조 이미지 확보
  let baseRef: string | undefined;
  if (!dryRun) {
    if (baseImage) {
      baseRef = fileToDataUrl(baseImage);
      console.log(`[베이스] 기존 이미지 사용: ${baseImage}`);
    } else {
      console.log(`[베이스] 생성 중...`);
      const baseBuf = await genImage(`${style}. ${baseText}. Friendly neutral expression.`);
      const basePath = path.join(outDir, "_base.png");
      fs.writeFileSync(basePath, baseBuf);
      baseRef = `data:image/png;base64,${baseBuf.toString("base64")}`;
      console.log(`[베이스] 저장: ${basePath}`);
    }
  }

  // 2) 표정별 생성 → 칸 버퍼
  const cells: Buffer[] = [];
  for (let i = 0; i < EXPRESSIONS.length; i++) {
    const e = EXPRESSIONS[i];
    process.stdout.write(`  [${i + 1}/${EXPRESSIONS.length}] ${e.id} ... `);
    let buf: Buffer;
    if (dryRun) {
      buf = await placeholderCell(e.bg);
    } else {
      buf = await genImage(promptFor(e.desc), baseRef);
    }
    const fitted = await sharp(buf).resize(cell, cell, { fit: "cover" }).png().toBuffer();
    cells.push(fitted);
    if (keepCells) fs.writeFileSync(path.join(outDir, `cell-${i}-${e.id}.png`), fitted);
    console.log("OK");
  }

  // 3) 3×3 시트 합성
  const sheetPath = path.join(outDir, "sheet.png");
  await sharp({
    create: { width: cell * COLS, height: cell * ROWS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(cells.map((input, i) => ({ input, left: (i % COLS) * cell, top: Math.floor(i / COLS) * cell })))
    .png()
    .toFile(sheetPath);

  // 4) manifest
  const manifest = {
    member,
    cols: COLS,
    rows: ROWS,
    cell,
    set: "bucket9",
    order: EXPRESSIONS.map((e) => e.id),
    style,
    model: "gemini-2.5-flash-image",
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\n완료 ✓`);
  console.log(`  시트:     ${sheetPath}`);
  console.log(`  manifest: ${path.join(outDir, "manifest.json")}`);
  console.log(`\n다음 단계: 시트를 famillie-kim 에 복사하고 avatarSheets.js 에 등록하세요.`);
  console.log(`  copy "${sheetPath}" "E:\\Coding\\famillie-kim\\src\\assets\\avatars\\${member}.png"`);
  console.log(`  → avatarSheets.js SHEETS 에 { ${member}: { source: require('../../../assets/avatars/${member}.png'), cols:${COLS}, rows:${ROWS}, cell:${cell}, set:'bucket9', order: EXPRESSIONS } } 추가`);
  console.log(`  → 멤버 doc 의 avatarSheet 를 '${member}' 로 설정 (또는 PoC_FORCE_SHEET 로 전체 적용)`);
}

main().catch((err) => {
  console.error("\n[실패]", err?.message || err);
  process.exit(1);
});
