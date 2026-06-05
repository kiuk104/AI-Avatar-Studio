import { openDB } from './avatarDB';

const STORE = 'api-usage';

// --- Cost constants (EUR) ---
const USD_TO_EUR = 0.92;
const INPUT_COST_PER_M  = 0.075 * USD_TO_EUR;  // €0.069 / 1M tokens
const OUTPUT_COST_PER_M = 0.30  * USD_TO_EUR;   // €0.276 / 1M tokens
const IMAGE_COST        = 0.03  * USD_TO_EUR;    // €0.0276 / image

// --- Warning thresholds (EUR) ---
export const DAILY_WARN  = 1.00;
export const MONTHLY_WARN = 10.00;

export type UsageMetadata = {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
};

export type DailyUsage = {
  date: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  imageCount: number;
  estimatedCost: number;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcCost(inputTokens: number, outputTokens: number, imageCount: number): number {
  return (inputTokens / 1_000_000) * INPUT_COST_PER_M
       + (outputTokens / 1_000_000) * OUTPUT_COST_PER_M
       + imageCount * IMAGE_COST;
}

export async function logApiCall(usage: UsageMetadata): Promise<void> {
  const db = await openDB();
  const date = todayKey();

  // Read existing record for today
  const existing = await new Promise<DailyUsage | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(date);
    req.onsuccess = () => resolve(req.result as DailyUsage | undefined);
    req.onerror = () => reject(req.error);
  });

  const record: DailyUsage = existing ?? {
    date,
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    imageCount: 0,
    estimatedCost: 0,
  };

  record.calls += 1;
  record.inputTokens += usage.promptTokenCount;
  record.outputTokens += usage.candidatesTokenCount;
  record.imageCount += 1;
  record.estimatedCost = calcCost(record.inputTokens, record.outputTokens, record.imageCount);

  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(record);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTodayUsage(): Promise<DailyUsage | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(todayKey());
    req.onsuccess = () => resolve((req.result as DailyUsage) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getMonthUsage(): Promise<DailyUsage[]> {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const all = await getAllUsage();
  return all.filter(r => r.date.startsWith(prefix));
}

export async function getAllUsage(): Promise<DailyUsage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as DailyUsage[]).sort((a, b) => a.date.localeCompare(b.date)));
    req.onerror = () => reject(req.error);
  });
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function sumUsage(records: DailyUsage[]): { calls: number; inputTokens: number; outputTokens: number; cost: number } {
  return records.reduce(
    (acc, r) => ({
      calls: acc.calls + r.calls,
      inputTokens: acc.inputTokens + r.inputTokens,
      outputTokens: acc.outputTokens + r.outputTokens,
      cost: acc.cost + r.estimatedCost,
    }),
    { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
  );
}
