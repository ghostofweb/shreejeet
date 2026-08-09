import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { api, errorMessage } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import { starMeta } from '@/lib/starTypes';
import type { ListResponse, UniverseStar } from '@/lib/types';
import { Cat } from '@/components/Cat';
import { Icon } from '@/components/Icon';
import { ErrorState, Loading } from '@/components/ui/States';
import { StarDetail } from '@/components/universe/StarDetail';
import { StarField } from '@/components/universe/StarField';
import { StarIndex } from '@/components/universe/StarIndex';

const DISCOVERED_KEY = 'olw-discovered-stars';

function loadDiscovered(): Set<string> {
  try {
    const raw = localStorage.getItem(DISCOVERED_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export default function Universe() {
  const [selected, setSelected] = useState<UniverseStar | null>(null);
  const [hovered, setHovered] = useState<UniverseStar | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(loadDiscovered);
  const [justFound, setJustFound] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['stars'],
    queryFn: async () => (await api.get<ListResponse<UniverseStar>>('/stars')).data,
  });

  const stars = useMemo(() => data?.items ?? [], [data]);

  const onDiscover = useCallback(
    (id: string) => {
      setDiscovered((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev).add(id);
        try {
          localStorage.setItem(DISCOVERED_KEY, JSON.stringify([...next]));
        } catch {
          /* private mode — discovery just won't persist */
        }
        setJustFound(id);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!justFound) return;
    const t = setTimeout(() => setJustFound(null), 3200);
    return () => clearTimeout(t);
  }, [justFound]);

  // Keep this world dark even while the shell's tokens say otherwise.
  useEffect(() => {
    document.body.style.background = '#05050c';
    return () => {
      document.body.style.background = '';
    };
  }, []);

  if (isLoading) return <Loading message="finding the sky…" />;
  if (isError) {
    return <ErrorState message={errorMessage(error, 'Could not load the sky')} onRetry={refetch} />;
  }

  const openCount = stars.filter((s) => !s.locked && !s.isSecret).length;
  const secretsFound = stars.filter((s) => s.isSecret && discovered.has(s.id)).length;
  const secretsTotal = stars.filter((s) => s.isSecret).length;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#05050c] text-[#e8eaff]">
      <StarField
        stars={stars}
        discovered={discovered}
        onDiscover={onDiscover}
        onSelect={setSelected}
        onHoverChange={setHovered}
      />

      {/* the cat drifts through, in a helmet */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-[22%] z-10 hidden sm:block"
        animate={{ y: [0, -18, 0], x: [0, 12, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Cat pose="float" mood="curious" size={78} />
      </motion.div>

      {/* title, out of the way */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.scene, ease: EASE.soft, delay: 0.2 }}
        className="pointer-events-none absolute inset-x-0 top-24 z-10 flex flex-col items-center px-6 text-center"
      >
        <h1 className="font-display text-[clamp(2rem,6vw,3.2rem)] leading-none">Our Universe</h1>
        <p className="mt-2 max-w-sm text-balance text-sm opacity-45">
          {openCount > 0
            ? 'Some of these stars are ours. Click the bright ones.'
            : 'Add a star in the admin and it will appear up here.'}
        </p>
      </motion.header>

      {/* what you're pointing at */}
      <AnimatePresence>
        {hovered && !selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: DUR.fast }}
            className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-4 py-2 text-sm backdrop-blur-md"
          >
            <span className="flex items-center gap-2">
              <span style={{ color: starMeta(hovered.type).color }}>
                <Icon name={hovered.locked ? 'lock' : starMeta(hovered.type).icon} size={13} />
              </span>
              {hovered.locked ? 'Locked for now' : hovered.title}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* a secret revealing itself */}
      <AnimatePresence>
        {justFound && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.slow, ease: EASE.soft }}
            className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2 text-center"
          >
            <span className="text-[#d7b0ff]">
              <Icon name="sparkle" size={26} />
            </span>
            <p className="font-hand text-2xl">you found a hidden one</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* footer: counts and a hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 text-xs opacity-40">
        <span>{openCount} of ours</span>
        {secretsTotal > 0 && (
          <span>
            {secretsFound}/{secretsTotal} hidden found
          </span>
        )}
        <span className="hidden sm:inline">drag to move · scroll to zoom</span>
        <span className="sm:hidden">drag to move</span>
        {openCount === 0 && (
          <Link to="/admin/stars?new=1" className="pointer-events-auto underline">
            add the first star
          </Link>
        )}
      </div>

      <StarIndex stars={stars} discovered={discovered} onSelect={setSelected} />

      <StarDetail star={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
