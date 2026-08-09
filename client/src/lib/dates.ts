import type { ImportantDate } from './types';

export interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

/** Time from now until `target`. Negative totals mean it has already passed. */
export function partsUntil(target: Date, now = Date.now()): Parts {
  const total = target.getTime() - now;
  const abs = Math.abs(total);
  return {
    total,
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs / 3_600_000) % 24),
    minutes: Math.floor((abs / 60_000) % 60),
    seconds: Math.floor((abs / 1000) % 60),
  };
}

/**
 * When this date next happens. Yearly dates roll forward to the coming
 * occurrence; one-off dates stay where they are.
 */
export function nextOccurrenceOf(d: ImportantDate, now = new Date()): Date {
  const base = new Date(d.date);
  if (d.recurrence !== 'yearly') return base;

  const candidate = new Date(
    now.getFullYear(),
    base.getMonth(),
    base.getDate(),
    base.getHours(),
    base.getMinutes()
  );
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (candidate < todayStart) candidate.setFullYear(now.getFullYear() + 1);
  return candidate;
}

/** Whole days between two dates, ignoring clock time. */
export function wholeDaysBetween(a: Date, b: Date): number {
  const start = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const end = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((end - start) / 86_400_000);
}

/** How many years old this occurrence makes it — "our 2nd anniversary". */
export function ordinalYears(d: ImportantDate, occurrence: Date): number | null {
  if (d.recurrence !== 'yearly') return null;
  const years = occurrence.getFullYear() - new Date(d.date).getFullYear();
  return years > 0 ? years : null;
}

export function ordinalSuffix(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Ordered the way you'd actually want to read them: what is coming, soonest
 * first, then what has already happened, most recent first.
 *
 * A plain sort by occurrence puts long-past one-off dates at the top, which
 * made the "next up" card count down to something that had already been.
 */
export function byUpcoming(items: ImportantDate[], now = new Date()): ImportantDate[] {
  const future: ImportantDate[] = [];
  const past: ImportantDate[] = [];
  for (const d of items) {
    (wholeDaysBetween(now, nextOccurrenceOf(d, now)) >= 0 ? future : past).push(d);
  }
  const soonest = (a: ImportantDate, b: ImportantDate) =>
    nextOccurrenceOf(a, now).getTime() - nextOccurrenceOf(b, now).getTime();

  future.sort(soonest);
  past.sort((a, b) => soonest(b, a));
  return [...future, ...past];
}

/** The soonest date still ahead of us, if there is one. */
export function nextAhead(items: ImportantDate[], now = new Date()): ImportantDate | undefined {
  return byUpcoming(items, now).find(
    (d) => wholeDaysBetween(now, nextOccurrenceOf(d, now)) >= 0
  );
}
