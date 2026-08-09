import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type CatPose =
  | 'sit'
  | 'walk'
  | 'peek'
  | 'hold-heart'
  | 'hold-envelope'
  | 'float'
  | 'sleep'
  | 'point';

export type CatMood = 'happy' | 'shy' | 'curious' | 'sleepy';

interface CatProps {
  pose?: CatPose;
  mood?: CatMood;
  /** Rendered width in px. Height follows the 1:1 viewBox. */
  size?: number;
  className?: string;
  /** Fur colour — defaults to a warm cream that suits every world. */
  fur?: string;
  accent?: string;
  /** Little speech line rendered above the cat, in handwriting. */
  says?: string;
}

const EYE_SHAPES: Record<CatMood, { open: string; squint: boolean }> = {
  happy: { open: 'M -3 0 a 3 3 0 0 0 6 0', squint: true },
  shy: { open: 'M -3 0 a 3 3 0 0 0 6 0', squint: true },
  curious: { open: '', squint: false },
  sleepy: { open: 'M -3.5 0 h 7', squint: true },
};

/**
 * One cat, many poses. Body parts live in separate groups so each pose can
 * animate the bits it cares about (tail, ears, arms) without redrawing the cat.
 */
function CatBase({
  pose = 'sit',
  mood = 'happy',
  size = 96,
  className,
  fur = '#f5e3cc',
  accent = 'var(--accent, #c9566b)',
  says,
}: CatProps) {
  const reduced = useReducedMotion();
  const [blinking, setBlinking] = useState(false);

  // Blink on a human-ish irregular rhythm rather than a metronome.
  useEffect(() => {
    if (reduced || mood === 'sleepy') return;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setBlinking(true);
          window.setTimeout(() => setBlinking(false), 130);
          schedule();
        },
        3000 + Math.random() * 4000
      );
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [reduced, mood]);

  const shade = 'rgba(0,0,0,0.10)';
  const eyes = EYE_SHAPES[mood];
  const closed = blinking || mood === 'sleepy';

  const bodyFloat =
    pose === 'float'
      ? { y: [0, -6, 0], rotate: [-2, 2, -2] }
      : pose === 'walk'
        ? { y: [0, -2.5, 0] }
        : { y: [0, -1.5, 0] };

  const tailWag =
    pose === 'sleep'
      ? { rotate: [0, 2, 0] }
      : pose === 'walk'
        ? { rotate: [-8, 10, -8] }
        : { rotate: [-4, 7, -4] };

  return (
    <div className={cn('relative inline-block select-none', className)} style={{ width: size }}>
      {says && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute -top-7 left-1/2 w-max max-w-[180px] -translate-x-1/2 text-center font-hand text-lg leading-tight opacity-80"
        >
          {says}
        </motion.p>
      )}

      <motion.svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label="A small cat"
        animate={reduced ? undefined : bodyFloat}
        transition={{ duration: pose === 'walk' ? 0.6 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ overflow: 'visible' }}
      >
        {/* soft ground shadow — grounds the cat without a box-shadow */}
        {pose !== 'float' && pose !== 'peek' && (
          <ellipse cx="50" cy="88" rx="22" ry="4" fill={shade} />
        )}

        {/* tail */}
        <motion.g
          style={{ originX: '68px', originY: '70px' }}
          animate={reduced ? undefined : tailWag}
          transition={{ duration: pose === 'walk' ? 0.7 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M 66 72 q 18 4 16 -14 q -1 -9 -8 -9"
            fill="none"
            stroke={fur}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </motion.g>

        {/* body */}
        <g>
          {pose === 'sleep' ? (
            <ellipse cx="50" cy="72" rx="26" ry="15" fill={fur} />
          ) : (
            <path d="M 34 86 q -3 -28 16 -28 q 19 0 16 28 z" fill={fur} />
          )}
        </g>

        {/* front paws */}
        {pose !== 'sleep' && (
          <>
            <motion.ellipse
              cx="42"
              cy="85"
              rx="5.5"
              ry="4"
              fill={fur}
              animate={reduced || pose !== 'walk' ? undefined : { x: [0, 3, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.ellipse
              cx="58"
              cy="85"
              rx="5.5"
              ry="4"
              fill={fur}
              animate={reduced || pose !== 'walk' ? undefined : { x: [0, -3, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </>
        )}

        {/* held objects sit behind the head so the cat "hugs" them */}
        {pose === 'hold-heart' && (
          <motion.path
            d="M 50 74 l -7 -7 a 5 5 0 0 1 7 -7 a 5 5 0 0 1 7 7 z"
            fill={accent}
            animate={reduced ? undefined : { scale: [1, 1.12, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '50px', originY: '70px' }}
          />
        )}
        {pose === 'hold-envelope' && (
          <g>
            <rect x="38" y="64" width="24" height="16" rx="2" fill="#fbf3e4" stroke={shade} />
            <path d="M 38 65 l 12 9 l 12 -9" fill="none" stroke={shade} strokeWidth="1.5" />
          </g>
        )}

        {/* head */}
        <motion.g
          style={{ originX: '50px', originY: '46px' }}
          animate={
            reduced
              ? undefined
              : mood === 'curious'
                ? { rotate: [-4, 4, -4] }
                : { rotate: [-1.5, 1.5, -1.5] }
          }
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* ears */}
          <path d="M 33 34 l -2 -13 l 13 6 z" fill={fur} />
          <path d="M 67 34 l 2 -13 l -13 6 z" fill={fur} />
          <path d="M 34.5 32 l -1 -7 l 7 3 z" fill={accent} opacity="0.35" />
          <path d="M 65.5 32 l 1 -7 l -7 3 z" fill={accent} opacity="0.35" />

          {/* face */}
          <ellipse cx="50" cy="44" rx="20" ry="17" fill={fur} />

          {/* eyes */}
          <g transform="translate(42 43)">
            {closed || eyes.squint ? (
              <path
                d={closed ? 'M -3.5 0 a 3.5 3.5 0 0 0 7 0' : eyes.open || 'M -3.5 0 h 7'}
                fill="none"
                stroke="#2b2130"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <ellipse cx="0" cy="0" rx="2.6" ry="3.4" fill="#2b2130" />
            )}
          </g>
          <g transform="translate(58 43)">
            {closed || eyes.squint ? (
              <path
                d={closed ? 'M -3.5 0 a 3.5 3.5 0 0 0 7 0' : eyes.open || 'M -3.5 0 h 7'}
                fill="none"
                stroke="#2b2130"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <ellipse cx="0" cy="0" rx="2.6" ry="3.4" fill="#2b2130" />
            )}
          </g>

          {/* blush */}
          {(mood === 'shy' || mood === 'happy') && (
            <>
              <ellipse cx="37" cy="49" rx="4" ry="2.4" fill={accent} opacity="0.3" />
              <ellipse cx="63" cy="49" rx="4" ry="2.4" fill={accent} opacity="0.3" />
            </>
          )}

          {/* nose + mouth */}
          <path d="M 50 49 l -2.2 -2 h 4.4 z" fill={accent} />
          <path
            d="M 50 49.5 v 2 M 50 51.5 q -3 2.5 -5 0 M 50 51.5 q 3 2.5 5 0"
            fill="none"
            stroke="#2b2130"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* whiskers */}
          <g stroke="#2b2130" strokeWidth="1" strokeLinecap="round" opacity="0.35">
            <path d="M 32 46 h -9 M 32 50 l -8 3" />
            <path d="M 68 46 h 9 M 68 50 l 8 3" />
          </g>
        </motion.g>

        {/* sleeping zzz */}
        {pose === 'sleep' && !reduced && (
          <motion.text
            x="74"
            y="52"
            fontSize="12"
            fill="currentColor"
            opacity="0.5"
            animate={{ y: [52, 42], opacity: [0, 0.6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
          >
            z
          </motion.text>
        )}

        {/* pointing arm */}
        {pose === 'point' && (
          <motion.path
            d="M 68 74 q 10 -2 14 -10"
            fill="none"
            stroke={fur}
            strokeWidth="6"
            strokeLinecap="round"
            animate={reduced ? undefined : { rotate: [0, -6, 0] }}
            style={{ originX: '68px', originY: '74px' }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* space helmet for the universe */}
        {pose === 'float' && (
          <circle
            cx="50"
            cy="46"
            r="26"
            fill="rgba(200,220,255,0.10)"
            stroke="rgba(220,235,255,0.45)"
            strokeWidth="1.2"
          />
        )}
      </motion.svg>
    </div>
  );
}

export const Cat = memo(CatBase);
