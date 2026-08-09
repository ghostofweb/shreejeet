import { motion } from 'framer-motion';
import { EASE } from '@/lib/motion';

/**
 * A wax seal that can break in half. The two halves are separate paths so they
 * can rotate apart and fall — the first beat of opening a letter.
 */
export function WaxSeal({
  color = '#c9566b',
  size = 56,
  cracked = false,
  glint = false,
}: {
  color?: string;
  size?: number;
  cracked?: boolean;
  glint?: boolean;
}) {
  const half = (side: 'l' | 'r') => ({
    initial: { x: 0, rotate: 0, y: 0, opacity: 1 },
    animate: cracked
      ? {
          x: side === 'l' ? -26 : 26,
          rotate: side === 'l' ? -38 : 38,
          y: 30,
          opacity: 0,
        }
      : { x: 0, rotate: 0, y: 0, opacity: 1 },
  });

  return (
    <span
      className="pointer-events-none relative inline-block"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="wax-shade" cx="38%" cy="32%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* left half */}
        <motion.g
          variants={half('l')}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.75, ease: EASE.soft }}
        >
          <path
            d="M32 4 C 18 4, 4 16, 4 32 C 4 48, 18 60, 32 60 Z"
            fill={color}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1"
          />
        </motion.g>

        {/* right half */}
        <motion.g
          variants={half('r')}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.75, ease: EASE.soft }}
        >
          <path
            d="M32 4 C 46 4, 60 16, 60 32 C 60 48, 46 60, 32 60 Z"
            fill={color}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1"
          />
        </motion.g>

        {/* pressed detail — a tiny helix, stamped into the wax */}
        <motion.g
          animate={{ opacity: cracked ? 0 : 0.55 }}
          transition={{ duration: 0.3 }}
          stroke="rgba(0,0,0,0.45)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M24 18 C 24 27, 40 30, 40 32 C 40 34, 24 37, 24 46" />
          <path d="M40 18 C 40 27, 24 30, 24 32 C 24 34, 40 37, 40 46" />
        </motion.g>

        <circle cx="32" cy="32" r="28" fill="url(#wax-shade)" opacity={cracked ? 0 : 1} />
      </svg>

      {/* a slow glint travelling across the wax on hover */}
      {glint && !cracked && (
        <motion.span
          className="absolute inset-0 overflow-hidden rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            className="absolute -inset-y-2 w-6 -skew-x-12 bg-white/35 blur-[3px]"
            initial={{ left: '-30%' }}
            animate={{ left: '130%' }}
            transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.4 }}
          />
        </motion.span>
      )}
    </span>
  );
}
