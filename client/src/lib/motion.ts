import type { Transition, Variants } from 'framer-motion';

export const EASE = {
  soft: [0.16, 1, 0.3, 1],
  swift: [0.4, 0, 0.2, 1],
  bounce: [0.34, 1.56, 0.64, 1],
} as const;

export const DUR = {
  fast: 0.25,
  base: 0.5,
  slow: 0.9,
  scene: 1.4,
} as const;

export const softSpring: Transition = { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 };

/** The house reveal: things arrive from slightly below, slightly out of focus. */
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 34, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: DUR.slow, ease: EASE.soft },
  },
};

export const stagger = (gap = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE.soft } },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE.swift } },
};

/** Page-to-page transition used by the route shell. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.soft } },
  exit: { opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE.swift } },
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
