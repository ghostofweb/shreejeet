import { motion } from 'framer-motion';
import { Cat, type CatPose } from '@/components/Cat';
import { Icon, type IconName } from '@/components/Icon';
import { revealUp, stagger } from '@/lib/motion';

/**
 * A world that exists but isn't furnished yet. Deliberately styled rather than
 * a bare "coming soon" — the section already reads as part of the same place.
 */
export function ComingSoon({
  icon,
  title,
  blurb,
  pose = 'sit',
}: {
  icon: IconName;
  title: string;
  blurb: string;
  pose?: CatPose;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-breathe"
        style={{
          background:
            'radial-gradient(100% 70% at 50% 100%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 65%)',
        }}
      />

      <motion.div
        variants={stagger(0.12)}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div variants={revealUp} className="opacity-60">
          <Icon name={icon} size={40} />
        </motion.div>
        <motion.h1 variants={revealUp} className="mt-5 font-display text-5xl sm:text-6xl">
          {title}
        </motion.h1>
        <motion.p variants={revealUp} className="mt-4 max-w-md text-balance opacity-55">
          {blurb}
        </motion.p>
        <motion.div variants={revealUp} className="mt-10">
          <Cat pose={pose} mood="curious" size={120} says="still building this bit…" />
        </motion.div>
      </motion.div>
    </div>
  );
}

export const OpenWhenPage = () => (
  <ComingSoon
    icon="envelope"
    title="Open When…"
    blurb="Letters waiting for the moment you need them. Sealed until then."
    pose="hold-envelope"
  />
);

export const ConfessionsPage = () => (
  <ComingSoon
    icon="confessions"
    title="Confessions"
    blurb="Things one of us never quite said out loud."
    pose="peek"
  />
);

export const DatesPage = () => (
  <ComingSoon
    icon="dates"
    title="Important Dates"
    blurb="Everything worth counting down to, and everything worth counting from."
    pose="point"
  />
);
