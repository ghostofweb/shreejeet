import { motion } from 'framer-motion';
import { Icon } from '@/components/Icon';
import { DUR, EASE } from '@/lib/motion';
import { usePeople } from '@/lib/people';
import { categoryMeta } from '@/lib/reasons';
import type { Reason } from '@/lib/types';

/**
 * A reason arrives like a card set down on a table: it drops in, tilts, then
 * settles. The category is a coloured ribbon rather than a chip.
 */
export function ReasonCard({ reason }: { reason: Reason }) {
  const meta = categoryMeta(reason.category);
  const { attributionFor } = usePeople();

  return (
    <motion.figure
      initial={{ opacity: 0, y: 46, rotate: -4, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      // The card leaves quickly and arrives slowly: pressing "another one"
      // should feel immediate, not like waiting for the old one to finish.
      exit={{
        opacity: 0,
        y: -22,
        rotate: 3,
        scale: 0.97,
        transition: { duration: 0.22, ease: EASE.swift },
      }}
      transition={{ duration: DUR.slow, ease: EASE.soft }}
      className="paper-surface relative mx-auto w-[min(92vw,34rem)] rounded-[1.4rem] px-7 py-9 text-center [grid-area:1/1] sm:px-10 sm:py-11"
      style={{ color: '#33202a' }}
    >
      {/* ribbon */}
      <span
        aria-hidden
        className="absolute left-0 right-0 top-0 h-[5px] rounded-t-[1.4rem]"
        style={{ background: meta.color }}
      />

      <figcaption
        className="mb-4 flex items-center justify-center gap-2 text-[0.68rem] uppercase tracking-[0.2em]"
        style={{ color: meta.color }}
      >
        <Icon name={meta.icon} size={13} />
        {meta.label}
      </figcaption>

      <motion.blockquote
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.slow, ease: EASE.soft, delay: 0.12 }}
        className="font-display text-[clamp(1.5rem,4.4vw,2.15rem)] leading-[1.24]"
      >
        {reason.text}
      </motion.blockquote>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: DUR.base, delay: 0.35 }}
        className="mt-6 font-hand text-lg"
      >
        {attributionFor(reason.createdBy)}
      </motion.p>
    </motion.figure>
  );
}
