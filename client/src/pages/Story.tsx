import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import { api, errorMessage } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import { sceneFor } from '@/lib/scenes';
import type { ListResponse, SceneType, StoryEvent } from '@/lib/types';
import { daysBetween, formatDate } from '@/lib/utils';
import { Cat } from '@/components/Cat';
import { Icon } from '@/components/Icon';
import { Tulip } from '@/components/motifs/Tulip';
import { SceneBackground } from '@/components/story/SceneBackground';
import { Spine } from '@/components/story/Spine';
import { StoryNav } from '@/components/story/StoryNav';
import { TimelineEvent } from '@/components/story/TimelineEvent';
import { useSpineGeometry } from '@/components/story/useSpineGeometry';
import { Empty, ErrorState, Loading } from '@/components/ui/States';

export default function Story() {
  const trackRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scene, setScene] = useState<SceneType>('sunrise');
  const [activeIndex, setActiveIndex] = useState(0);

  /** Centre a memory in the viewport. Native smooth scrolling keeps it buttery. */
  const jumpTo = useCallback((index: number) => {
    const el = eventRefs.current[index];
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.28;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['story'],
    queryFn: async () => (await api.get<ListResponse<StoryEvent>>('/story?limit=200')).data,
  });

  const events = useMemo(() => data?.items ?? [], [data]);

  // The spine owns its own scroll maths now: both the helix fill and the cat
  // read from a reading line pinned in the viewport, so they stay together and
  // the cat is always on screen.
  const { geo, nodeTs, tops, trackTop } = useSpineGeometry(trackRef, eventRefs, events.length);

  const activeScene = sceneFor(scene);

  /**
   * One scroll listener decides which memory is "current" — the last one whose
   * top has passed a reading line a third down the screen. A per-event
   * IntersectionObserver band was unreliable: land in the gap between two
   * memories and nothing was active, so the arrows went stale.
   *
   * It compares against positions measured once by the spine's observer rather
   * than calling getBoundingClientRect per memory per frame. On a 165Hz screen
   * that was thousands of layout reads a second for two pieces of state that
   * change a handful of times per page.
   */
  useEffect(() => {
    if (!events.length || !tops.length) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const line = window.scrollY + window.innerHeight * 0.34;
      let next = 0;
      for (let i = 0; i < tops.length; i++) {
        if (tops[i] <= line) next = i;
        else break;
      }
      setActiveIndex((prev) => (prev === next ? prev : next));
      setScene((prev) => {
        const s = events[next]?.sceneType ?? 'sunrise';
        return prev === s ? prev : s;
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [events, tops]);

  if (isLoading) return <Loading message="finding where it all started…" />;
  if (isError) {
    return (
      <ErrorState message={errorMessage(error, 'Could not load your story')} onRetry={refetch} />
    );
  }

  return (
    <div className="relative" style={{ color: activeScene.fg }}>
      <SceneBackground scene={scene} />

      <div className="relative z-10">
        <Hero count={events.length} first={events[0]} />

      {!events.length ? (
        <div className="px-6 pb-32">
          <Empty
            title="The story hasn't started yet"
            hint="Add your first memory in the admin and it will appear right here, with its own sky."
            action={
              <Link
                to="/admin/story?new=1"
                className="rounded-full border border-current/30 px-5 py-2.5 text-sm transition-colors hover:border-current"
              >
                Add the first memory
              </Link>
            }
          />
        </div>
      ) : (
        <div ref={trackRef} className="relative mx-auto max-w-6xl px-5 pb-40 sm:px-8">
          <Spine
            geo={geo}
            nodeTs={nodeTs}
            events={events}
            trackTop={trackTop}
            accent={activeScene.accent}
          />

          <div className="relative z-[8] flex flex-col gap-32 pt-10 sm:gap-48">
            {events.map((event, i) => (
              <TimelineEvent
                key={event.id}
                event={event}
                side={i % 2 === 0 ? 'left' : 'right'}
                registerRef={(el) => {
                  eventRefs.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>
      )}

        {events.length > 0 && (
          <Outro last={events[events.length - 1]} accent={activeScene.accent} />
        )}
      </div>

      {events.length > 1 && (
        <StoryNav events={events} activeIndex={activeIndex} onJump={jumpTo} />
      )}
    </div>
  );
}

/* ── Hero ─────────────────────────────────────────────────────── */

function Hero({ count, first }: { count: number; first?: StoryEvent }) {
  const { scrollY } = useScroll();
  // Gentle parallax: the title drifts up slower than the page.
  const y = useTransform(scrollY, [0, 600], [0, 130]);
  const opacity = useTransform(scrollY, [0, 420], [1, 0]);

  const days = first ? daysBetween(new Date(first.date), new Date()) : 0;

  return (
    <header className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <motion.div style={{ y, opacity }} className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE.soft }}
        >
          <Tulip size={86} bloom petal="#e8748f" petalDark="#bf4f6c" stem="#6f9a63" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.5, ease: EASE.soft, delay: 0.25 }}
          className="mt-4 font-display text-[clamp(3rem,13vw,7.5rem)] leading-[0.92]"
        >
          Our Story
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE.soft, delay: 0.55 }}
          className="mt-5 max-w-md text-balance text-[1.05rem] opacity-70"
        >
          {count > 0 && first
            ? `${count} ${count === 1 ? 'memory' : 'memories'}, starting ${formatDate(first.date)} — ${days.toLocaleString()} days ago.`
            : 'Everything, in the order it happened.'}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-10 flex flex-col items-center gap-2 text-sm opacity-50"
      >
        <span className="font-hand text-lg">scroll</span>
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon name="chevron-down" size={20} />
        </motion.span>
      </motion.div>
    </header>
  );
}

/* ── Outro ────────────────────────────────────────────────────── */

function Outro({ last, accent }: { last: StoryEvent; accent: string }) {
  return (
    <footer className="relative flex min-h-[70dvh] flex-col items-center justify-center gap-6 px-6 pb-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-120px' }}
        transition={{ duration: DUR.slow, ease: EASE.soft }}
        className="flex flex-col items-center"
      >
        <Cat pose="sit" mood="happy" size={100} says="and it keeps going…" />

        <p className="mt-6 max-w-sm text-balance opacity-65">
          The last one so far was {formatDate(last.date)}. There is plenty of room left.
        </p>

        <Link
          to="/admin/story?new=1"
          className="mt-7 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm transition-all duration-300 hover:gap-3"
          style={{ borderColor: `${accent}66`, color: accent }}
        >
          <Icon name="plus" size={16} />
          Add the next memory
        </Link>
      </motion.div>
    </footer>
  );
}
