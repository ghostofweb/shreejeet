import { useState } from 'react';
import { motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import type { OpenWhenLetter } from '@/lib/types';
import { cn, formatDate, seededRandom } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { WaxSeal } from './WaxSeal';

/**
 * A closed envelope on the table. Scattered rather than gridded, and it lifts
 * and glints when she reaches for it.
 */
export function Envelope({
  letter,
  onOpen,
  index,
}: {
  letter: OpenWhenLetter;
  onOpen: () => void;
  index: number;
}) {
  const [hover, setHover] = useState(false);
  const locked = !!letter.locked;
  const opened = !!letter.openedByMe;

  // A stable, slightly untidy angle per letter.
  const tilt = (seededRandom(letter.id) - 0.5) * 7;

  return (
    <motion.button
      type="button"
      onClick={locked ? undefined : onOpen}
      disabled={locked}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: DUR.slow, ease: EASE.soft, delay: (index % 6) * 0.07 }}
      whileHover={locked ? undefined : { y: -10, scale: 1.02 }}
      whileTap={locked ? undefined : { scale: 0.985 }}
      aria-label={locked ? `Locked letter` : `Open when ${letter.situation}`}
      className={cn(
        'group relative block w-full text-left',
        locked ? 'cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      {/* Only the envelope is askew — the caption below it stays level, so the
          scatter reads as deliberate rather than as broken type. */}
      <motion.div
        animate={{ rotate: hover && !locked ? 0 : tilt }}
        transition={{ duration: DUR.base, ease: EASE.soft }}
        className={cn(
          'relative aspect-[1.55/1] w-full overflow-hidden rounded-[6px]',
          'shadow-[0_18px_40px_-22px_rgba(60,35,15,0.75)]',
          locked && 'opacity-55 saturate-50'
        )}
        style={{
          background: 'linear-gradient(160deg, #f7edda 0%, #efe0c6 55%, #e6d3b4 100%)',
        }}
      >
        {/* paper tooth */}
        <span className="grain absolute inset-0 opacity-[0.18]" />

        {/* the flap, drawn as a folded triangle */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[58%]"
          style={{
            background: 'linear-gradient(180deg, #f2e4cb 0%, #e7d5b6 100%)',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            filter: 'drop-shadow(0 2px 2px rgba(120,90,50,0.18))',
          }}
        />

        {/* the seal sits on the flap's point */}
        <span className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2">
          {locked ? (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8a7a63] text-[#f4ead6]">
              <Icon name="lock" size={18} />
            </span>
          ) : (
            <WaxSeal color={letter.sealColor} size={46} glint={hover} />
          )}
        </span>

        {/* opened letters keep a small crease so a reopen reads differently */}
        {opened && !locked && (
          <span className="absolute right-2 top-2">
            <span className="flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[0.58rem] uppercase tracking-wider text-[#8a7454]">
              <Icon name="check" size={9} strokeWidth={2.5} />
              read
            </span>
          </span>
        )}
      </motion.div>

      <div className="mt-3 px-0.5">
        <p className="font-display text-[1.05rem] leading-snug text-[#4a3826]">
          Open when {letter.situation}
        </p>
        {locked && letter.unlockAt && (
          <p className="mt-0.5 text-xs opacity-50">opens {formatDate(letter.unlockAt)}</p>
        )}
      </div>
    </motion.button>
  );
}
