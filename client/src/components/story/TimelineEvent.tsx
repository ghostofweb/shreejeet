import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { mediaUrl } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import { sceneFor } from '@/lib/scenes';
import type { StoryEvent } from '@/lib/types';
import { usePeople } from '@/lib/people';
import { cn, formatDate } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { PhotoGallery } from './PhotoGallery';

/**
 * One stop on the timeline. Desktop alternates left/right of the helix;
 * mobile is a single column with the helix pinned to the left edge.
 */
export function TimelineEvent({
  event,
  side,
  registerRef,
}: {
  event: StoryEvent;
  side: 'left' | 'right';
  /** Lets the page scroll straight to this memory, and drives scene switching. */
  registerRef?: (el: HTMLDivElement | null) => void;
}) {
  const scene = sceneFor(event.sceneType);
  const photos = event.photos ?? [];
  const { attributionFor } = usePeople();

  return (
    <div
      ref={registerRef}
      className={cn(
        'relative flex w-full',
        // mobile: everything sits to the right of the spine
        'pl-16 sm:pl-0',
        // desktop: leave a gutter either side of the spine so the cat riding
        // down it never lands on top of the text
        side === 'left'
          ? 'sm:justify-start sm:pr-[calc(50%+3.75rem)]'
          : 'sm:justify-end sm:pl-[calc(50%+3.75rem)]'
      )}
    >
      {/* the node on the spine */}
      <SpineNode accent={scene.accent} />

      <motion.article
        initial={{ opacity: 0, y: 52, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-90px' }}
        transition={{ duration: DUR.slow, ease: EASE.soft }}
        className={cn('w-full max-w-[36rem]', side === 'left' && 'sm:text-right')}
      >
        {/* date + scene label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: DUR.base, delay: 0.1 }}
          className={cn(
            'mb-2 flex items-center gap-2.5 text-[0.7rem] uppercase tracking-[0.2em]',
            side === 'left' && 'sm:justify-end'
          )}
          style={{ color: scene.accent }}
        >
          <span>{formatDate(event.date)}</span>
          <span className="h-px w-6 bg-current opacity-40" />
          <span className="opacity-60">{scene.label}</span>
        </motion.div>

        <h2 className="font-display text-[clamp(1.9rem,5.5vw,3rem)] leading-[1.05]">
          {event.title}
        </h2>

        {event.location && (
          <p
            className={cn(
              'mt-2 flex items-center gap-1.5 text-sm opacity-60',
              side === 'left' && 'sm:justify-end'
            )}
          >
            <Icon name="pin" size={14} />
            {event.location}
          </p>
        )}

        {event.description && (
          <p className="mt-4 text-pretty text-[1.02rem] leading-relaxed opacity-80">
            {event.description}
          </p>
        )}

        {event.specialMessage && <SpecialMessage text={event.specialMessage} accent={scene.accent} />}

        {photos.length > 0 && (
          <div
            className={cn(
              'mt-6 flex',
              side === 'left' ? 'sm:justify-end' : 'justify-start',
              photos.length > 3 && 'block'
            )}
          >
            <PhotoGallery photos={photos} seed={event.id} />
          </div>
        )}

        {event.video?.url && <StoryVideo url={event.video.url} accent={scene.accent} />}

        <p
          className={cn(
            'mt-5 font-hand text-lg opacity-45',
            side === 'left' && 'sm:text-right'
          )}
        >
          {attributionFor(event.createdBy)}
        </p>
      </motion.article>
    </div>
  );
}

/** A benzene ring sitting on the helix marks each memory. */
function SpineNode({ accent }: { accent: string }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -60 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true, margin: '-90px' }}
      transition={{ duration: 0.7, ease: EASE.bounce }}
      className={cn(
        'absolute top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full',
        'left-[-0.35rem] sm:left-1/2 sm:-translate-x-1/2'
      )}
      style={{
        background: 'rgba(10,6,14,0.62)',
        border: `1px solid ${accent}66`,
        boxShadow: `0 0 26px -4px ${accent}, inset 0 0 12px -6px ${accent}`,
        backdropFilter: 'blur(6px)',
      }}
    >
      <span style={{ color: accent }}>
        <Icon name="benzene" size={22} strokeWidth={1.7} />
      </span>
    </motion.div>
  );
}

/**
 * Video stays silent and still until she asks for it: a poster frame with a
 * play button, then real controls once it starts. Never autoplays with sound.
 */
function StoryVideo({ url, accent }: { url: string; accent: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: DUR.slow, ease: EASE.soft }}
      className="relative mt-6 overflow-hidden rounded-2xl border border-white/15 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)]"
    >
      <video
        ref={videoRef}
        src={mediaUrl(url)}
        playsInline
        preload="metadata"
        controls={playing}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="block w-full bg-black"
      />

      {!playing && (
        <button
          type="button"
          onClick={() => videoRef.current?.play()}
          aria-label="Play video"
          className="group absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/10"
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full backdrop-blur-md transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${accent}e6`, color: '#120d16' }}
          >
            <Icon name="play" size={24} filled />
          </span>
        </button>
      )}
    </motion.div>
  );
}

/** The handwritten line, drawn on rather than faded in. */
function SpecialMessage({ text, accent }: { text: string; accent: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: DUR.slow, ease: EASE.soft, delay: 0.25 }}
      className="mt-5 font-hand text-2xl leading-snug"
      style={{ color: accent }}
    >
      {text}
    </motion.p>
  );
}
