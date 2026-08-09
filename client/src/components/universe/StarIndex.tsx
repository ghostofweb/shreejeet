import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { starMeta } from '@/lib/starTypes';
import type { UniverseStar } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { Icon } from '@/components/Icon';

/**
 * A canvas can't be reached with a keyboard, so every star also lives in this
 * list. It doubles as a way to find one you remember without hunting the sky.
 */
export function StarIndex({
  stars,
  discovered,
  onSelect,
}: {
  stars: UniverseStar[];
  discovered: Set<string>;
  onSelect: (s: UniverseStar) => void;
}) {
  const [open, setOpen] = useState(false);

  const listed = stars.filter((s) => !s.isSecret || discovered.has(s.id));
  if (!listed.length) return null;

  return (
    <div className="absolute bottom-14 left-4 z-20 sm:bottom-16 sm:left-6">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-md transition-colors',
          open
            ? 'border-white/30 bg-white/10'
            : 'border-white/12 bg-black/45 opacity-70 hover:opacity-100'
        )}
      >
        <Icon name={open ? 'close' : 'search'} size={14} />
        {open ? 'close' : 'all stars'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: DUR.base, ease: EASE.soft }}
            className="mt-2 max-h-[46dvh] w-[min(80vw,19rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/12 bg-black/70 p-1.5 backdrop-blur-xl"
          >
            {listed.map((s) => {
              const meta = starMeta(s.type);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      onSelect(s);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/10"
                  >
                    <span style={{ color: s.locked ? '#8b90b5' : meta.color }}>
                      <Icon name={s.locked ? 'lock' : meta.icon} size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {s.locked ? 'Locked for now' : s.title}
                      </span>
                      {s.date && !s.locked && (
                        <span className="block text-[0.68rem] opacity-40">
                          {formatDate(s.date)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
