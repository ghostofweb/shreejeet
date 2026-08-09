import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { mediaUrl } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import { usePeople } from '@/lib/people';
import type { Confession } from '@/lib/types';
import { cn, formatDate, seededRandom } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { Cat } from '@/components/Cat';

/** How long a hold-to-reveal confession must be held, in ms. */
const HOLD_MS = 1500;

/**
 * A folded note. The words are physically there but out of focus until she
 * asks for them — blur-to-focus is the whole gesture of this section.
 */
export function ConfessionNote({
  confession,
  revealed,
  onReveal,
  index,
}: {
  confession: Confession;
  revealed: boolean;
  onReveal: () => void;
  index: number;
}) {
  const reduced = useReducedMotion();
  const { attributionFor } = usePeople();
  const [held, setHeld] = useState(0);
  const holdRef = useRef<{ start: number; frame: number } | null>(null);

  const locked = !!confession.locked;
  const needsHold = confession.lockRule === 'hold' && !revealed && !locked;
  const tilt = (seededRandom(confession.id) - 0.5) * 3.2;

  /* hold-to-reveal */
  const startHold = () => {
    if (!needsHold) return;
    const begin = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - begin) / HOLD_MS);
      setHeld(p);
      if (p >= 1) {
        holdRef.current = null;
        setHeld(0);
        onReveal();
        return;
      }
      holdRef.current = { start: begin, frame: requestAnimationFrame(step) };
    };
    holdRef.current = { start: begin, frame: requestAnimationFrame(step) };
  };

  const cancelHold = () => {
    if (holdRef.current) cancelAnimationFrame(holdRef.current.frame);
    holdRef.current = null;
    setHeld(0);
  };

  useEffect(() => cancelHold, []);

  const handleClick = () => {
    if (locked || revealed || needsHold) return;
    onReveal();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: DUR.slow, ease: EASE.soft, delay: (index % 5) * 0.06 }}
      style={{ rotate: tilt }}
      className="relative mb-6 break-inside-avoid"
    >
      {/* the cat, hiding behind the note until it is read */}
      <AnimatePresence>
        {!revealed && !locked && (
          <motion.div
            aria-hidden
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 22, opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE.soft }}
            className="pointer-events-none absolute -top-7 left-6 z-0 h-8 overflow-hidden"
          >
            <Cat pose="peek" mood="curious" size={62} />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleClick}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        disabled={locked || revealed}
        aria-label={
          locked
            ? 'Locked confession'
            : revealed
              ? confession.prompt
              : `Reveal: ${confession.prompt}`
        }
        className={cn(
          'relative z-10 block w-full overflow-hidden rounded-[4px] px-6 py-7 text-left',
          'paper-surface transition-shadow duration-500',
          !revealed && !locked && 'cursor-pointer hover:shadow-[0_0_50px_-12px_rgba(155,139,212,0.55)]',
          locked && 'cursor-not-allowed opacity-45'
        )}
        style={{ color: '#2c2233' }}
      >
        {/* the fold seam — this is a note that was folded shut */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px"
          style={{ background: 'rgba(60,40,80,0.10)' }}
        />

        <p className="mb-3 text-[0.64rem] uppercase tracking-[0.22em] text-[#7a5f96]">
          {confession.prompt}
        </p>

        {locked ? (
          <p className="flex items-center gap-2 font-hand text-xl opacity-70">
            <Icon name="lock" size={15} />
            {confession.unlockAt ? `not until ${formatDate(confession.unlockAt)}` : 'not yet'}
          </p>
        ) : (
          <>
            <motion.p
              initial={false}
              animate={{
                filter: revealed ? 'blur(0px)' : 'blur(7px)',
                opacity: revealed ? 1 : 0.42,
              }}
              transition={{ duration: reduced ? 0 : 1.1, ease: EASE.soft }}
              className="select-none font-hand text-[1.55rem] leading-[1.5]"
              // Unrevealed text is decorative noise; don't read it out.
              aria-hidden={!revealed}
            >
              {confession.text ?? ' '}
            </motion.p>

            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.slow, delay: 0.35 }}
                >
                  {confession.photo?.url && (
                    <img
                      src={mediaUrl(confession.photo.url)}
                      alt={confession.photo.alt ?? ''}
                      loading="lazy"
                      className="mt-5 w-full rounded-[3px] border border-black/10 object-cover"
                    />
                  )}
                  <p className="mt-5 text-xs uppercase tracking-[0.16em] opacity-40">
                    {attributionFor(confession.createdBy)}
                    {confession.date && ` · ${formatDate(confession.date)}`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!revealed && (
              <p className="mt-4 flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-[#7a5f96]/70">
                <Icon name={needsHold ? 'lock' : 'sparkle'} size={11} />
                {needsHold ? 'hold to read' : 'tap to read'}
              </p>
            )}
          </>
        )}

        {/* the ring that fills while she holds it down */}
        {needsHold && held > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[4px]"
            style={{
              background: `conic-gradient(rgba(155,139,212,0.35) ${held * 360}deg, transparent 0deg)`,
              maskImage: 'linear-gradient(#000,#000)',
              opacity: 0.9,
            }}
          />
        )}
      </button>
    </motion.article>
  );
}
