import { memo, useMemo } from 'react';
import type { ParticleKind } from '@/lib/scenes';

/**
 * Particles are plain absolutely-positioned divs driven by CSS keyframes, so
 * the compositor owns them and React never re-renders during scroll. Positions
 * are generated once per (kind, count) and reused.
 */

interface Bit {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
}

function makeBits(count: number, seed: number): Bit[] {
  // Deterministic pseudo-random so a re-mount doesn't reshuffle the sky.
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return Array.from({ length: count }, () => ({
    left: rnd() * 100,
    top: rnd() * 100,
    size: rnd(),
    delay: rnd() * -20,
    duration: 6 + rnd() * 14,
    drift: (rnd() - 0.5) * 2,
    opacity: 0.25 + rnd() * 0.6,
  }));
}

function ParticlesBase({
  kind,
  density,
  accent,
  reduced,
}: {
  kind: ParticleKind;
  density: number;
  accent: string;
  reduced: boolean;
}) {
  // Phones get fewer particles — same feel, far less to composite.
  const count = useMemo(() => {
    if (kind === 'none' || reduced) return 0;
    const narrow = typeof window !== 'undefined' && window.innerWidth < 768;
    return Math.round(density * (narrow ? 0.45 : 1));
  }, [kind, density, reduced]);

  const bits = useMemo(() => makeBits(count, kind.length * 7919 + count), [count, kind]);

  if (!count) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((b, i) => (
        <span key={i} style={styleFor(kind, b, accent)} className={classFor(kind)} />
      ))}
    </div>
  );
}

function classFor(kind: ParticleKind): string {
  switch (kind) {
    case 'rain':
      return 'absolute animate-[fall-fast_linear_infinite]';
    case 'snow':
    case 'petal':
      return 'absolute animate-[fall-slow_linear_infinite]';
    case 'cloud':
      return 'absolute animate-[drift-across_linear_infinite]';
    case 'ember':
      return 'absolute animate-[rise_ease-in-out_infinite]';
    case 'star':
    case 'shimmer':
    case 'bokeh':
      return 'absolute animate-[pulse-soft_ease-in-out_infinite]';
    default:
      return 'absolute animate-[float-soft_ease-in-out_infinite]';
  }
}

function styleFor(kind: ParticleKind, b: Bit, accent: string): React.CSSProperties {
  const base: React.CSSProperties = {
    left: `${b.left}%`,
    top: `${b.top}%`,
    animationDelay: `${b.delay}s`,
    animationDuration: `${b.duration}s`,
    opacity: b.opacity,
    // Hint the compositor without pinning too many layers.
    willChange: 'transform',
  };

  switch (kind) {
    case 'rain':
      return {
        ...base,
        top: '-10%',
        width: '1px',
        height: `${16 + b.size * 26}px`,
        background: `linear-gradient(to bottom, transparent, ${accent})`,
        animationDuration: `${0.7 + b.size * 0.8}s`,
        opacity: 0.18 + b.size * 0.3,
      };
    case 'snow':
      return {
        ...base,
        top: '-6%',
        width: `${2 + b.size * 4}px`,
        height: `${2 + b.size * 4}px`,
        borderRadius: '50%',
        background: '#fff',
        animationDuration: `${8 + b.size * 10}s`,
        filter: 'blur(0.4px)',
      };
    case 'petal':
      return {
        ...base,
        top: '-6%',
        width: `${5 + b.size * 7}px`,
        height: `${4 + b.size * 5}px`,
        borderRadius: '60% 20% 60% 20%',
        background: accent,
        animationDuration: `${9 + b.size * 9}s`,
      };
    case 'cloud':
      return {
        ...base,
        width: `${180 + b.size * 320}px`,
        height: `${50 + b.size * 70}px`,
        borderRadius: '999px',
        background: 'rgba(255,255,255,0.16)',
        filter: 'blur(24px)',
        animationDuration: `${60 + b.size * 70}s`,
      };
    case 'star':
      return {
        ...base,
        width: `${1 + b.size * 2.4}px`,
        height: `${1 + b.size * 2.4}px`,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: `0 0 ${3 + b.size * 6}px rgba(255,255,255,0.8)`,
        animationDuration: `${2.5 + b.size * 4}s`,
      };
    case 'bokeh':
      return {
        ...base,
        width: `${10 + b.size * 34}px`,
        height: `${10 + b.size * 34}px`,
        borderRadius: '50%',
        background: accent,
        filter: 'blur(9px)',
        opacity: 0.12 + b.size * 0.28,
        animationDuration: `${4 + b.size * 6}s`,
      };
    case 'shimmer':
      return {
        ...base,
        width: `${3 + b.size * 8}px`,
        height: '1.5px',
        borderRadius: '999px',
        background: accent,
        animationDuration: `${2 + b.size * 3}s`,
      };
    case 'ember':
      return {
        ...base,
        top: `${70 + b.top * 0.3}%`,
        width: `${2 + b.size * 3}px`,
        height: `${2 + b.size * 3}px`,
        borderRadius: '50%',
        background: accent,
        boxShadow: `0 0 ${4 + b.size * 8}px ${accent}`,
        animationDuration: `${5 + b.size * 7}s`,
      };
    default:
      return {
        ...base,
        width: `${2 + b.size * 4}px`,
        height: `${2 + b.size * 4}px`,
        borderRadius: '50%',
        background: accent,
        filter: 'blur(0.5px)',
      };
  }
}

export const Particles = memo(ParticlesBase);
