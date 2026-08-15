import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { INTRO_NOTES } from './config';

/**
 * Three envelopes lying about the dark room.
 *
 * They are not hidden and they are not required — she can finish the room
 * without touching one. That is the point: nothing is asked of her, so finding
 * one reads as a secret rather than a task completed.
 *
 * They sit clear of the middle of the screen, where the note itself appears.
 */
export const NOTE_SPOTS = [
  { x: 13, y: 30 },
  { x: 87, y: 62 },
  { x: 44, y: 79 },
] as const;

export function IntroEnvelope({ open, x, y }: { open: boolean; x: number; y: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={false}
      animate={{ opacity: open ? 1 : 0.2, scale: open ? 1.08 : 0.9 }}
      transition={{ duration: 0.8, ease: EASE.soft }}
    >
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,206,140,0.34), rgba(255,190,120,0.08) 45%, transparent 70%)',
        }}
        initial={false}
        animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.4 }}
        transition={{ duration: 1.1, ease: EASE.soft }}
      />
      <svg width="62" height="44" viewBox="0 0 62 44" className="relative overflow-visible">
        <rect
          x="1"
          y="1"
          width="60"
          height="42"
          rx="3"
          fill={open ? '#f3e4cb' : '#3a3346'}
          stroke={open ? '#d8bd97' : '#4b4258'}
          strokeWidth="1.5"
        />
        {/* the pocket */}
        <path
          d="M1 43 L31 24 L61 43"
          fill="none"
          stroke={open ? '#d8bd97' : '#4b4258'}
          strokeWidth="1.5"
        />
        {/* the flap, which falls open backwards */}
        <motion.path
          d="M1 1 L31 22 L61 1"
          fill={open ? '#e9d6b8' : '#453d54'}
          stroke={open ? '#d8bd97' : '#4b4258'}
          strokeWidth="1.5"
          initial={false}
          animate={{ rotateX: open ? -168 : 0 }}
          transition={{ duration: 0.7, ease: EASE.soft }}
          style={{ transformOrigin: '31px 1px', transformStyle: 'preserve-3d' }}
        />
        {/* the seal, while it is still sealed */}
        {!open && <circle cx="31" cy="20" r="5" fill="#7a4a58" />}
      </svg>
    </motion.div>
  );
}

/** The line itself, held on screen long enough to actually be read. */
export function NoteOverlay({ index }: { index: number | null }) {
  return (
    <AnimatePresence mode="wait">
      {index !== null && INTRO_NOTES[index] && (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)', transition: { duration: 0.9 } }}
          transition={{ duration: 1.2, ease: EASE.soft }}
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-10"
        >
          <p
            className="max-w-2xl text-balance text-center font-hand text-[clamp(1.9rem,5.5vw,3.2rem)] leading-snug text-[#fdf0da]"
            style={{ textShadow: '0 0 38px rgba(255,190,120,0.55)' }}
          >
            {INTRO_NOTES[index]}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
