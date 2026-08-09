import { memo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { sceneFor } from '@/lib/scenes';
import type { SceneType } from '@/lib/types';
import { Particles } from './Particles';

/**
 * A fixed layer behind the whole timeline. Only the active scene is mounted
 * (plus the one fading out), so we never composite ten gradients at once.
 */
export const SceneBackground = memo(function SceneBackground({
  scene,
}: {
  scene: SceneType;
}) {
  const s = sceneFor(scene);
  const reduced = useReducedMotion() ?? false;

  return (
    // z-0, never negative: a negative z-index would fall behind the body's own
    // background and the whole scene would wash out.
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={scene}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0" style={{ background: s.background }} />
          {s.glow && <div className="absolute inset-0" style={{ background: s.glow }} />}
          <Particles kind={s.particle} density={s.density} accent={s.accent} reduced={reduced} />
        </motion.div>
      </AnimatePresence>

      {/* a permanent vignette keeps text legible over every scene */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </div>
  );
});
