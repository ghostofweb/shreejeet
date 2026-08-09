import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Cat, type CatPose } from '@/components/Cat';
import { Button } from './Button';
import { cn } from '@/lib/utils';

/** Loading, empty and error all speak in the cat's voice — never "No data found". */

export function Loading({ message = 'one moment…' }: { message?: string }) {
  return (
    <div className="flex min-h-[45dvh] flex-col items-center justify-center gap-3 opacity-80">
      <Cat pose="walk" mood="curious" size={84} />
      <p className="font-hand text-xl opacity-70">{message}</p>
    </div>
  );
}

export function Empty({
  title,
  hint,
  action,
  pose = 'sit',
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  pose?: CatPose;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[45dvh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <Cat pose={pose} mood="sleepy" size={96} />
      <div className="space-y-1.5">
        <p className="font-display text-2xl">{title}</p>
        {hint && <p className="max-w-sm text-balance opacity-55">{hint}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[35dvh] flex-col items-center justify-center gap-4 px-6 text-center',
        className
      )}
    >
      <Cat pose="sit" mood="shy" size={80} />
      <div className="space-y-1">
        <p className="font-display text-xl">That didn't work</p>
        <p className="max-w-sm text-sm opacity-55">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Content-shaped placeholder for lists that are still loading. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-breathe rounded-xl bg-[color-mix(in_srgb,var(--fg)_10%,transparent)]',
        className
      )}
    />
  );
}
