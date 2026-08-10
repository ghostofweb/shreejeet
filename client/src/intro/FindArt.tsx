import { motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { mediaUrl } from '@/lib/api';
import { Cat } from '@/components/Cat';
import { Tulip } from '@/components/motifs/Tulip';
import { WaxSeal } from '@/components/letters/WaxSeal';
import type { FindKind, IntroFind } from './config';

/**
 * The six things hidden in the room. Each opens differently so it never becomes
 * six identical taps.
 */
export function FindArt({
  find,
  found,
  near,
  holdProgress,
}: {
  find: IntroFind;
  found: boolean;
  /** The candle is close enough that it should shimmer. */
  near: boolean;
  /** 0–1, only used by the hold-to-open one. */
  holdProgress: number;
}) {
  const shimmer = near && !found;

  return (
    <motion.div
      className="relative"
      animate={
        shimmer
          ? { scale: [1, 1.07, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }
          : { scale: 1 }
      }
      transition={shimmer ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <Art kind={find.kind} find={find} found={found} />

      {/* the ring that fills while she holds the helix down */}
      {holdProgress > 0 && !found && (
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          width="110"
          height="110"
          viewBox="0 0 110 110"
        >
          <circle
            cx="55"
            cy="55"
            r="50"
            fill="none"
            stroke="rgba(255,220,160,0.85)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 50}
            strokeDashoffset={2 * Math.PI * 50 * (1 - holdProgress)}
            transform="rotate(-90 55 55)"
          />
        </svg>
      )}
    </motion.div>
  );
}

function Art({ kind, find, found }: { kind: FindKind; find: IntroFind; found: boolean }) {
  switch (kind) {
    /* a tulip that opens */
    case 'bloom':
      return (
        <Tulip size={92} bloom={found} petal="#e0607f" petalDark="#b03f5c" stem="#6f9a63" />
      );

    /* a sealed letter whose wax cracks */
    case 'seal':
      return (
        <div className="relative">
          <div
            className="h-[4.5rem] w-[7rem] rounded-[4px]"
            style={{ background: 'linear-gradient(160deg,#f2e4cb,#e0cca9)' }}
          />
          <span
            className="absolute inset-x-0 top-0 h-[58%]"
            style={{
              background: 'linear-gradient(180deg,#f7edda,#e9d8b9)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />
          <span className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
            <WaxSeal color="#c9566b" size={38} cracked={found} />
          </span>
        </div>
      );

    /* a fallen star that lifts back up */
    case 'lift':
      return (
        <motion.div
          animate={found ? { y: -120, scale: 0.6 } : { y: 0, scale: 1 }}
          transition={{ duration: 2.2, ease: EASE.soft }}
        >
          <div
            className="h-4 w-4 rounded-full bg-white"
            style={{ boxShadow: '0 0 26px 8px rgba(255,240,200,0.9)' }}
          />
        </motion.div>
      );

    /* a photo lying face-down, flipped over */
    case 'flip':
      return (
        <motion.div
          className="relative h-[8.5rem] w-[7rem]"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: found ? 180 : 0 }}
          transition={{ duration: 0.9, ease: EASE.soft }}
        >
          {/* back of the print */}
          <div
            className="absolute inset-0 rounded-[3px]"
            style={{ background: '#e6dcc8', backfaceVisibility: 'hidden' }}
          />
          {/* the photo */}
          <div
            className="absolute inset-0 rounded-[3px] bg-[#fbf5ea] p-2 pb-6"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {find.photo ? (
              <img
                src={mediaUrl(find.photo)}
                alt=""
                className="h-full w-full rounded-[1px] object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[1px] bg-black/10 px-1 text-center text-[0.5rem] text-black/40">
                add a photo
              </div>
            )}
            {find.caption && (
              <span className="absolute inset-x-2 bottom-1 truncate text-center font-hand text-[0.7rem] text-black/50">
                {find.caption}
              </span>
            )}
          </div>
        </motion.div>
      );

    /* a helix that lights up rung by rung, held rather than tapped */
    case 'hold':
      return (
        <svg width="60" height="110" viewBox="0 0 60 110" fill="none">
          <path
            d="M14 4 C14 30, 46 36, 46 55 C46 74, 14 80, 14 106"
            stroke={found ? '#ffd08a' : '#7d7290'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M46 4 C46 30, 14 36, 14 55 C14 74, 46 80, 46 106"
            stroke={found ? '#ffd08a' : '#7d7290'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {[18, 33, 48, 63, 78, 93].map((y, i) => (
            <motion.line
              key={y}
              x1="16"
              y1={y}
              x2="44"
              y2={y}
              stroke={found ? '#ffe3b0' : '#6b6180'}
              strokeWidth="2"
              initial={false}
              animate={{ opacity: found ? 1 : 0.5 }}
              transition={{ delay: found ? i * 0.09 : 0, duration: 0.3 }}
            />
          ))}
        </svg>
      );

    /* the cat, asleep until the end */
    case 'wake':
      return <Cat pose={found ? 'sit' : 'sleep'} mood={found ? 'happy' : 'sleepy'} size={104} />;
  }
}
