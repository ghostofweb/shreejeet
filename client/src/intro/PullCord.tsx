import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { INTRO_COPY } from './config';

/**
 * The way in.
 *
 * The site opens pitch black with one cord hanging from the ceiling. Nobody
 * needs to be told what a hanging cord does, which is the entire reason it is
 * here: the first thing she touches has to be something she already knows.
 *
 * Pulling it doesn't turn the lights on — it hands her a candle, and that
 * candle is what she takes into the dark room next.
 */

/** How far she has to pull before it catches. */
const THRESHOLD = 64;
/** A tug that doesn't reach the threshold still counts on the second go, so
 *  someone who taps rather than drags can never get stuck. */
const TUGS_TO_FORGIVE = 2;

export function PullCord({ onComplete }: { onComplete: () => void }) {
  const reduced = useReducedMotion();
  const [lit, setLit] = useState(false);
  const tugs = useRef(0);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startX = useRef(0);

  const rawY = useMotionValue(0);
  const rawX = useMotionValue(0);
  // Springs so it recoils rather than snapping — the cord has weight.
  const pullY = useSpring(rawY, { stiffness: 210, damping: 16, mass: 0.7 });
  const pullX = useSpring(rawX, { stiffness: 190, damping: 13, mass: 0.7 });

  /** Rest length of the cord, in viewport terms. */
  const REST = 210;

  const d = useTransform([pullX, pullY], ([x, y]: number[]) => {
    const endY = REST + y;
    const endX = 60 + x;
    // Bows away from the pull, like a real cord under tension.
    const ctrlX = 60 + x * 0.35;
    const ctrlY = endY * 0.52;
    return `M60 0 Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
  });
  const beadY = useTransform(pullY, (y) => REST + y);
  const beadX = useTransform(pullX, (x) => 60 + x);

  const succeed = () => {
    if (lit) return;
    setLit(true);
    rawX.set(0);
    rawY.set(0);
  };

  /* the flame catching, then the handover */
  useEffect(() => {
    if (!lit) return;
    const t = window.setTimeout(onComplete, reduced ? 400 : 2200);
    return () => clearTimeout(t);
  }, [lit, onComplete, reduced]);

  /*
   * The whole screen is the handle, not just the bead. A cord you have to hit
   * within 30px is a dead end on a phone — this way any downward drag anywhere
   * pulls it, and any tap at all counts as a tug.
   */
  const onDown = (e: React.PointerEvent) => {
    if (lit) return;
    dragging.current = true;
    startY.current = e.clientY;
    startX.current = e.clientX;
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || lit) return;
    // Down only, and with diminishing returns so it feels like it's stretching.
    const dy = Math.max(0, e.clientY - startY.current);
    rawY.set(Math.min(190, dy * 0.85));
    rawX.set(Math.max(-46, Math.min(46, (e.clientX - startX.current) * 0.5)));
  };

  const onUp = () => {
    if (!dragging.current || lit) return;
    dragging.current = false;
    const pulled = rawY.get();
    rawY.set(0);
    rawX.set(0);
    if (pulled >= THRESHOLD) {
      succeed();
      return;
    }
    tugs.current += 1;
    if (tugs.current >= TUGS_TO_FORGIVE) window.setTimeout(succeed, 260);
  };

  /* reduced motion: no drag puzzle, just a button */
  if (reduced) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#07060c] px-6 text-center">
        <p className="font-hand text-2xl text-[#e8d6b8]/80">{INTRO_COPY.cordHint}</p>
        <button
          onClick={onComplete}
          className="rounded-full border border-[#e8d6b8]/30 px-7 py-3 text-sm text-[#e8d6b8]/80"
        >
          light it
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] cursor-grab touch-none select-none overflow-hidden bg-[#07060c] active:cursor-grabbing"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* the room, hinted at once there is light to see it by */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: lit ? 1 : 0 }}
        transition={{ duration: 1.8, ease: EASE.soft }}
        style={{
          background:
            'radial-gradient(46% 40% at 50% 34%, rgba(255,186,110,0.20), transparent 70%)',
        }}
      />

      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <svg width="120" height="440" viewBox="0 0 120 440" className="overflow-visible">
          {/* the fitting it hangs from */}
          <rect x="50" y="-6" width="20" height="10" rx="3" fill="#2a2333" />
          <motion.path
            d={d}
            stroke="#6b5f4a"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* the bead — and the generous, invisible thing she is actually grabbing */}
          <motion.g style={{ x: beadX, y: beadY }}>
            <motion.circle
              r="9"
              fill="#c9a06a"
              animate={
                lit
                  ? { r: 0, opacity: 0 }
                  : { y: [0, 2.5, 0] }
              }
              transition={
                lit
                  ? { duration: 0.5, ease: EASE.swift }
                  : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
              }
              style={{ filter: 'drop-shadow(0 0 6px rgba(201,160,106,0.45))' }}
            />
            {/* the flame it becomes */}
            <AnimatePresence>
              {lit && (
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.9, ease: EASE.bounce, delay: 0.15 }}
                >
                  <circle r="70" fill="url(#cordGlow)" />
                  <motion.g
                    animate={{ scaleY: [1, 1.16, 0.94, 1], scaleX: [1, 0.92, 1.06, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ transformOrigin: '0px 14px' }}
                  >
                    <path
                      d="M0 -16 C 5 -8, 8 -4, 8 1 a 8 8 0 0 1 -16 0 C -8 -4, -5 -8, 0 -16 Z"
                      fill="#ffb347"
                    />
                    <path
                      d="M0 -8 C 3 -3, 4 -1, 4 2 a 4 4 0 0 1 -8 0 C -4 -1, -3 -3, 0 -8 Z"
                      fill="#fff2c4"
                    />
                  </motion.g>
                </motion.g>
              )}
            </AnimatePresence>
          </motion.g>
          <defs>
            <radialGradient id="cordGlow">
              <stop offset="0%" stopColor="rgba(255,196,120,0.34)" />
              <stop offset="45%" stopColor="rgba(255,170,90,0.10)" />
              <stop offset="100%" stopColor="rgba(255,170,90,0)" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* the only instruction in the whole intro, and even it is a hint */}
      <AnimatePresence>
        {!lit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 2, delay: 1.2 }}
            className="pointer-events-none absolute inset-x-0 bottom-[16dvh] flex flex-col items-center gap-3 px-8 text-center"
          >
            <p className="font-hand text-2xl text-[#e8d6b8]/70">{INTRO_COPY.cordHint}</p>
            <motion.span
              animate={{ y: [0, 7, 0], opacity: [0.25, 0.6, 0.25] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-[0.62rem] uppercase tracking-[0.26em] text-[#e8d6b8]"
            >
              pull it down
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
