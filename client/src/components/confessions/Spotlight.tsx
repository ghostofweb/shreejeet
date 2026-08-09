import { useEffect, useRef } from 'react';

/**
 * A soft light that follows the pointer around a dark room.
 *
 * The position is written straight to CSS custom properties from a rAF loop —
 * React never re-renders on pointer move, so this stays free even with a lot
 * of notes on screen.
 */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Start in the middle so the room is lit before she moves anything.
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.4;
    let x = tx;
    let y = ty;
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const tick = () => {
      // Trailing, not tracking — the light has weight.
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      el.style.setProperty('--sx', `${x}px`);
      el.style.setProperty('--sy', `${y}px`);
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={
        {
          '--sx': '50vw',
          '--sy': '40vh',
          background:
            'radial-gradient(560px circle at var(--sx) var(--sy), rgba(155,139,212,0.16), transparent 65%),' +
            'radial-gradient(1100px circle at var(--sx) var(--sy), rgba(120,110,170,0.07), transparent 70%)',
        } as React.CSSProperties
      }
    />
  );
}
