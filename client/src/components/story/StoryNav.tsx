import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { sceneFor } from '@/lib/scenes';
import type { StoryEvent } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { Icon } from '@/components/Icon';

/**
 * Jump between memories without scrolling the whole way. Three affordances that
 * share one index: arrow keys, prev/next buttons, and a dot rail.
 */
export function StoryNav({
  events,
  activeIndex,
  onJump,
}: {
  events: StoryEvent[];
  activeIndex: number;
  onJump: (index: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(activeIndex + delta, 0), events.length - 1);
      if (next !== activeIndex) onJump(next);
    },
    [activeIndex, events.length, onJump]
  );

  // Arrow / j-k keys, but never while she is typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (events.length < 2) return null;

  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= events.length - 1;

  return (
    <>
      {/* ── Dot rail: desktop only, sits on the right edge ── */}
      <nav
        aria-label="Jump to a memory"
        className="pointer-events-auto fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-1 lg:flex"
      >
        {events.map((e, i) => {
          const scene = sceneFor(e.sceneType);
          const active = i === activeIndex;
          return (
            <button
              key={e.id}
              onClick={() => onJump(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`${e.title}, ${formatDate(e.date)}`}
              aria-current={active ? 'true' : undefined}
              className="group relative flex items-center gap-2 py-1.5 pl-3"
            >
              <AnimatePresence>
                {hovered === i && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: DUR.fast, ease: EASE.soft }}
                    className="whitespace-nowrap rounded-full bg-black/55 px-3 py-1 text-xs text-white/90 backdrop-blur-md"
                  >
                    {e.title}
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.span
                animate={{ width: active ? 26 : 12, opacity: active ? 1 : 0.35 }}
                transition={{ duration: DUR.base, ease: EASE.soft }}
                className="block h-[3px] rounded-full"
                style={{ background: active ? scene.accent : 'currentColor' }}
              />
            </button>
          );
        })}
      </nav>

      {/* ── Prev / next, bottom-right; thumb-reachable on a phone ── */}
      <div className="pointer-events-auto fixed bottom-5 right-4 z-30 flex items-center gap-2 sm:bottom-7 sm:right-7">
        <span className="mr-1 hidden text-xs tabular-nums opacity-45 sm:inline">
          {activeIndex + 1} / {events.length}
        </span>
        <ArrowButton label="Previous memory" disabled={atStart} onClick={() => go(-1)} up />
        <ArrowButton label="Next memory" disabled={atEnd} onClick={() => go(1)} />
      </div>
    </>
  );
}

function ArrowButton({
  label,
  onClick,
  disabled,
  up,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  up?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      whileHover={disabled ? undefined : { y: up ? -2 : 2 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-opacity',
        'border-white/20 bg-black/35 text-current',
        disabled ? 'pointer-events-none opacity-20' : 'opacity-70 hover:opacity-100'
      )}
    >
      <Icon name="chevron-down" size={18} className={up ? 'rotate-180' : undefined} />
    </motion.button>
  );
}
