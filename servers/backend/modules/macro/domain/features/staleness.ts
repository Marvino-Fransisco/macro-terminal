import type { Frequency } from "../value-objects/frequency.vo";

export function isStale(periodDate: string | null, frequency: Frequency, now: Date): boolean {
  if (!periodDate) return true;
  const maxAgeDays: Record<Frequency, number> = { daily: 7, weekly: 21, monthly: 100, quarterly: 240, annual: 1095, irregular: 100 };
  return now.getTime() - Date.parse(periodDate) > maxAgeDays[frequency] * 86400_000;
}
