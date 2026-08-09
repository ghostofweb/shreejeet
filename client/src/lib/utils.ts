import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Author } from './types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function formatDate(value?: string | Date | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, opts ?? { day: 'numeric', month: 'long', year: 'numeric' });
}

export function toDateInput(value?: string | Date | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/** "Added by her ❤️" — attribution phrased the way a person would say it. */
export function attribution(by: Author, names?: { me?: string; her?: string }): string {
  if (by === 'both') return 'Added together 🫶';
  if (by === 'her') return `Added by ${names?.her ?? 'her'} ❤️`;
  return `Added by ${names?.me ?? 'him'} ❤️`;
}

export function daysBetween(a: Date, b: Date): number {
  const MS = 86_400_000;
  const start = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const end = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((end - start) / MS);
}

/** For yearly dates, the next time it comes around (today counts as today). */
export function nextOccurrence(date: string | Date, recurrence: 'none' | 'yearly'): Date {
  const d = new Date(date);
  if (recurrence !== 'yearly') return d;
  const now = new Date();
  const candidate = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    candidate.setFullYear(now.getFullYear() + 1);
  }
  return candidate;
}

export function pluralise(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Deterministic 0–1 from a string — stable jitter for scattered layouts. */
export function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
