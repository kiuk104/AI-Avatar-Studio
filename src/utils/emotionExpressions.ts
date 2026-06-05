/**
 * 표정 세트 정의 (스튜디오측 단일 출처)
 *
 * ⚠️ 동기화 경고: 표정 id 순서는 소비처 famillie-kim과 **반드시 동일**해야 한다.
 *   - bucket9 → famillie-kim `src/screens/parent/emotion/emotionExpressions.js`의 EXPRESSIONS
 *   - full100 → famillie-kim `src/screens/parent/emotion/emotionData.js`의 MOOD_GRID (row-major)
 * 순서가 어긋나면 감정차트의 (row,col) 슬라이싱이 깨진다. 바꾸면 양쪽을 같이 고칠 것.
 *
 * 합성 시트는 EXPRESSIONS 순서대로 칸이 채워진다(left=(i%cols)*cell, top=floor(i/cols)*cell).
 */

export type ExpressionSet = 'bucket9' | 'full100';

export type Expression = {
  id: string;
  desc: string;              // Gemini에 줄 표정 지시문
  bg: [number, number, number]; // dryRun(placeholder) 셀 배경색
};

// ── 9버킷: 중립 + 사분면×(약/강) ── (scripts/generate-emotion-sheet.ts EXPRESSIONS와 동일)
export const BUCKET9: Expression[] = [
  { id: 'neutral',        desc: 'calm neutral expression, relaxed face, slight closed-mouth',            bg: [176, 190, 197] },
  { id: 'red_mild',       desc: 'annoyed and frustrated, furrowed brows, slight frown',                  bg: [229, 57, 53] },
  { id: 'red_intense',    desc: 'very angry, almost enraged, shouting with open mouth, sharp lowered brows', bg: [197, 40, 40] },
  { id: 'yellow_mild',    desc: 'happy and cheerful, warm smile, bright eyes',                            bg: [249, 168, 37] },
  { id: 'yellow_intense', desc: 'ecstatic and excited, big open joyful smile, raised eyebrows',           bg: [245, 127, 23] },
  { id: 'blue_mild',      desc: 'down and worried, gentle frown, sad downturned eyes',                    bg: [30, 136, 229] },
  { id: 'blue_intense',   desc: 'very sad, teary eyes, deep frown, sorrowful',                            bg: [21, 101, 192] },
  { id: 'green_mild',     desc: 'content and peaceful, soft gentle closed-mouth smile',                  bg: [67, 160, 71] },
  { id: 'green_intense',  desc: 'blissful and serene, eyes softly closed, warm relaxed smile',           bg: [46, 125, 50] },
];

// ── 100감정: famillie-kim MOOD_GRID를 row-major로 평탄화한 [id, 영문라벨] (10×10) ──
// 행(row) 0=고에너지 … 9=저에너지 / 열(col) 0=불쾌 … 9=쾌적.
const MOOD_100: [string, string][] = [
  // row 0
  ['enraged', 'Enraged'], ['panicked', 'Panicked'], ['stressed', 'Stressed'], ['jittery', 'Jittery'], ['shocked', 'Shocked'], ['surprised', 'Surprised'], ['upbeat', 'Upbeat'], ['festive', 'Festive'], ['exhilarated', 'Exhilarated'], ['ecstatic', 'Ecstatic'],
  // row 1
  ['livid', 'Livid'], ['furious', 'Furious'], ['frustrated', 'Frustrated'], ['tense', 'Tense'], ['stunned', 'Stunned'], ['hyper', 'Hyper'], ['cheerful', 'Cheerful'], ['motivated', 'Motivated'], ['inspired', 'Inspired'], ['elated', 'Elated'],
  // row 2
  ['fuming', 'Fuming'], ['frightened', 'Frightened'], ['angry', 'Angry'], ['nervous', 'Nervous'], ['restless', 'Restless'], ['energized', 'Energized'], ['lively', 'Lively'], ['excited', 'Excited'], ['optimistic', 'Optimistic'], ['enthusiastic', 'Enthusiastic'],
  // row 3
  ['anxious', 'Anxious'], ['apprehensive', 'Apprehensive'], ['worried', 'Worried'], ['irritated', 'Irritated'], ['annoyed', 'Annoyed'], ['pleased', 'Pleased'], ['focused', 'Focused'], ['happy', 'Happy'], ['proud', 'Proud'], ['thrilled', 'Thrilled'],
  // row 4
  ['repulsed', 'Repulsed'], ['troubled', 'Troubled'], ['concerned', 'Concerned'], ['uneasy', 'Uneasy'], ['peeved', 'Peeved'], ['pleasant', 'Pleasant'], ['joyful', 'Joyful'], ['hopeful', 'Hopeful'], ['playful', 'Playful'], ['blissful', 'Blissful'],
  // row 5
  ['disgusted', 'Disgusted'], ['glum', 'Glum'], ['disappointed', 'Disappointed'], ['down', 'Down'], ['apathetic', 'Apathetic'], ['at-ease', 'At ease'], ['easygoing', 'Easygoing'], ['content', 'Content'], ['love', 'Loving'], ['fulfilled', 'Fulfilled'],
  // row 6
  ['pessimistic', 'Pessimistic'], ['morose', 'Morose'], ['discouraged', 'Discouraged'], ['sad', 'Sad'], ['bored', 'Bored'], ['calm', 'Calm'], ['secure', 'Secure'], ['satisfied', 'Satisfied'], ['grateful', 'Grateful'], ['touched', 'Touched'],
  // row 7
  ['alienated', 'Alienated'], ['miserable', 'Miserable'], ['lonely', 'Lonely'], ['disheartened', 'Disheartened'], ['tired', 'Tired'], ['relaxed', 'Relaxed'], ['chill', 'Chill'], ['restful', 'Restful'], ['blessed', 'Blessed'], ['balanced', 'Balanced'],
  // row 8
  ['despondent', 'Despondent'], ['depressed', 'Depressed'], ['sullen', 'Sullen'], ['exhausted', 'Exhausted'], ['fatigued', 'Fatigued'], ['mellow', 'Mellow'], ['thoughtful', 'Thoughtful'], ['peaceful', 'Peaceful'], ['comfortable', 'Comfortable'], ['carefree', 'Carefree'],
  // row 9
  ['despairing', 'Despairing'], ['hopeless', 'Hopeless'], ['desolate', 'Desolate'], ['spent', 'Spent'], ['drained', 'Drained'], ['sleepy', 'Sleepy'], ['complacent', 'Complacent'], ['tranquil', 'Tranquil'], ['cozy', 'Cozy'], ['serene', 'Serene'],
];

// 사분면 solid 색 (emotionData.js QUADRANT_COLORS) — dryRun 배경용
const QUADRANT_BG: Record<string, [number, number, number]> = {
  red: [229, 57, 53], yellow: [249, 168, 37], blue: [30, 136, 229], green: [67, 160, 71],
};

export const FULL100: Expression[] = MOOD_100.map(([id, en], i) => {
  const row = Math.floor(i / 10), col = i % 10;
  const quadrant = row <= 4 ? (col <= 4 ? 'red' : 'yellow') : (col <= 4 ? 'blue' : 'green');
  return { id, desc: `${en} facial expression`, bg: QUADRANT_BG[quadrant] };
});

export function getExpressions(set: ExpressionSet): Expression[] {
  return set === 'full100' ? FULL100 : BUCKET9;
}

export function gridFor(set: ExpressionSet): { cols: number; rows: number } {
  return set === 'full100' ? { cols: 10, rows: 10 } : { cols: 3, rows: 3 };
}

export const CELL_PRESETS = [128, 160, 256] as const;

export function defaultCellFor(set: ExpressionSet): number {
  return set === 'full100' ? 128 : 160;
}
