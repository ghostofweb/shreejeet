import { motion } from 'framer-motion';
import { mediaUrl } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import { usePeople } from '@/lib/people';
import { starMeta } from '@/lib/starTypes';
import type { UniverseStar } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { Cat } from '@/components/Cat';
import { Modal } from '@/components/ui/Modal';

/** What opens when she clicks a star. Locked stars never carry their text. */
export function StarDetail({
  star,
  onClose,
}: {
  star: UniverseStar | null;
  onClose: () => void;
}) {
  const { attributionFor } = usePeople();
  const meta = starMeta(star?.type);
  const locked = !!star?.locked;

  return (
    <Modal
      open={!!star}
      onClose={onClose}
      className="max-w-lg border border-white/10 bg-[#0e0c18] text-[#e8eaff]"
    >
      {star && (
        <>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-2 opacity-40 transition-opacity hover:opacity-90"
          >
            <Icon name="close" size={16} />
          </button>

          {locked ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span style={{ color: meta.color }}>
                <Icon name="lock" size={30} />
              </span>
              <p className="font-display text-2xl">Not yet</p>
              <p className="max-w-xs text-balance text-sm opacity-55">
                {star.unlockAt
                  ? `This one opens on ${formatDate(star.unlockAt)}.`
                  : 'This one is not ready to be opened.'}
              </p>
              <Cat pose="float" mood="sleepy" size={78} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.slow, ease: EASE.soft }}
            >
              <div
                className="mb-3 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em]"
                style={{ color: meta.color }}
              >
                <Icon name={meta.icon} size={13} />
                {meta.label}
                {star.date && <span className="opacity-50">· {formatDate(star.date)}</span>}
              </div>

              <h2 className="font-display text-[clamp(1.6rem,4vw,2.3rem)] leading-tight">
                {star.title}
              </h2>

              {star.message && (
                <p className="mt-4 whitespace-pre-line text-pretty leading-relaxed opacity-80">
                  {star.message}
                </p>
              )}

              {!!star.photos?.length && (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {star.photos.map((p) => (
                    <img
                      key={p.url}
                      src={mediaUrl(p.url)}
                      alt={p.alt ?? ''}
                      loading="lazy"
                      className="aspect-square w-full rounded-xl border border-white/10 object-cover"
                    />
                  ))}
                </div>
              )}

              <p className="mt-6 font-hand text-lg opacity-45">
                {attributionFor(star.createdBy)}
              </p>
            </motion.div>
          )}
        </>
      )}
    </Modal>
  );
}
