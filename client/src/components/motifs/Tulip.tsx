import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * An illustrated tulip, drawn rather than iconified — used as the signature
 * flourish across the site. `bloom` animates it open from a closed bud, which
 * is how a revealed reason arrives.
 */
export const Tulip = memo(function Tulip({
  size = 120,
  className,
  bloom = false,
  petal = '#e0607f',
  petalDark = '#b84a66',
  stem = '#5f8a5a',
  delay = 0,
  sway = true,
}: {
  size?: number;
  className?: string;
  bloom?: boolean;
  petal?: string;
  petalDark?: string;
  stem?: string;
  delay?: number;
  sway?: boolean;
}) {
  const reduced = useReducedMotion();
  const animate = bloom ? 'open' : 'closed';

  return (
    <motion.svg
      viewBox="0 0 100 140"
      width={size}
      height={(size * 140) / 100}
      className={cn('overflow-visible', className)}
      initial={false}
      animate={reduced || !sway ? undefined : { rotate: [-1.6, 1.6, -1.6] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ transformOrigin: '50px 140px' }}
      aria-hidden
    >
      {/* stem */}
      <motion.path
        d="M50 66 C 50 88, 50 104, 50 136"
        fill="none"
        stroke={stem}
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: EASE.soft, delay }}
      />

      {/* leaves */}
      <motion.path
        d="M50 104 C 34 104, 24 94, 22 76 C 40 76, 50 88, 50 104 Z"
        fill={stem}
        opacity="0.85"
        initial={{ scale: 0, originX: '50px', originY: '104px' }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: EASE.soft, delay: delay + 0.25 }}
      />
      <motion.path
        d="M50 94 C 66 94, 76 84, 78 66 C 60 66, 50 78, 50 94 Z"
        fill={stem}
        opacity="0.7"
        initial={{ scale: 0, originX: '50px', originY: '94px' }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: EASE.soft, delay: delay + 0.4 }}
      />

      {/* bloom — three petals that spread apart when it opens */}
      <motion.g
        variants={{
          closed: { scale: 0.9 },
          open: { scale: 1 },
        }}
        animate={animate}
        transition={{ duration: 0.9, ease: EASE.soft, delay }}
        style={{ transformOrigin: '50px 62px' }}
      >
        {/* back petal (left) */}
        <motion.path
          d="M50 66 C 36 66, 30 54, 30 40 C 30 28, 38 20, 50 18 Z"
          fill={petalDark}
          variants={{
            closed: { rotate: 0, x: 0 },
            open: { rotate: -9, x: -3 },
          }}
          transition={{ duration: 0.9, ease: EASE.soft, delay }}
          style={{ transformOrigin: '50px 66px' }}
        />
        {/* back petal (right) */}
        <motion.path
          d="M50 66 C 64 66, 70 54, 70 40 C 70 28, 62 20, 50 18 Z"
          fill={petalDark}
          variants={{
            closed: { rotate: 0, x: 0 },
            open: { rotate: 9, x: 3 },
          }}
          transition={{ duration: 0.9, ease: EASE.soft, delay }}
          style={{ transformOrigin: '50px 66px' }}
        />
        {/* front petal */}
        <motion.path
          d="M50 66 C 40 66, 36 54, 36 41 C 36 28, 42 18, 50 14 C 58 18, 64 28, 64 41 C 64 54, 60 66, 50 66 Z"
          fill={petal}
          variants={{
            closed: { scaleX: 1 },
            open: { scaleX: 0.94 },
          }}
          transition={{ duration: 0.9, ease: EASE.soft, delay }}
          style={{ transformOrigin: '50px 66px' }}
        />
        {/* highlight so the bloom reads as rounded, not flat */}
        <path
          d="M46 24 C 43 32, 42 44, 44 58"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </motion.g>
    </motion.svg>
  );
});
