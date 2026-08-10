import { memo } from 'react';
import { motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { Tulip } from '@/components/motifs/Tulip';

export type BloomKind = 'tulip' | 'star' | 'firefly' | 'sprig';

export interface Bloomable {
  id: number;
  x: number;
  y: number;
  kind: BloomKind;
  size: number;
  hue: number;
  sway: number;
}

const PETALS = [
  { petal: '#e0607f', dark: '#b03f5c' },
  { petal: '#f4a9c0', dark: '#cf7391' },
  { petal: '#f0b955', dark: '#c98a24' },
  { petal: '#a99ce0', dark: '#7a6db3' },
  { petal: '#f7d9e3', dark: '#d9a8bb' },
];

/**
 * One thing in the room that wakes when the candle passes it.
 *
 * Asleep it is a dim silhouette — visible enough that she knows where to go, so
 * this is never a hunt. Awake it opens, glows, and stays lit.
 */
export const Bloom = memo(function Bloom({ item, lit }: { item: Bloomable; lit: boolean }) {
  const colours = PETALS[item.hue % PETALS.length];

  return (
    <motion.div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${item.x}%`, top: `${item.y}%` }}
      initial={false}
      animate={{ opacity: lit ? 1 : 0.16, scale: lit ? 1 : 0.72 }}
      transition={{ duration: 0.9, ease: EASE.soft }}
    >
      {/* the warm pool of light it gives off once awake */}
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: item.size * 5,
          height: item.size * 5,
          background:
            'radial-gradient(circle, rgba(255,206,140,0.30), rgba(255,190,120,0.08) 45%, transparent 70%)',
        }}
        initial={false}
        animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.4 }}
        transition={{ duration: 1.1, ease: EASE.soft }}
      />

      <Art kind={item.kind} lit={lit} size={item.size} colours={colours} sway={item.sway} />
    </motion.div>
  );
});

function Art({
  kind,
  lit,
  size,
  colours,
  sway,
}: {
  kind: BloomKind;
  lit: boolean;
  size: number;
  colours: { petal: string; dark: string };
  sway: number;
}) {
  switch (kind) {
    case 'tulip':
      return (
        <Tulip
          size={size}
          bloom={lit}
          petal={colours.petal}
          petalDark={colours.dark}
          stem="#6f9a63"
          delay={sway}
        />
      );

    /* a star that lifts off the floor and hangs */
    case 'star':
      return (
        <motion.div
          animate={lit ? { y: -70 - size, rotate: 180 } : { y: 0, rotate: 0 }}
          transition={{ duration: 2.4, ease: EASE.soft, delay: sway * 0.3 }}
        >
          <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24">
            <path
              d="M12 2 L14.6 9.2 L22 12 L14.6 14.8 L12 22 L9.4 14.8 L2 12 L9.4 9.2 Z"
              fill={lit ? '#fff4d6' : '#6a6280'}
              style={lit ? { filter: 'drop-shadow(0 0 10px rgba(255,235,180,0.9))' } : undefined}
            />
          </svg>
        </motion.div>
      );

    /* a firefly that drifts once it is awake */
    case 'firefly':
      return (
        <motion.div
          animate={
            lit
              ? { y: [0, -26, 4, -18, 0], x: [0, 16, -10, 12, 0], opacity: [1, 0.55, 1, 0.7, 1] }
              : { y: 0, x: 0 }
          }
          transition={
            lit
              ? { duration: 7 + sway * 3, repeat: Infinity, ease: 'easeInOut', delay: sway }
              : undefined
          }
        >
          <span
            className="block rounded-full"
            style={{
              width: size * 0.16,
              height: size * 0.16,
              background: lit ? '#ffe9a8' : '#4a4460',
              boxShadow: lit ? '0 0 14px 4px rgba(255,225,150,0.85)' : 'none',
            }}
          />
        </motion.div>
      );

    /* a small sprig that unfurls */
    case 'sprig':
      return (
        <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 40 40" fill="none">
          <path
            d="M20 38 C 20 26, 20 18, 20 6"
            stroke={lit ? '#7bbd8e' : '#4a4a55'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {[10, 17, 24].map((y, i) => (
            <motion.g key={y} initial={false} animate={{ opacity: lit ? 1 : 0.5 }}>
              <motion.path
                d={`M20 ${y} C 12 ${y - 3}, 8 ${y + 2}, 6 ${y + 6}`}
                stroke={lit ? '#8fd0a2' : '#4a4a55'}
                strokeWidth="2"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: lit ? 1 : 0.35 }}
                transition={{ duration: 0.7, delay: lit ? i * 0.12 : 0, ease: EASE.soft }}
              />
              <motion.path
                d={`M20 ${y} C 28 ${y - 3}, 32 ${y + 2}, 34 ${y + 6}`}
                stroke={lit ? '#8fd0a2' : '#4a4a55'}
                strokeWidth="2"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: lit ? 1 : 0.35 }}
                transition={{ duration: 0.7, delay: lit ? i * 0.12 + 0.05 : 0, ease: EASE.soft }}
              />
            </motion.g>
          ))}
        </svg>
      );
  }
}

/** A field of things to wake, laid out once and never reshuffled. */
export function makeBloomables(count: number, seed = 20260810): Bloomable[] {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const kinds: BloomKind[] = ['tulip', 'star', 'firefly', 'sprig'];

  return Array.from({ length: count }, (_, id) => {
    const r = rnd();
    // Tulips and sprigs belong on the ground; stars and fireflies in the air.
    const kind = kinds[Math.floor(rnd() * kinds.length)];
    const grounded = kind === 'tulip' || kind === 'sprig';
    return {
      id,
      x: 4 + r * 92,
      y: grounded ? 55 + rnd() * 40 : 8 + rnd() * 50,
      kind,
      size: grounded ? 54 + rnd() * 46 : 40 + rnd() * 40,
      hue: Math.floor(rnd() * PETALS.length),
      sway: rnd(),
    };
  });
}
