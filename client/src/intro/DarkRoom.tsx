import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { Cat } from '@/components/Cat';
import { INTRO_COPY, INTRO_LINES } from './config';
import { Bloom, makeBloomables } from './Bloomables';

/**
 * A dark room that wakes up wherever the candle goes.
 *
 * There is deliberately nothing to find and nothing to get wrong. Everything is
 * already visible as a dim silhouette; passing the light near it opens it and
 * it stays lit. An earlier version hid six things and made her hunt, which
 * turned a gift into a chore.
 *
 * Once most of the room is awake it all lifts, and the birthday moment follows.
 */

/** How near the candle has to pass, relative to the screen. Generous on
 *  purpose — scaling it keeps a phone from finishing in two swipes. */
const reachFor = (vw: number, vh: number) => Math.max(84, Math.min(vw, vh) * 0.21);
/** Fraction of the room awake before it lifts. */
const THRESHOLD = 0.72;
const COUNT = 46;

export function DarkRoom({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const reduced = useReducedMotion();
  const maskRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => makeBloomables(COUNT), []);
  const [lit, setLit] = useState<Set<number>>(() => new Set());
  const [started, setStarted] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [lifting, setLifting] = useState(false);

  const pointer = useRef({ x: -999, y: -999 });
  const catPos = useRef({ x: 0, y: 0 });
  /** Where the light was last frame, so we can wake along the path. */
  const prev = useRef({ x: -999, y: -999 });
  const litRef = useRef<Set<number>>(new Set());
  litRef.current = lit;

  const progress = lit.size / items.length;
  const lineIndex = Math.min(
    INTRO_LINES.length - 1,
    Math.floor(progress * (INTRO_LINES.length + 0.6))
  );

  /* ── the candle, and everything it wakes ───────────────────── */
  useEffect(() => {
    if (reduced) return;
    let frame = 0;

    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const p = pointer.current;

      // The flame breathes so the light never reads as a torch.
      const flicker = 1 + Math.sin(performance.now() / 190) * 0.05;
      if (maskRef.current) {
        maskRef.current.style.setProperty('--lx', `${p.x}px`);
        maskRef.current.style.setProperty('--ly', `${p.y}px`);
        maskRef.current.style.setProperty('--lr', `${230 * flicker}px`);
      }
      if (flameRef.current) {
        flameRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }

      // The cat trails after the light, a long way behind.
      catPos.current.x += (p.x - 70 - catPos.current.x) * 0.022;
      catPos.current.y += (p.y + 30 - catPos.current.y) * 0.022;
      if (catRef.current) {
        catRef.current.style.transform = `translate3d(${catPos.current.x}px, ${catPos.current.y}px, 0)`;
      }

      // Anything the light passes wakes up — measured against the whole path
      // travelled since the last frame, not just where the pointer landed. A
      // quick swipe would otherwise jump straight over things.
      const woken: number[] = [];
      for (const item of items) {
        if (litRef.current.has(item.id)) continue;
        const sx = (item.x / 100) * vw;
        const sy = (item.y / 100) * vh;
        if (distanceToSegment(sx, sy, prev.current, p) < reachFor(vw, vh)) woken.push(item.id);
      }
      prev.current = { x: p.x, y: p.y };
      if (woken.length) {
        setLit((prev) => {
          const next = new Set(prev);
          woken.forEach((id) => next.add(id));
          return next;
        });
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [items, reduced]);

  /* enough of the room is awake — lift it */
  useEffect(() => {
    if (!lifting && progress >= THRESHOLD) setLifting(true);
  }, [progress, lifting]);

  /*
   * Hand over once the lift has played. This is a separate effect on purpose:
   * combined with the one above, setting `lifting` re-ran the effect and its
   * own cleanup cancelled the timer, so the finale never arrived.
   */
  useEffect(() => {
    if (!lifting) return;
    const t = window.setTimeout(onComplete, 2600);
    return () => clearTimeout(t);
  }, [lifting, onComplete]);

  useEffect(() => {
    const t = window.setTimeout(() => setShowSkip(true), 7000);
    return () => clearTimeout(t);
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    // On touch the light sits above her fingertip, or her hand covers it.
    const lift = e.pointerType === 'touch' ? 52 : 0;
    const next = { x: e.clientX, y: e.clientY - lift };
    if (!started) {
      // Drop the cat and the trail where she first touches, not at 0,0.
      catPos.current = { ...next };
      prev.current = { ...next };
      setStarted(true);
    }
    pointer.current = next;
  };

  /* ── reduced motion: skip the room entirely ────────────────── */
  if (reduced) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[#07060c] px-6 text-center text-[#f0e6d8]">
        {INTRO_LINES.map((l) => (
          <p key={l} className="max-w-md font-hand text-2xl">
            {l}
          </p>
        ))}
        <button onClick={onComplete} className="rounded-full border border-current/30 px-6 py-3 text-sm">
          continue
        </button>
      </div>
    );
  }

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerDown={onPointerMove}
      className="fixed inset-0 z-[100] touch-none overflow-hidden bg-[#07060c]"
      style={{ cursor: 'none' }}
    >
      {/* the room, only visible where light falls */}
      <div className="absolute inset-0">
        <RoomScene />
        <motion.div
          className="absolute inset-0"
          animate={lifting ? { y: '-115%', opacity: 0 } : { y: 0, opacity: 1 }}
          transition={{ duration: 2.4, ease: EASE.soft }}
        >
          {items.map((item) => (
            <Bloom key={item.id} item={item} lit={lit.has(item.id)} />
          ))}
        </motion.div>
      </div>

      {/* the darkness, with a hole cut where the candle is */}
      <motion.div
        ref={maskRef}
        className="pointer-events-none absolute inset-0 bg-[#07060c]"
        animate={{ opacity: lifting ? 0 : 1 }}
        transition={{ duration: 2, ease: EASE.soft }}
        style={
          {
            '--lx': '-999px',
            '--ly': '-999px',
            '--lr': '230px',
            maskImage:
              'radial-gradient(circle var(--lr) at var(--lx) var(--ly), transparent 0%, transparent 40%, rgba(0,0,0,0.72) 70%, #000 100%)',
            WebkitMaskImage:
              'radial-gradient(circle var(--lr) at var(--lx) var(--ly), transparent 0%, transparent 40%, rgba(0,0,0,0.72) 70%, #000 100%)',
          } as React.CSSProperties
        }
      />

      {/* everything already awake stays lit, above the darkness */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={lifting ? { y: '-115%', opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 2.4, ease: EASE.soft }}
      >
        {items
          .filter((i) => lit.has(i.id))
          .map((item) => (
            <Bloom key={item.id} item={item} lit />
          ))}
      </motion.div>

      {/* the cat, trailing after her */}
      <div ref={catRef} className="pointer-events-none absolute left-0 top-0 z-20">
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2"
          animate={{ opacity: started ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 1 }}
        >
          <Cat pose="walk" mood="happy" size={58} />
        </motion.div>
      </div>

      {/* the flame */}
      <div ref={flameRef} className="pointer-events-none absolute left-0 top-0 z-20">
        <Flame />
      </div>

      {/* a line, every so often */}
      <AnimatePresence mode="wait">
        {started && !lifting && progress > 0.12 && (
          <motion.p
            key={lineIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.slow, ease: EASE.soft }}
            className="pointer-events-none absolute inset-x-0 bottom-[11dvh] z-30 px-8 text-center font-hand text-[1.8rem] text-[#f6e7cf]/85"
          >
            {INTRO_LINES[lineIndex]}
          </motion.p>
        )}
      </AnimatePresence>

      {/* the opening hint */}
      <AnimatePresence>
        {!started && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6 }}
            className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 text-center"
          >
            <p className="font-hand text-3xl text-[#e8d6b8]/80">{INTRO_COPY.openingHint}</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 1.6 }}
              className="text-xs uppercase tracking-[0.24em] text-[#e8d6b8]/40"
            >
              {INTRO_COPY.openingNudge}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* how far along, drawn as a thin line rather than a score */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-[#ffb347] to-[#ffe3b0]"
          animate={{ width: `${Math.min(100, (progress / THRESHOLD) * 100)}%` }}
          transition={{ duration: 0.8, ease: EASE.soft }}
        />
      </div>

      {showSkip && !lifting && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onSkip}
          className="absolute right-6 top-6 z-30 text-[0.62rem] uppercase tracking-[0.24em] text-[#e8d6b8]/25 transition-colors hover:text-[#e8d6b8]/70"
        >
          {INTRO_COPY.skip}
        </motion.button>
      )}
    </div>
  );
}

/** Shortest distance from a point to the segment the light just travelled. */
function distanceToSegment(
  px: number,
  py: number,
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - b.x, py - b.y);
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lenSq));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

/* ── the room she is standing in ──────────────────────────────── */

function RoomScene() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div
        className="absolute inset-x-0 top-0 h-[58%]"
        style={{ background: 'linear-gradient(180deg, #17131f 0%, #221a2b 100%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{ background: 'linear-gradient(180deg, #2a2030 0%, #1a141f 100%)' }}
      />
      <div className="absolute inset-x-0 top-[58%] h-px bg-[#3a2d42]" />
      <div
        className="absolute inset-x-0 bottom-0 h-[42%] opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0 118px, rgba(0,0,0,0.5) 118px 120px)',
        }}
      />
      {/* wallpaper: a faint helix, because of course it is */}
      <div
        className="absolute inset-x-0 top-0 h-[58%] opacity-[0.12]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='150'%3E%3Cg fill='none' stroke='%23c9a9ff' stroke-width='2'%3E%3Cpath d='M20 0 C20 38, 70 45, 70 75 C70 105, 20 112, 20 150'/%3E%3Cpath d='M70 0 C70 38, 20 45, 20 75 C20 105, 70 112, 70 150'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: '90px 150px',
        }}
      />
      <div className="grain absolute inset-0 opacity-25" />
    </div>
  );
}

function Flame() {
  return (
    <span className="pointer-events-none relative block -translate-x-1/2 -translate-y-1/2">
      <span
        className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,196,120,0.32), rgba(255,170,90,0.09) 45%, transparent 70%)',
        }}
      />
      <motion.svg
        width="24"
        height="32"
        viewBox="0 0 22 30"
        className="relative"
        animate={{ scaleY: [1, 1.14, 0.95, 1], scaleX: [1, 0.93, 1.05, 1] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '11px 26px' }}
      >
        <path d="M11 2 C 16 10, 19 14, 19 19 a 8 8 0 0 1 -16 0 C 3 14, 6 10, 11 2 Z" fill="#ffb347" />
        <path d="M11 10 C 14 15, 15 17, 15 20 a 4 4 0 0 1 -8 0 C 7 17, 8 15, 11 10 Z" fill="#fff2c4" />
      </motion.svg>
    </span>
  );
}
