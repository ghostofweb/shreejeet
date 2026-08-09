import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { mediaUrl } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import type { MediaRef } from '@/lib/types';
import { cn, seededRandom } from '@/lib/utils';
import { Icon } from '@/components/Icon';

/**
 * One photo reads as a single polaroid; two or three fan out like prints
 * dropped on a table; four or more become a grid. All of them open a lightbox.
 */
export function PhotoGallery({ photos, seed }: { photos: MediaRef[]; seed: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;

  const layout = photos.length === 1 ? 'single' : photos.length <= 3 ? 'fan' : 'grid';

  return (
    <>
      {layout === 'single' && (
        <Polaroid photo={photos[0]} rotate={(seededRandom(seed) - 0.5) * 5} onClick={() => setOpen(0)} />
      )}

      {layout === 'fan' && (
        <div className="flex flex-wrap items-start gap-3 sm:-space-x-6 sm:gap-0">
          {photos.map((p, i) => (
            <Polaroid
              key={p.url}
              photo={p}
              rotate={(seededRandom(seed + i) - 0.5) * 11}
              index={i}
              onClick={() => setOpen(i)}
              className="sm:hover:z-10"
            />
          ))}
        </div>
      )}

      {layout === 'grid' && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((p, i) => (
            <motion.button
              key={p.url}
              type="button"
              onClick={() => setOpen(i)}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/15"
            >
              <img
                src={mediaUrl(p.url)}
                alt={p.alt ?? ''}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-105"
              />
            </motion.button>
          ))}
        </div>
      )}

      <Lightbox
        photos={photos}
        index={open}
        onClose={() => setOpen(null)}
        onNavigate={(i) => setOpen(i)}
      />
    </>
  );
}

function Polaroid({
  photo,
  rotate,
  onClick,
  index = 0,
  className,
}: {
  photo: MediaRef;
  rotate: number;
  onClick: () => void;
  index?: number;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 22, rotate: rotate * 2 }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: DUR.slow, ease: EASE.soft, delay: index * 0.08 }}
      whileHover={{ rotate: 0, y: -6, scale: 1.03, zIndex: 20 }}
      className={cn(
        'relative block rounded-[3px] bg-[#fbf5ea] p-2 pb-7 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.75)]',
        'w-[min(72vw,220px)] sm:w-[210px]',
        className
      )}
      style={{ transformOrigin: 'center bottom' }}
    >
      <img
        src={mediaUrl(photo.url)}
        alt={photo.alt ?? ''}
        loading="lazy"
        decoding="async"
        className="aspect-[4/5] w-full rounded-[1px] object-cover"
      />
      {photo.alt && (
        <span className="absolute inset-x-2 bottom-1.5 truncate text-center font-hand text-sm text-black/55">
          {photo.alt}
        </span>
      )}
    </motion.button>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: MediaRef[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % photos.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + photos.length) % photos.length);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [index, photos.length, onClose, onNavigate]);

  return createPortal(
    <AnimatePresence>
      {index !== null && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.base }}
        >
          <div className="absolute inset-0 bg-black/88 backdrop-blur-sm" onClick={onClose} />

          <motion.img
            key={photos[index].url}
            src={mediaUrl(photos[index].url)}
            alt={photos[index].alt ?? ''}
            drag={photos.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) onNavigate((index + 1) % photos.length);
              if (info.offset.x > 80) onNavigate((index - 1 + photos.length) % photos.length);
            }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: DUR.slow, ease: EASE.soft }}
            className="relative z-10 max-h-[86dvh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
          />

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2.5 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
          >
            <Icon name="close" size={20} />
          </button>

          {photos.length > 1 && (
            <>
              <NavArrow
                side="left"
                onClick={() => onNavigate((index - 1 + photos.length) % photos.length)}
              />
              <NavArrow side="right" onClick={() => onNavigate((index + 1) % photos.length)} />
              <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white/70 backdrop-blur">
                {index + 1} / {photos.length}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function NavArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={cn(
        'absolute top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white/75',
        'backdrop-blur transition-colors hover:bg-white/20 hover:text-white sm:block',
        side === 'left' ? 'left-4' : 'right-4'
      )}
    >
      <Icon name={side === 'left' ? 'arrow-left' : 'arrow-right'} size={20} />
    </button>
  );
}
