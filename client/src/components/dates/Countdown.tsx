import { useEffect, useState } from 'react';
import { partsUntil, type Parts } from '@/lib/dates';
import { cn } from '@/lib/utils';

/** One shared ticker: every countdown on the page updates on the same second. */
let subscribers = new Set<() => void>();
let timer: number | null = null;

function subscribe(fn: () => void) {
  subscribers.add(fn);
  if (timer === null) {
    timer = window.setInterval(() => {
      // Nothing to do while the tab is hidden — the value is recomputed on show.
      if (document.hidden) return;
      subscribers.forEach((s) => s());
    }, 1000);
  }
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useCountdown(target: Date): Parts {
  const [parts, setParts] = useState(() => partsUntil(target));

  useEffect(() => {
    const update = () => setParts(partsUntil(target));
    update();
    const off = subscribe(update);
    const onShow = () => update();
    document.addEventListener('visibilitychange', onShow);
    return () => {
      off();
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [target.getTime()]);

  return parts;
}

/** Big brass numerals. Tabular figures so the digits never jitter. */
export function Countdown({
  target,
  className,
  compact,
}: {
  target: Date;
  className?: string;
  compact?: boolean;
}) {
  const p = useCountdown(target);
  const past = p.total < 0;

  const cells: [number, string][] = [
    [p.days, p.days === 1 ? 'day' : 'days'],
    [p.hours, 'hrs'],
    [p.minutes, 'min'],
  ];
  if (!compact) cells.push([p.seconds, 'sec']);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className="flex items-end justify-center gap-4 sm:gap-6"
        role="timer"
        aria-live="off"
        aria-label={`${past ? 'Since' : 'Until'} this date: ${p.days} days, ${p.hours} hours, ${p.minutes} minutes`}
      >
        {cells.map(([value, label]) => (
          <div key={label} className="flex flex-col items-center">
            <span className="font-display text-[clamp(1.8rem,5.5vw,3rem)] leading-none tabular-nums">
              {String(value).padStart(2, '0')}
            </span>
            <span className="mt-1.5 text-[0.6rem] uppercase tracking-[0.2em] opacity-45">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* A date in the past is counting up, and must never read as a countdown. */}
      <span className="mt-3 text-[0.62rem] uppercase tracking-[0.22em] opacity-35">
        {past ? 'since it happened' : 'to go'}
      </span>
    </div>
  );
}
