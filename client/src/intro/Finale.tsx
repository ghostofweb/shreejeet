import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { api, mediaUrl } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import type { ListResponse, MediaAsset } from '@/lib/types';
import { seededRandom } from '@/lib/utils';
import { Cat } from '@/components/Cat';
import { Tulip } from '@/components/motifs/Tulip';
import { FINALE } from './config';

/**
 * The end of the intro: her photos fly in and settle around the message, then
 * the message is written on.
 *
 * Photos come from FINALE.photos if you listed any, otherwise from the most
 * recent images in the media library — so it works before you've curated it.
 */
export function Finale({ onEnter }: { onEnter: () => void }) {
  const reduced = useReducedMotion();

  const { data } = useQuery({
    queryKey: ['media', 'finale'],
    queryFn: async () =>
      (await api.get<ListResponse<MediaAsset>>(`/media?limit=${FINALE.libraryFallbackCount * 2}`))
        .data,
    enabled: FINALE.photos.length === 0,
    staleTime: 5 * 60 * 1000,
  });

  const photos = useMemo(() => {
    if (FINALE.photos.length) return FINALE.photos;
    return (data?.items ?? [])
      .filter((m) => m.type === 'image')
      .slice(0, FINALE.libraryFallbackCount)
      .map((m) => m.url);
  }, [data]);

  /* Scattered around the edges, never over the middle where the words are. */
  const placed = useMemo(
    () =>
      photos.map((url, i) => {
        const r1 = seededRandom(`${url}-a`);
        const r2 = seededRandom(`${url}-b`);
        const leftSide = i % 2 === 0;
        return {
          url,
          left: leftSide ? 2 + r1 * 26 : 72 + r1 * 26,
          top: 6 + r2 * 78,
          rotate: (r1 - 0.5) * 22,
          delay: 0.5 + i * 0.13,
          scale: 0.8 + r2 * 0.35,
        };
      }),
    [photos]
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#120d1c]">
      {/* warm bloom behind everything */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.4, ease: EASE.soft }}
        style={{
          background:
            'radial-gradient(70% 55% at 50% 45%, rgba(255,190,120,0.22), transparent 65%),' +
            'radial-gradient(90% 70% at 50% 110%, rgba(200,90,130,0.22), transparent 70%)',
        }}
      />

      {/* rising embers */}
      {!reduced &&
        Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute h-1 w-1 rounded-full bg-[#ffce8c]"
            style={{
              left: `${(i * 41) % 100}%`,
              bottom: '-5%',
              opacity: 0.5,
              animation: `rise ${7 + (i % 6)}s ease-in-out ${-i * 0.7}s infinite`,
              boxShadow: '0 0 8px rgba(255,206,140,0.8)',
            }}
          />
        ))}

      {/* her photos, arriving */}
      {placed.map((p) => (
        <motion.img
          key={p.url}
          src={mediaUrl(p.url)}
          alt=""
          loading="lazy"
          initial={{ opacity: 0, scale: 0.4, y: 90, rotate: p.rotate * 2.5 }}
          animate={{ opacity: 1, scale: p.scale, y: 0, rotate: p.rotate }}
          transition={{ duration: 1.5, ease: EASE.soft, delay: reduced ? 0 : p.delay }}
          className="absolute hidden w-[9rem] rounded-[3px] border-4 border-[#fbf5ea] object-cover shadow-[0_20px_50px_-18px_rgba(0,0,0,0.8)] sm:block"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
        />
      ))}

      {/* the message */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE.soft, delay: 0.2 }}
        >
          <Tulip size={92} bloom petal="#e8748f" petalDark="#bf4f6c" stem="#6f9a63" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 26, filter: 'blur(14px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.8, ease: EASE.soft, delay: 0.9 }}
          className="mt-5 max-w-3xl text-balance font-display text-[clamp(2.4rem,9vw,5rem)] leading-[1.02] text-[#fff3e2]"
        >
          {FINALE.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: EASE.soft, delay: 1.8 }}
          className="mt-6 max-w-lg text-balance font-hand text-[1.6rem] leading-snug text-[#f6dfc6]/85"
        >
          {FINALE.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE.soft, delay: 2.8 }}
          className="mt-10 flex flex-col items-center gap-5"
        >
          <Cat pose="hold-heart" mood="happy" size={92} />
          <button
            onClick={onEnter}
            className="rounded-full bg-[#e8748f] px-9 py-4 text-lg text-[#2a1420] shadow-[0_14px_40px_-14px_rgba(232,116,143,0.9)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            {FINALE.cta}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
