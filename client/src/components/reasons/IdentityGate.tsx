import { motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { usePeople } from '@/lib/people';
import type { Role } from '@/lib/types';
import { Cat } from '@/components/Cat';
import { Tulip } from '@/components/motifs/Tulip';

/**
 * "Who are you?" — asked once, remembered after. Two large, tactile choices
 * rather than a dropdown, because this is the doorway into the section.
 */
export function IdentityGate({ onChoose }: { onChoose: (r: Role) => void }) {
  const { nameOf } = usePeople();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: DUR.scene, ease: EASE.soft }}
        className="relative z-10 flex flex-col items-center"
      >
        <Cat pose="hold-heart" mood="curious" size={104} />

        <h1 className="mt-4 font-display text-[clamp(2.4rem,8vw,4rem)] leading-[1.05]">
          Who's this?
        </h1>
        <p className="mt-3 max-w-xs text-balance opacity-55">
          So we know whose reasons to show you.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Choice
            name={nameOf('her')}
            role="her"
            petal="#e0607f"
            petalDark="#b03f5c"
            onChoose={onChoose}
            delay={0.15}
          />
          <Choice
            name={nameOf('me')}
            role="me"
            petal="#a99ce0"
            petalDark="#7a6db3"
            onChoose={onChoose}
            delay={0.25}
          />
        </div>
      </motion.div>
    </div>
  );
}

function Choice({
  name,
  role,
  petal,
  petalDark,
  onChoose,
  delay,
}: {
  name: string;
  role: Role;
  petal: string;
  petalDark: string;
  onChoose: (r: Role) => void;
  delay: number;
}) {
  return (
    <motion.button
      onClick={() => onChoose(role)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, ease: EASE.soft, delay }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex w-[min(80vw,15rem)] flex-col items-center gap-1 overflow-hidden rounded-[2rem] border border-current/15 bg-white/45 px-8 py-7 backdrop-blur-sm transition-colors duration-300 hover:border-current/35"
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(120% 90% at 50% 120%, ${petal}44, transparent 70%)` }}
      />
      <span className="relative -mt-2">
        <Tulip size={62} bloom petal={petal} petalDark={petalDark} stem="#6f9a63" sway={false} />
      </span>
      <span className="relative font-display text-2xl">{name}</span>
      <span className="relative text-xs uppercase tracking-[0.18em] opacity-40">it's me</span>
    </motion.button>
  );
}
