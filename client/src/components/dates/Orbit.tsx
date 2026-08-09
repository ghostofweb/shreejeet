import { motion, useReducedMotion } from 'framer-motion';
import { nextOccurrenceOf, wholeDaysBetween } from '@/lib/dates';
import type { IconName } from '@/components/Icon';
import { Icon } from '@/components/Icon';
import type { ImportantDate } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * The dates arranged on a slow ring. The whole ring turns; each marker turns
 * back the same amount so the labels stay upright.
 */
export function Orbit({
  dates,
  nextUp,
  onSelect,
}: {
  dates: ImportantDate[];
  nextUp?: ImportantDate;
  onSelect: (d: ImportantDate) => void;
}) {
  const reduced = useReducedMotion();
  const now = new Date();
  const SPIN = 90; // seconds per revolution

  return (
    <div className="pointer-events-none relative mx-auto aspect-square w-[min(92vw,34rem)]">
      {/* the ring itself */}
      <div className="absolute inset-[12%] rounded-full border border-current/10" />
      <div className="absolute inset-[22%] rounded-full border border-current/[0.06]" />

      <motion.div
        className="absolute inset-0"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: SPIN, repeat: Infinity, ease: 'linear' }}
      >
        {dates.map((d, i) => {
          const angle = (i / Math.max(dates.length, 1)) * Math.PI * 2 - Math.PI / 2;
          const r = 44; // % from centre
          const left = 50 + Math.cos(angle) * r;
          const top = 50 + Math.sin(angle) * r;
          const isNext = d.id === nextUp?.id;
          const days = wholeDaysBetween(now, nextOccurrenceOf(d, now));

          return (
            <div
              key={d.id}
              className="absolute"
              style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%,-50%)' }}
            >
              {/* counter-rotate so the marker never appears upside down */}
              <motion.div
                animate={reduced ? undefined : { rotate: -360 }}
                transition={{ duration: SPIN, repeat: Infinity, ease: 'linear' }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(d)}
                  className={cn(
                    'pointer-events-auto flex flex-col items-center gap-1.5 rounded-2xl px-2 py-1.5',
                    'transition-transform duration-300 hover:scale-110'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-500',
                      isNext
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                        : 'border-current/15 bg-black/25 opacity-60'
                    )}
                    style={
                      isNext
                        ? { boxShadow: '0 0 30px -6px var(--accent)' }
                        : undefined
                    }
                  >
                    <Icon name={(d.icon as IconName) ?? 'heart'} size={18} />
                  </span>
                  <span className="max-w-[6.5rem] truncate text-[0.66rem] opacity-70">
                    {d.title}
                  </span>
                  <span className="text-[0.6rem] tabular-nums opacity-40">
                    {days === 0 ? 'today' : days > 0 ? `in ${days}d` : `${-days}d ago`}
                  </span>
                </button>
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
