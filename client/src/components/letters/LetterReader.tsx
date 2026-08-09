import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { mediaUrl } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import { usePeople } from '@/lib/people';
import type { OpenWhenLetter } from '@/lib/types';
import { Cat } from '@/components/Cat';
import { Icon } from '@/components/Icon';
import { WaxSeal } from './WaxSeal';

/**
 * Opening a letter, in four beats:
 *   1. the wax seal cracks and falls
 *   2. the flap folds back in 3D
 *   3. the page slides up out of the envelope
 *   4. the page becomes the thing you're reading
 *
 * The page is one element throughout — a shared layoutId morphs it from the
 * slip inside the envelope into the full sheet, so it never re-mounts.
 */

type Stage = 0 | 1 | 2 | 3 | 4;

const BEATS: [Stage, number][] = [
  [1, 400],
  [2, 1000],
  [3, 1650],
  [4, 2400],
];

export function LetterReader({
  letter,
  firstOpen,
  onClose,
}: {
  letter: OpenWhenLetter | null;
  firstOpen: boolean;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>(0);
  const { attributionFor } = usePeople();

  useEffect(() => {
    if (!letter) {
      setStage(0);
      return;
    }
    if (reduced) {
      setStage(4);
      return;
    }
    setStage(0);
    const timers = BEATS.map(([s, ms]) => window.setTimeout(() => setStage(s), ms));
    return () => timers.forEach(clearTimeout);
  }, [letter, reduced]);

  useEffect(() => {
    if (!letter) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [letter, onClose]);

  const reading = stage === 4;

  return createPortal(
    <AnimatePresence>
      {letter && (
        <motion.div
          data-stage={stage}
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.base }}
        >
          {/* candlelight: the room dims as the letter opens */}
          <motion.div
            className="fixed inset-0"
            animate={{
              background: reading
                ? 'radial-gradient(70% 55% at 50% 45%, rgba(60,38,18,0.82), rgba(12,8,5,0.96))'
                : 'radial-gradient(60% 50% at 50% 50%, rgba(40,26,12,0.72), rgba(10,7,4,0.9))',
            }}
            transition={{ duration: 1.1, ease: EASE.soft }}
            onClick={reading ? onClose : undefined}
          />

          {/* ── beats 1–3: the envelope ── */}
          <AnimatePresence>
            {!reading && (
              <motion.div
                key="envelope"
                className="relative z-10"
                style={{ perspective: 1200 }}
                initial={{ opacity: 0, scale: 0.86, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.45 } }}
                transition={{ duration: DUR.slow, ease: EASE.soft }}
              >
                <div className="relative h-[15rem] w-[min(88vw,23rem)] sm:h-[17rem] sm:w-[26rem]">
                  {/* back of the envelope */}
                  <div
                    className="absolute inset-0 rounded-[6px] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]"
                    style={{ background: 'linear-gradient(160deg,#efe0c6,#dcc7a4)' }}
                  />

                  {/* the page, still tucked inside */}
                  <motion.div
                    layoutId="letter-page"
                    className="paper-surface absolute inset-x-5 top-6 h-[70%] rounded-[3px]"
                    animate={{ y: stage >= 3 ? '-58%' : '0%' }}
                    transition={{ duration: 0.85, ease: EASE.soft }}
                  />

                  {/* front pocket, in front of the page */}
                  <div
                    className="absolute inset-x-0 bottom-0 top-[42%] rounded-b-[6px]"
                    style={{
                      background: 'linear-gradient(180deg,#e9d8b9,#e0cca9)',
                      clipPath: 'polygon(0 22%, 50% 0, 100% 22%, 100% 100%, 0 100%)',
                    }}
                  />

                  {/* the flap, hinged at the top */}
                  <motion.div
                    className="absolute inset-x-0 top-0 h-[58%] origin-top"
                    style={{
                      background: 'linear-gradient(180deg,#f2e4cb,#e7d5b6)',
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                    animate={{ rotateX: stage >= 2 ? -168 : 0 }}
                    transition={{ duration: 0.75, ease: EASE.soft }}
                  />

                  {/* the seal, cracking on beat one */}
                  <div className="absolute left-1/2 top-[44%] z-10 -translate-x-1/2 -translate-y-1/2">
                    <WaxSeal color={letter.sealColor} size={54} cracked={stage >= 1} />
                  </div>

                  {/* dust from the wax */}
                  {stage >= 1 && !reduced && (
                    <>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <motion.span
                          key={i}
                          className="absolute left-1/2 top-[44%] h-1 w-1 rounded-full"
                          style={{ background: letter.sealColor }}
                          initial={{ opacity: 0.9, x: 0, y: 0 }}
                          animate={{
                            opacity: 0,
                            x: (i % 2 ? 1 : -1) * (18 + i * 6),
                            y: 26 + i * 4,
                          }}
                          transition={{ duration: 1, ease: 'easeOut', delay: i * 0.02 }}
                        />
                      ))}
                    </>
                  )}
                </div>

                <p className="mt-6 text-center font-hand text-xl text-[#e8d5b8]/70">
                  open when {letter.situation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── beat 4: the page you actually read ── */}
          {reading && (
            <motion.article
              layoutId="letter-page"
              transition={{ duration: 0.9, ease: EASE.soft }}
              className="paper-surface relative z-10 my-auto w-[min(94vw,40rem)] rounded-[4px] px-6 py-10 sm:px-12 sm:py-14"
              style={{ color: '#3a2b1c' }}
            >
              {/* fold creases, as if it had been in an envelope */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 32%, rgba(120,90,50,0.09) 33%, transparent 34%),' +
                    'linear-gradient(180deg, transparent 65%, rgba(120,90,50,0.07) 66%, transparent 67%)',
                }}
              />

              <button
                onClick={onClose}
                aria-label="Fold it back up"
                className="absolute right-4 top-4 rounded-full p-2 text-[#7a6448] opacity-50 transition-opacity hover:opacity-100"
              >
                <Icon name="close" size={17} />
              </button>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.slow, ease: EASE.soft, delay: 0.35 }}
              >
                {firstOpen && (
                  <p className="mb-3 text-[0.66rem] uppercase tracking-[0.22em] text-[#b08948]">
                    the first time you've opened this
                  </p>
                )}

                <h2 className="font-display text-[clamp(1.5rem,4.5vw,2.2rem)] leading-tight">
                  Open when {letter.situation}
                </h2>

                <div className="mt-6 whitespace-pre-line text-pretty text-[1.05rem] leading-[1.75]">
                  {letter.body}
                </div>

                {!!letter.photos?.length && (
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {letter.photos.map((p) => (
                      <img
                        key={p.url}
                        src={mediaUrl(p.url)}
                        alt={p.alt ?? ''}
                        loading="lazy"
                        className="w-full rounded-[3px] border border-black/10 object-cover"
                      />
                    ))}
                  </div>
                )}

                {letter.audio?.url && (
                  <audio
                    controls
                    src={mediaUrl(letter.audio.url)}
                    className="mt-6 w-full"
                    preload="metadata"
                  />
                )}

                <p className="mt-10 text-right font-hand text-2xl opacity-60">
                  {attributionFor(letter.createdBy)}
                </p>
              </motion.div>

              {/* the cat, sat on the corner of the page */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: DUR.slow }}
                className="pointer-events-none absolute -bottom-6 -right-2 sm:-right-6"
              >
                <Cat pose="sit" mood="happy" size={76} />
              </motion.div>
            </motion.article>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
