import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Tulip } from '@/components/motifs/Tulip';

const PALETTE = [
  { petal: '#e0607f', petalDark: '#b03f5c' },
  { petal: '#f4a9c0', petalDark: '#cf7391' },
  { petal: '#f0b955', petalDark: '#c98a24' },
  { petal: '#e35d4a', petalDark: '#a83426' },
  { petal: '#a99ce0', petalDark: '#7a6db3' },
  { petal: '#f7d9e3', petalDark: '#d9a8bb' },
];

/**
 * A row of tulips along the bottom of the Reasons world. They sway on their own
 * and every one of them opens when a reason is revealed.
 */
export const TulipField = memo(function TulipField({ bloom }: { bloom: boolean }) {
  const reduced = useReducedMotion();

  // Fixed layout, generated once — the garden shouldn't rearrange itself.
  const stems = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const t = i / 14;
        const c = PALETTE[i % PALETTE.length];
        return {
          left: 2 + t * 96 + (i % 3) * 1.2,
          size: 54 + ((i * 37) % 46),
          depth: (i % 3) / 3,
          delay: (i % 7) * 0.13,
          ...c,
        };
      }),
    []
  );

  return (
    <div
      aria-hidden
      // Fixed, not absolute: the page can be taller than the screen, and the
      // garden belongs to the bottom of the *view*, not the bottom of the document.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[38dvh] overflow-hidden"
    >
      {/* warm ground haze so the stems don't just stop in mid-air */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            'linear-gradient(to top, color-mix(in srgb, var(--accent) 16%, transparent), transparent)',
        }}
      />

      {stems.map((s, i) => (
        <motion.div
          key={i}
          // Anchored to the very bottom: each stem's own height lifts its bloom
          // into view, so the garden reads as a row along the page edge.
          className="absolute bottom-0 origin-bottom leading-[0]"
          style={{
            left: `${s.left}%`,
            opacity: 0.35 + s.depth * 0.55,
            filter: s.depth < 0.4 ? 'blur(1.5px)' : undefined,
            zIndex: Math.round(s.depth * 10),
          }}
          initial={reduced ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 0.35 + s.depth * 0.55 }}
          transition={{ duration: 1.1, delay: s.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          <Tulip
            size={s.size}
            bloom={bloom}
            petal={s.petal}
            petalDark={s.petalDark}
            stem="#6f9a63"
            delay={s.delay}
          />
        </motion.div>
      ))}
    </div>
  );
});
