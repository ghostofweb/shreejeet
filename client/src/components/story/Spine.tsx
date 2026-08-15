import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { sceneFor } from '@/lib/scenes';
import { spineSlope, spineX, type SpineGeo } from '@/lib/spine';
import type { StoryEvent } from '@/lib/types';
import { Cat } from '@/components/Cat';
import { Icon } from '@/components/Icon';
import { HelixSpine } from '@/components/motifs/HelixSpine';

const CAT = 46;

/**
 * Everything that lives on the spine, in one layer: the helix itself, the
 * benzene node marking each memory, and the cat walking down it.
 *
 * The nodes used to be drawn inside each memory, pinned to a fixed 50%. Now
 * that the spine wanders they have to follow it, and the only place that knows
 * where the spine is at a given depth is here — so they moved out of the
 * memory and onto the spine, which is where they always belonged.
 */
export function Spine({
  geo,
  nodeTs,
  events,
  progress,
  accent,
}: {
  geo: SpineGeo;
  /** Each memory's position down the track, 0→1. */
  nodeTs: number[];
  events: StoryEvent[];
  /** Springy scroll progress, 0→1 across the track. */
  progress: MotionValue<number>;
  /** The current scene's accent — the helix takes on the colour of the sky. */
  accent: string;
}) {
  const reveal = useTransform(progress, (t) => `inset(0 0 ${((1 - t) * 100).toFixed(2)}% 0)`);

  /*
   * The cat's position is derived from `progress`, but `progress` doesn't move
   * when the *track* changes size — so on a resize (or when a late image pushes
   * the page taller) these are nudged by hand, or the cat would sit on where
   * the spine used to be.
   */
  const catX = useMotionValue(0);
  const catY = useMotionValue(0);
  const catTilt = useMotionValue(0);

  useEffect(() => {
    const place = (t: number) => {
      catX.set(spineX(t, geo) - CAT / 2);
      catY.set(t * geo.h - CAT / 2);
      // Lean into the bend, but never so far it reads as falling over.
      const lean = Math.atan(spineSlope(t, geo)) * (180 / Math.PI);
      catTilt.set(Math.max(-16, Math.min(16, lean * 2.4)));
    };
    place(progress.get());
    return progress.on('change', place);
  }, [geo, progress, catX, catY, catTilt]);

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <HelixSpine geo={geo} reveal={reveal} accent={accent} />
      </div>

      {/* one node per memory, sitting wherever the spine happens to be */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[6]">
        {nodeTs.map((t, i) => (
          <SpineNode
            key={events[i]?.id ?? i}
            accent={sceneFor(events[i]?.sceneType).accent}
            left={spineX(t, geo)}
            top={t * geo.h}
          />
        ))}
      </div>

      {/* the cat, walking the route rather than falling down a line */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-[7]"
        style={{ x: catX, y: catY, rotate: catTilt, willChange: 'transform' }}
      >
        <Cat pose="walk" mood="curious" size={CAT} />
      </motion.div>
    </>
  );
}

/** A benzene ring on the spine marks each memory. */
function SpineNode({ accent, left, top }: { accent: string; left: number; top: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -60 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true, margin: '-90px' }}
      transition={{ duration: 0.7, ease: EASE.bounce }}
      className="absolute flex h-11 w-11 items-center justify-center rounded-full"
      style={{
        left,
        top,
        marginLeft: -22,
        marginTop: -22,
        background: 'rgba(10,6,14,0.72)',
        border: `1px solid ${accent}66`,
        // No backdrop-filter here on purpose: one per memory meant the browser
        // re-blurred the scene behind every node on every scrolled frame.
        boxShadow: `0 0 26px -4px ${accent}, inset 0 0 12px -6px ${accent}`,
      }}
    >
      <span style={{ color: accent }}>
        <Icon name="benzene" size={22} strokeWidth={1.7} />
      </span>
    </motion.div>
  );
}
