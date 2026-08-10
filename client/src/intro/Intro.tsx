import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DarkRoom } from './DarkRoom';
import { Finale } from './Finale';

type Stage = 'room' | 'flash' | 'finale';

/**
 * Room → a beat of warm light → finale. The flash covers the swap so the two
 * very different scenes never cut against each other.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('room');

  const toFinale = () => {
    setStage('flash');
    window.setTimeout(() => setStage('finale'), 900);
  };

  return (
    <>
      {stage === 'room' && <DarkRoom onComplete={toFinale} onSkip={onDone} />}
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
