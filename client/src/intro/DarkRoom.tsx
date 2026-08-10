import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { FINDS, INTRO_COPY, type IntroFind } from './config';
import { FindArt } from './FindArt';

/**
 * A pitch-black room lit only by a candle at her finger.
 *
 * Layering is what makes the effect work:
 *   lower world  — everything still hidden, only visible through the mask
 *   dark overlay — a fixed sheet with a moving hole cut in it
 *   upper world  — whatever she has already found, permanently lit
 *
 * The candle position is written straight to CSS custom properties from a rAF
 * loop, so React never re-renders while she moves.
 */

/**
 * The room is exactly one screen. An earlier version was two screens wide with
 * an edge-scrolling camera; it added a whole class of bugs and, worse, meant
 * she could be hunting in a space she had no way to picture. One screen she can
 * sweep is both simpler and easier to feel your way around.
 */
const ROOM = 1;
/** How close the candle must get before something shimmers. */
const NEAR = 150;
/** How close before a tap counts as touching it. */
const REACH = 78;
/** Silence before the room offers a hint, in ms. */
const IDLE_HINT_MS = 25_000;
const HOLD_MS = 1400;

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function DarkRoom({ onComplete, onSkip }: Props) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<HTMLDivElement>(null);

  const [found, setFound] = useState<string[]>([]);
  const [openLine, setOpenLine] = useState<IntroFind | null>(null);
  const [nearId, setNearId] = useState<string | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [started, setStarted] = useState(false);

  // Everything the render loop needs, kept out of React state.
  const pointer = useRef({ x: 0, y: 0 });
  const lastActivity = useRef(performance.now());
  const foundRef = useRef<string[]>([]);
  foundRef.current = found;

  const remaining = FINDS.filter((f) => !found.includes(f.id));
  const done = remaining.length === 0;

  /* ── the candle, and what is within reach ─────────────────── */
  useEffect(() => {
    if (reduced) return;
    let frame = 0;

    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const p = pointer.current;

      // The flame breathes, so the light never looks like a flashlight.
      const flicker = 1 + Math.sin(performance.now() / 190) * 0.045;
      if (maskRef.current) {
        maskRef.current.style.setProperty('--lx', `${p.x}px`);
        maskRef.current.style.setProperty('--ly', `${p.y}px`);
        maskRef.current.style.setProperty('--lr', `${168 * flicker}px`);
      }
      if (flameRef.current) {
        flameRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }

      // What is within reach right now?
      let closest: { id: string; d: number } | null = null;
      for (const f of FINDS) {
        if (foundRef.current.includes(f.id)) continue;
        const sx = f.x * vw;
        const sy = f.y * vh;
        const d = Math.hypot(sx - p.x, sy - p.y);
        if (!closest || d < closest.d) closest = { id: f.id, d };
      }
      setNearId(closest && closest.d < NEAR ? closest.id : null);

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  /* ── a gentle nudge if she stalls ──────────────────────────── */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (done) return;
      if (performance.now() - lastActivity.current < IDLE_HINT_MS) return;
      const next = FINDS.find((f) => !foundRef.current.includes(f.id));
      if (!next) return;
      setNudgeId(next.id);
      window.setTimeout(() => setNudgeId(null), 2600);
      lastActivity.current = performance.now();
    }, 4000);
    return () => clearInterval(id);
  }, [done]);

  /* the skip only appears once she has had a moment to settle */
  useEffect(() => {
    const t = window.setTimeout(() => setShowSkip(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const open = useCallback((f: IntroFind) => {
    setFound((prev) => (prev.includes(f.id) ? prev : [...prev, f.id]));
    setOpenLine(f);
    lastActivity.current = performance.now();
    window.setTimeout(() => setOpenLine(null), f.photo ? 6000 : 4200);
  }, []);

  /* ── input ─────────────────────────────────────────────────── */
  const onPointerMove = (e: React.PointerEvent) => {
    // Sit the light a little above her fingertip, or her hand covers it.
    const lift = e.pointerType === 'touch' ? 46 : 0;
    pointer.current = { x: e.clientX, y: e.clientY - lift };
    if (!started) setStarted(true);
    lastActivity.current = performance.now();
  };

  const hitTest = (): IntroFind | null => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const p = pointer.current;
    for (const f of FINDS) {
      if (foundRef.current.includes(f.id)) continue;
      const sx = f.x * vw;
      const sy = f.y * vh;
      if (Math.hypot(sx - p.x, sy - p.y) < REACH) return f;
    }
    return null;
  };

  const holdTimer = useRef<number | null>(null);
  const holdDone = useRef<number | null>(null);

  const onPointerDown = () => {
    const hit = hitTest();
    if (!hit) return;
    lastActivity.current = performance.now();

    if (hit.kind === 'hold') {
      const begin = performance.now();
      setHoldId(hit.id);

      // A timer decides when the hold is done; the frame loop only draws the
      // ring. If animation frames stall — a notification, a backgrounded tab —
      // her hold still completes instead of silently never finishing.
      holdDone.current = window.setTimeout(() => {
        cancelHold();
        open(hit);
      }, HOLD_MS);

      const step = () => {
        setHoldProgress(Math.min(1, (performance.now() - begin) / HOLD_MS));
        holdTimer.current = requestAnimationFrame(step);
      };
      holdTimer.current = requestAnimationFrame(step);
      return;
    }
    open(hit);
  };

  const cancelHold = () => {
    if (holdTimer.current) cancelAnimationFrame(holdTimer.current);
    if (holdDone.current) clearTimeout(holdDone.current);
    holdTimer.current = null;
    holdDone.current = null;
    setHoldId(null);
    setHoldProgress(0);
  };

  /* ── reduced motion: no room, just the words ───────────────── */
  if (reduced) {
    return (
      <div className="min-h-dvh bg-[#07060c] px-6 py-24 text-[#f0e6d8]">
        <div className="mx-auto max-w-md space-y-8">
          {FINDS.map((f) => (
            <p key={f.id} className="font-hand text-2xl leading-relaxed">
              {f.line}
            </p>
          ))}
          <button
            onClick={onComplete}
            className="mt-8 rounded-full border border-current/30 px-6 py-3 text-sm"
          >
            continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      className="fixed inset-0 z-[100] touch-none overflow-hidden bg-[#07060c]"
      style={{ cursor: 'none' }}
    >
      {/* ── lower world: still hidden ── */}
      <World>
        <RoomScene />
        {remaining.map((f) => (
          <Placed key={f.id} find={f}>
            <FindArt
              find={f}
              found={false}
              near={nearId === f.id || nudgeId === f.id}
              holdProgress={holdId === f.id ? holdProgress : 0}
            />
          </Placed>
        ))}
      </World>

      {/* ── the darkness, with a hole where the candle is ── */}
      <div
        ref={maskRef}
        className="pointer-events-none absolute inset-0 bg-[#07060c]"
        style={
          {
            '--lx': '50%',
            '--ly': '50%',
            '--lr': '168px',
            maskImage:
              'radial-gradient(circle var(--lr) at var(--lx) var(--ly), transparent 0%, transparent 42%, rgba(0,0,0,0.75) 72%, #000 100%)',
            WebkitMaskImage:
              'radial-gradient(circle var(--lr) at var(--lx) var(--ly), transparent 0%, transparent 42%, rgba(0,0,0,0.75) 72%, #000 100%)',
          } as React.CSSProperties
        }
      />

      {/* ── upper world: everything she has found stays lit ── */}
      <World>
        {FINDS.filter((f) => found.includes(f.id)).map((f) => (
          <Placed key={f.id} find={f}>
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,206,140,0.34), rgba(255,190,120,0.10) 45%, transparent 70%)',
              }}
            />
            <FindArt find={f} found near={false} holdProgress={0} />
          </Placed>
        ))}
      </World>

      {/* ── the candle flame itself ── */}
      <div ref={flameRef} className="pointer-events-none absolute left-0 top-0 z-20">
        <Flame />
      </div>

      {/* ── the line she just uncovered ── */}
      <AnimatePresence>
        {openLine && (
          <motion.div
            key={openLine.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: DUR.slow, ease: EASE.soft }}
            className="pointer-events-none absolute inset-x-0 bottom-[12dvh] z-30 flex flex-col items-center gap-4 px-8 text-center"
          >
            {openLine.photo && (
              <img
                src={openLine.photo}
                alt=""
                className="max-h-[26dvh] rounded-[3px] border-4 border-[#fbf5ea] object-cover shadow-2xl"
              />
            )}
            <p className="max-w-md text-balance font-hand text-[1.7rem] leading-snug text-[#f6e7cf]">
              {openLine.line}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── the opening hint, until she moves ── */}
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
              transition={{ delay: 2.4, duration: 1.6 }}
              className="text-xs uppercase tracking-[0.24em] text-[#e8d6b8]/40"
            >
              {INTRO_COPY.openingNudge}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── progress, and the way out ── */}
      <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex items-center justify-between px-6">
        <span className="text-[0.62rem] uppercase tracking-[0.24em] text-[#e8d6b8]/35">
          {found.length} of {FINDS.length} {INTRO_COPY.progressLabel}
        </span>
        {showSkip && !done && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onSkip}
            className="pointer-events-auto text-[0.62rem] uppercase tracking-[0.24em] text-[#e8d6b8]/25 transition-colors hover:text-[#e8d6b8]/70"
          >
            {INTRO_COPY.skip}
          </motion.button>
        )}
      </div>

      {/* ── the door, once everything is found ── */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 1.2 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/40 backdrop-blur-[2px]"
          >
            <motion.button
              onClick={onComplete}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: EASE.soft, delay: 1.6 }}
              className="group relative flex h-[15rem] w-[9rem] items-center justify-center rounded-t-[4.5rem] border border-[#ffd08a]/40"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,208,138,0.16), rgba(255,208,138,0.04))',
                boxShadow: '0 0 90px -10px rgba(255,208,138,0.6)',
              }}
              aria-label={INTRO_COPY.doorPrompt}
            >
              <motion.span
                className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-[#ffe3b0]"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.button>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4, duration: 1.2 }}
              className="font-hand text-2xl text-[#f6e7cf]/80"
            >
              {INTRO_COPY.doorPrompt}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────── */

/** One screen's worth of room. */
function World({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute left-0 top-0"
      style={{ width: `${ROOM * 100}vw`, height: `${ROOM * 100}dvh` }}
    >
      {children}
    </div>
  );
}

function Placed({ find, children }: { find: IntroFind; children: React.ReactNode }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${find.x * 100}%`, top: `${find.y * 100}%` }}
    >
      {children}
    </div>
  );
}

/**
 * The room she is actually in. Without this the light has nothing to fall on
 * and the darkness reads as an empty screen rather than a place — so sweeping
 * the candle around feels like progress even between finds.
 */
function RoomScene() {
  return (
    <div aria-hidden className="absolute inset-0">
      {/* wall, then floor */}
      <div
        className="absolute inset-x-0 top-0 h-[62%]"
        style={{ background: 'linear-gradient(180deg, #17131f 0%, #221a2b 100%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[38%]"
        style={{ background: 'linear-gradient(180deg, #2a2030 0%, #1a141f 100%)' }}
      />
      {/* the line where they meet */}
      <div className="absolute inset-x-0 top-[62%] h-px bg-[#3a2d42]" />

      {/* floorboards, running away from the viewer */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38%] opacity-45"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0 118px, rgba(0,0,0,0.5) 118px 120px)',
        }}
      />
      {/* wallpaper: a faint helix, because of course it is */}
      <div
        className="absolute inset-x-0 top-0 h-[62%] opacity-[0.13]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='150'%3E%3Cg fill='none' stroke='%23c9a9ff' stroke-width='2'%3E%3Cpath d='M20 0 C20 38, 70 45, 70 75 C70 105, 20 112, 20 150'/%3E%3Cpath d='M70 0 C70 38, 20 45, 20 75 C20 105, 70 112, 70 150'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: '90px 150px',
        }}
      />
      <div className="grain absolute inset-0 opacity-30" />
    </div>
  );
}

/** A small flame with a warm halo, sat at her fingertip. */
function Flame() {
  return (
    <span className="pointer-events-none relative block -translate-x-1/2 -translate-y-1/2">
      <span
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,196,120,0.30), rgba(255,170,90,0.08) 45%, transparent 70%)',
        }}
      />
      <motion.svg
        width="22"
        height="30"
        viewBox="0 0 22 30"
        className="relative"
        animate={{ scaleY: [1, 1.12, 0.96, 1], scaleX: [1, 0.94, 1.04, 1] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '11px 26px' }}
      >
        <path d="M11 2 C 16 10, 19 14, 19 19 a 8 8 0 0 1 -16 0 C 3 14, 6 10, 11 2 Z" fill="#ffb347" />
        <path d="M11 10 C 14 15, 15 17, 15 20 a 4 4 0 0 1 -8 0 C 7 17, 8 15, 11 10 Z" fill="#fff2c4" />
      </motion.svg>
    </span>
  );
}
