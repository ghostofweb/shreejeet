import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PullCord } from './PullCord';
import { DarkRoom } from './DarkRoom';
import { Wish } from './Wish';
import { Finale } from './Finale';

type Stage = 'cord' | 'room' | 'flash' | 'wish' | 'finale';

/**
 * Four beats:
 *
 *   cord    she pulls a light on and gets a candle
 *   room    the candle wakes the room, and the room remembers her path
 *   wish    a cake, and one hold to blow it out
 *   finale  black, silence, and then her name
 *
 * The flash only sits between the room and the cake, where two very different
 * scenes would otherwise cut against each other. The cake hands over already
 * black, and the finale opens black, so that seam needs nothing.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('cord');

  /*
   * These are memoised on purpose. Each beat hands over on a timer keyed to its
   * `onComplete`, so a callback that changed identity on every parent render
   * would keep restarting that timer — the handover would either stutter or
   * fire twice.
   */
  const toRoom = useCallback(() => setStage('room'), []);
  const toFinale = useCallback(() => setStage('finale'), []);
  const toWish = useCallback(() => {
    setStage('flash');
    window.setTimeout(() => setStage('wish'), 900);
  }, []);

  return (
    <>
      {stage === 'cord' && <PullCord onComplete={toRoom} />}
      {/* kept mounted through the flash so nothing shows underneath it */}
      {(stage === 'room' || stage === 'flash') && (
        <DarkRoom onComplete={toWish} onSkip={onDone} />
      )}
      {stage === 'wish' && <Wish onComplete={toFinale} />}
      {stage === 'finale' && <Finale onEnter={onDone} />}

      <AnimatePresence>
        {stage === 'flash' && (
          <motion.div
            className="fixed inset-0 z-[110] bg-[#ffe9c9]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, times: [0, 0.45, 1], ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
