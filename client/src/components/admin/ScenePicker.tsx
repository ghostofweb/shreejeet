import { motion } from 'framer-motion';
import { SCENES } from '@/lib/scenes';
import type { SceneType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/Icon';

const BLURB: Record<SceneType, string> = {
  sunrise: 'warm beginnings',
  blossom: 'soft and sweet',
  sky: 'travel, distance',
  night: 'late hours',
  rain: 'the heavy ones',
  snow: 'quiet and still',
  city: 'out together',
  beach: 'sun and salt',
  glow: 'a milestone',
  cozy: 'home',
};

/**
 * Scene choice as swatches rather than a dropdown — you pick the mood by
 * looking at it, which is the only way this decision makes sense.
 */
export function ScenePicker({
  value,
  onChange,
}: {
  value: SceneType;
  onChange: (v: SceneType) => void;
}) {
  const entries = Object.entries(SCENES) as [SceneType, (typeof SCENES)[SceneType]][];

  return (
    <div className="space-y-2">
      <span className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] opacity-55">
        Scene — the sky behind this memory
      </span>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {entries.map(([key, scene]) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={active}
              className={cn(
                'group relative h-[4.6rem] overflow-hidden rounded-xl border-2 text-left transition-all duration-200',
                active
                  ? 'border-[var(--accent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_25%,transparent)]'
                  : 'border-transparent hover:border-white/35'
              )}
            >
              <span className="absolute inset-0" style={{ background: scene.background }} />
              {scene.glow && <span className="absolute inset-0" style={{ background: scene.glow }} />}

              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5">
                <span
                  className="block text-[0.7rem] font-semibold leading-tight"
                  style={{ color: scene.accent }}
                >
                  {scene.label}
                </span>
                <span className="block truncate text-[0.58rem] leading-tight text-white/55">
                  {BLURB[key]}
                </span>
              </span>

              {active && (
                <motion.span
                  layoutId="scene-check"
                  className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[color:var(--bg)]"
                >
                  <Icon name="check" size={11} strokeWidth={2.5} />
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
