import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { api, mediaUrl } from '@/lib/api';
import { EASE } from '@/lib/motion';
import type { ListResponse, MediaAsset } from '@/lib/types';
import { seededRandom } from '@/lib/utils';
import { Cat } from '@/components/Cat';
import { Tulip } from '@/components/motifs/Tulip';
import { FINALE } from './config';

/**
 * The birthday moment, choreographed rather than just faded in:
 *
 *   0.0s  the dark lifts into warm light
 *   0.4s  her photos arrive one by one and settle into an arc
 *   1.4s  candles ignite along the bottom, left to right
 *   2.0s  her name is written on, left to right, in handwriting
 *   3.6s  the sentence underneath
 *   4.2s  petals begin to fall
 *   4.8s  the cat, and the way in
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

  /** Photos settle into a wide arc, clear of the middle where the words are. */
  const arranged = useMemo(
    () =>
      photos.map((url, i) => {
        const n = photos.length;
        const t = n === 1 ? 0.5 : i / (n - 1);
        const angle = Math.PI * (1.06 - t * 1.12);
        const r1 = seededRandom(`${url}-a`);
        return {
          url,
          left: 50 + Math.cos(angle) * 43,
          top: 46 - Math.sin(angle) * 40,
          rotate: (r1 - 0.5) * 20,
          scale: 0.82 + r1 * 0.3,
          delay: 0.4 + i * 0.11,
        };
      }),
    [photos]
  );

  const d = (s: number) => (reduced ? 0 : s);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#120d1c]">
      {/* the dark lifting into warmth */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.6, ease: EASE.soft }}
        style={{
          background:
            'radial-gradient(65% 50% at 50% 42%, rgba(255,196,128,0.26), transparent 66%),' +
            'radial-gradient(95% 70% at 50% 112%, rgba(206,92,134,0.28), transparent 70%)',
        }}
      />

      {/* rising embers */}
      {!reduced &&
        Array.from({ length: 30 }).map((_, i) => (
          <span
            key={`e${i}`}
            aria-hidden
            className="absolute h-1 w-1 rounded-full bg-[#ffce8c]"
            style={{
              left: `${(i * 37) % 100}%`,
              bottom: '-4%',
              opacity: 0.55,
              animation: `rise ${8 + (i % 7)}s ease-in-out ${-i * 0.6}s infinite`,
              boxShadow: '0 0 9px rgba(255,206,140,0.9)',
            }}
          />
        ))}

      {/* falling petals, once the name is up */}
      {!reduced &&
        Array.from({ length: 22 }).map((_, i) => (
          <span
            key={`p${i}`}
            aria-hidden
            className="absolute"
            style={{
              left: `${(i * 53) % 100}%`,
              top: '-6%',
              width: 9 + (i % 4) * 3,
              height: 7 + (i % 3) * 3,
              borderRadius: '60% 20% 60% 20%',
              background: i % 2 ? '#e8748f' : '#f4a9c0',
              opacity: 0.75,
              animation: `fall-slow ${11 + (i % 6)}s linear ${d(4.2) + i * 0.4}s infinite`,
            }}
          />
        ))}

      {/* her photos */}
      {arranged.map((p) => (
        <motion.img
          key={p.url}
          src={mediaUrl(p.url)}
          alt=""
          loading="eager"
          initial={{ opacity: 0, scale: 0.3, y: 120, rotate: p.rotate * 3 }}
          animate={{ opacity: 1, scale: p.scale, y: 0, rotate: p.rotate }}
          transition={{ duration: 1.5, ease: EASE.soft, delay: d(p.delay) }}
          className="absolute hidden w-[8.5rem] -translate-x-1/2 -translate-y-1/2 rounded-[3px] border-4 border-[#fbf5ea] object-cover shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] md:block"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
        />
      ))}

      {/* candles along the bottom, lighting one after another */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center gap-5 sm:gap-9">
        {Array.from({ length: 9 }).map((_, i) => (
          <Candle key={i} delay={d(1.4 + i * 0.16)} reduced={!!reduced} />
        ))}
      </div>

      {/* the words */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.6, ease: EASE.soft, delay: d(0.9) }}
        >
          <Tulip size={104} bloom petal="#e8748f" petalDark="#bf4f6c" stem="#6f9a63" />
        </motion.div>

        {/* written on, left to right */}
        <motion.h1
          initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
          animate={{ clipPath: 'inset(0 -6% 0 0)', opacity: 1 }}
          transition={{
            clipPath: { duration: reduced ? 0 : 2.6, ease: [0.33, 0.9, 0.4, 1], delay: d(2) },
            opacity: { duration: 0.4, delay: d(2) },
          }}
          className="mt-4 max-w-4xl font-hand text-[clamp(2.8rem,11vw,6.5rem)] leading-[1.08] text-[#fff3e2]"
          style={{ textShadow: '0 0 42px rgba(255,190,120,0.45)' }}
        >
          {FINALE.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: EASE.soft, delay: d(3.6) }}
          className="mt-6 max-w-lg text-balance text-[1.05rem] leading-relaxed text-[#f6dfc6]/80"
        >
          {FINALE.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE.soft, delay: d(4.8) }}
          className="mt-9 flex flex-col items-center gap-5"
        >
          <Cat pose="hold-heart" mood="happy" size={96} />
          <motion.button
            onClick={onEnter}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-[#e8748f] px-10 py-4 text-lg text-[#2a1420] shadow-[0_16px_46px_-12px_rgba(232,116,143,0.95)]"
          >
            {FINALE.cta}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

/** One candle that catches, then keeps a live flame. */
function Candle({ delay, reduced }: { delay: number; reduced: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE.bounce, delay }}
        className="relative"
      >
        {/* the halo it throws */}
        <span
          className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,206,140,0.55), rgba(255,190,120,0.12) 45%, transparent 70%)',
          }}
        />
        <motion.svg
          width="15"
          height="21"
          viewBox="0 0 22 30"
          className="relative"
          animate={reduced ? undefined : { scaleY: [1, 1.16, 0.94, 1], scaleX: [1, 0.92, 1.06, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay }}
          style={{ transformOrigin: '11px 26px' }}
        >
          <path d="M11 2 C 16 10, 19 14, 19 19 a 8 8 0 0 1 -16 0 C 3 14, 6 10, 11 2 Z" fill="#ffb347" />
          <path d="M11 10 C 14 15, 15 17, 15 20 a 4 4 0 0 1 -8 0 C 7 17, 8 15, 11 10 Z" fill="#fff2c4" />
        </motion.svg>
      </motion.div>

      {/* the candle body */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ duration: 0.6, ease: EASE.soft, delay: Math.max(0, delay - 0.3) }}
        className="w-3 rounded-t-sm bg-gradient-to-b from-[#f6e6cf] to-[#d9c3a4] sm:w-4"
        style={{ height: 34 }}
      />
    </div>
  );
}
