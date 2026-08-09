import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes on the panel — lets each world restyle its own modal. */
  className?: string;
  labelledBy?: string;
  /** Where the panel appears to grow from, e.g. a clicked star. */
  origin?: { x: number; y: number } | null;
}

export function Modal({ open, onClose, children, className, labelledBy, origin }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial="hidden"
          animate="show"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            transition={{ duration: DUR.base }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={cn(
              'relative z-10 max-h-[86dvh] w-full max-w-lg overflow-y-auto overscroll-contain',
              'rounded-3xl bg-[var(--bg)] p-6 sm:p-8 lift',
              className
            )}
            style={
              origin
                ? { transformOrigin: `${origin.x}px ${origin.y}px` }
                : undefined
            }
            variants={{
              hidden: { opacity: 0, scale: 0.92, y: 18 },
              show: {
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { duration: DUR.slow, ease: EASE.soft },
              },
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
