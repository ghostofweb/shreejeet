import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { Cat } from '@/components/Cat';
import { WISH } from './config';

/**
 * The cake.
 *
 * The room has lifted and she is holding nothing. A cake rises out of the dark
 * with its candles already lit, and the only thing asked of her is the one
 * thing she would do anyway on her birthday: put them out.
 *
 * She presses and holds. The dark closes in around her finger, the flames
 * gutter, and at the end they go out one after another — then a beat of
 * complete black and silence before the birthday moment lands. The pause is
 * the whole trick; without it the finale is just another fade.
 */

const HOLD_MS = 2400;
/** Flames go out left to right, not all at once. */
const OUT_STAGGER = 110;
/** How long the screen stays completely black before handing over. */
const BLACKOUT_MS = 1150;

type Phase = 'rising' | 'waiting' | 'holding' | 'out' | 'black';

export function Wish({ onComplete }: { onComplete: () => void }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('rising');
  const [press, setPress] = useState({ x: 0.5, y: 0.55 });
  const holdTimer = useRef<number | null>(null);
  const candles = Math.max(3, Math.min(9, WISH.candles));

  /* the cake finishes arriving, then she can touch it */
  useEffect(() => {
    const t = window.setTimeout(() => setPhase('waiting'), reduced ? 200 : 2000);
    return () => clearTimeout(t);
  }, [reduced]);

  /* blown out → black → hand over */
  useEffect(() => {
    if (phase !== 'out') return;
    const t = window.setTimeout(() => setPhase('black'), candles * OUT_STAGGER + 900);
    return () => clearTimeout(t);
  }, [phase, candles]);

  useEffect(() => {
    if (phase !== 'black') return;
    const t = window.setTimeout(onComplete, reduced ? 200 : BLACKOUT_MS);
    return () => clearTimeout(t);
  }, [phase, onComplete, reduced]);

  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);

  const startHold = (e: React.PointerEvent) => {
    if (phase !== 'waiting') return;
    setPress({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    setPhase('holding');
    // A timer, not a frame loop: a stalled rAF would leave her holding forever.
    holdTimer.current = window.setTimeout(() => setPhase('out'), HOLD_MS);
  };

  const endHold = () => {
    if (phase !== 'holding') return;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setPhase('waiting');
  };

  const holding = phase === 'holding';
  const blownOut = phase === 'out' || phase === 'black';

  if (reduced) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[#0b0812] px-6 text-center">
        <Cake candles={candles} blownOut={blownOut} reduced />
        <p className="font-hand text-3xl text-[#f6e7cf]">{WISH.prompt}</p>
        <button
          onClick={() => setPhase('out')}
          className="rounded-full border border-[#e8d6b8]/30 px-7 py-3 text-sm text-[#e8d6b8]/80"
        >
          blow them out
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] touch-none select-none overflow-hidden bg-[#0b0812]"
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onPointerLeave={endHold}
    >
      {/* what little warmth the candles throw */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        animate={{ opacity: blownOut ? 0 : holding ? 0.5 : 1 }}
        transition={{ duration: blownOut ? 0.7 : 1.6, ease: EASE.soft }}
        style={{
          background:
            'radial-gradient(48% 40% at 50% 52%, rgba(255,186,110,0.24), transparent 70%),' +
            'radial-gradient(90% 60% at 50% 118%, rgba(180,86,120,0.20), transparent 72%)',
        }}
      />

      {/* the dark drawing in around her finger while she holds */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#07060c]"
        animate={{
          opacity: holding ? 1 : 0,
          // Framer animates the custom property; the mask reads it every frame.
          '--wr': holding ? '340px' : '2200px',
        }}
        transition={{
          opacity: { duration: 0.5, ease: EASE.soft },
          '--wr': { duration: holding ? HOLD_MS / 1000 : 0.6, ease: 'linear' },
        }}
        style={
          {
            '--wr': '2200px',
            maskImage: `radial-gradient(circle var(--wr) at ${press.x * 100}% ${press.y * 100}%, transparent 0%, transparent 55%, #000 100%)`,
            WebkitMaskImage: `radial-gradient(circle var(--wr) at ${press.x * 100}% ${press.y * 100}%, transparent 0%, transparent 55%, #000 100%)`,
          } as React.CSSProperties
        }
      />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-10 px-6">
        <motion.div
          initial={{ y: 200, opacity: 0, scale: 0.86 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: EASE.soft, delay: 0.2 }}
        >
          <Cake candles={candles} blownOut={blownOut} holding={holding} reduced={false} />
        </motion.div>

        <AnimatePresence mode="wait">
          {!blownOut && (
            <motion.div
              key={holding ? 'holding' : 'waiting'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.8, ease: EASE.soft, delay: holding ? 0 : 1.4 }}
              className="pointer-events-none flex flex-col items-center gap-3 text-center"
            >
              <p className="font-hand text-[clamp(1.9rem,6vw,3rem)] text-[#f6e7cf]">
                {holding ? WISH.holding : WISH.prompt}
              </p>
              {!holding && (
                <motion.span
                  animate={{ opacity: [0.3, 0.75, 0.3] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-[0.62rem] uppercase tracking-[0.26em] text-[#e8d6b8]"
                >
                  {WISH.hint}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* the cat, waiting for her to get on with it */}
      <motion.div
        className="pointer-events-none absolute bottom-[6dvh] right-[8vw] z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: blownOut ? 0 : 1, y: 0 }}
        transition={{ duration: 1.2, ease: EASE.soft, delay: blownOut ? 0 : 2.4 }}
      >
        <Cat pose="sit" mood="curious" size={72} />
      </motion.div>

      {/* the ring that fills under her finger */}
      <AnimatePresence>
        {holding && (
          <motion.svg
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${press.x * 100}%`, top: `${press.y * 100}%` }}
            width="112"
            height="112"
            viewBox="0 0 112 112"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <circle cx="56" cy="56" r="46" fill="none" stroke="rgba(255,225,180,0.16)" strokeWidth="3" />
            <motion.circle
              cx="56"
              cy="56"
              r="46"
              fill="none"
              stroke="#ffce8c"
              strokeWidth="3"
              strokeLinecap="round"
              transform="rotate(-90 56 56)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: HOLD_MS / 1000, ease: 'linear' }}
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,206,140,0.8))' }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* the silence */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'black' ? 1 : 0 }}
        transition={{ duration: 0.9, ease: EASE.soft }}
      />
    </div>
  );
}

/* ── the cake itself ──────────────────────────────────────────── */

function Cake({
  candles,
  blownOut,
  holding = false,
  reduced,
}: {
  candles: number;
  blownOut: boolean;
  holding?: boolean;
  reduced: boolean;
}) {
  const W = 260;
  const spread = 150;
  const spots = Array.from({ length: candles }, (_, i) =>
    candles === 1 ? W / 2 : W / 2 - spread / 2 + (spread / (candles - 1)) * i
  );

  return (
    <svg width={W} height="230" viewBox="0 0 260 230" className="overflow-visible">
      <defs>
        <linearGradient id="tierTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7dfe6" />
          <stop offset="100%" stopColor="#e2b6c6" />
        </linearGradient>
        <linearGradient id="tierBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2d3c2" />
          <stop offset="100%" stopColor="#d9ab97" />
        </linearGradient>
      </defs>

      {spots.map((x, i) => (
        <CandleOnCake
          key={i}
          x={x}
          y={108}
          out={blownOut}
          holding={holding}
          reduced={reduced}
          delay={i * (OUT_STAGGER / 1000)}
        />
      ))}

      {/* top tier */}
      <rect x="62" y="118" width="136" height="44" rx="7" fill="url(#tierTop)" />
      <path
        d="M62 128 q 11 14 22 0 q 11 14 22 0 q 11 14 22 0 q 11 14 22 0 q 11 14 22 0 q 11 14 22 0 L198 118 L62 118 Z"
        fill="#fdf1f3"
      />

      {/* bottom tier */}
      <rect x="30" y="162" width="200" height="52" rx="8" fill="url(#tierBottom)" />
      <path
        d="M30 172 q 12 15 25 0 q 12 15 25 0 q 12 15 25 0 q 12 15 25 0 q 12 15 25 0 q 12 15 25 0 q 12 15 25 0 q 12 15 25 0 L230 162 L30 162 Z"
        fill="#fbeade"
      />

      {/* a tulip on the side of the cake, because of course */}
      <g transform="translate(130 190)">
        <path d="M0 8 C 0 2, 0 -2, 0 -8" stroke="#6f9a63" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M-7 -8 q 7 -12 14 0 q -7 6 -14 0 Z" fill="#e0607f" />
      </g>

      {/* the plate */}
      <ellipse cx="130" cy="216" rx="118" ry="10" fill="#3a2f45" />
      <ellipse cx="130" cy="214" rx="118" ry="9" fill="#4b3d59" />
    </svg>
  );
}

function CandleOnCake({
  x,
  y,
  out,
  holding,
  reduced,
  delay,
}: {
  x: number;
  y: number;
  out: boolean;
  holding: boolean;
  reduced: boolean;
  delay: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* the candle */}
      <rect x="-3.5" y="0" width="7" height="22" rx="2" fill="#f6e6cf" />
      <rect x="-3.5" y="0" width="3.5" height="22" fill="#e8748f" opacity="0.55" />
      {/* the wick */}
      <path d="M0 0 v-4" stroke="#4a3a2c" strokeWidth="1.6" strokeLinecap="round" />

      <AnimatePresence>
        {!out && (
          <motion.g
            exit={{ opacity: 0, scale: 0, y: 4 }}
            transition={{ duration: 0.34, ease: EASE.swift, delay }}
          >
            <circle cx="0" cy="-12" r="26" fill="rgba(255,196,120,0.16)" />
            <motion.g
              animate={
                reduced
                  ? undefined
                  : holding
                    // guttering: bent over and struggling
                    ? { scaleY: [1, 0.62, 0.86, 0.5, 0.78], skewX: [0, 14, -8, 18, -4] }
                    : { scaleY: [1, 1.16, 0.94, 1], scaleX: [1, 0.92, 1.06, 1] }
              }
              transition={{
                duration: holding ? 0.42 : 0.7,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: '0px -4px' }}
            >
              <path d="M0 -20 C 4 -13, 6.5 -9, 6.5 -5 a 6.5 6.5 0 0 1 -13 0 C -6.5 -9, -4 -13, 0 -20 Z" fill="#ffb347" />
              <path d="M0 -13 C 2.4 -8.6, 3.2 -6.6, 3.2 -4.4 a 3.2 3.2 0 0 1 -6.4 0 C -3.2 -6.6, -2.4 -8.6, 0 -13 Z" fill="#fff2c4" />
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>

      {/* the smoke, once it is out */}
      {out && !reduced && (
        <motion.path
          d="M0 -6 c 4 -8, -4 -12, 0 -20 c 4 -8, -3 -12, 0 -18"
          stroke="rgba(226,214,236,0.55)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ opacity: 0, pathLength: 0, y: 0 }}
          animate={{ opacity: [0, 0.7, 0], pathLength: 1, y: -18 }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: delay + 0.2 }}
        />
      )}
    </g>
  );
}
