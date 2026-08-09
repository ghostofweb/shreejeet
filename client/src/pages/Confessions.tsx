import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api, errorMessage } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import type { Confession, ListResponse } from '@/lib/types';
import { Cat } from '@/components/Cat';
import { Icon } from '@/components/Icon';
import { Empty, ErrorState, Loading } from '@/components/ui/States';
import { ConfessionNote } from '@/components/confessions/ConfessionNote';
import { Spotlight } from '@/components/confessions/Spotlight';

/** 1 / 2 / 3 columns, matching the grid breakpoints below. */
function useColumnCount(): number {
  const [n, setN] = useState(1);
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const mid = window.matchMedia('(min-width: 640px)');
    const update = () => setN(wide.matches ? 3 : mid.matches ? 2 : 1);
    update();
    wide.addEventListener('change', update);
    mid.addEventListener('change', update);
    return () => {
      wide.removeEventListener('change', update);
      mid.removeEventListener('change', update);
    };
  }, []);
  return n;
}

export default function Confessions() {
  const qc = useQueryClient();
  /** Revealed in this session, on top of whatever the server already knows. */
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['confessions'],
    queryFn: async () => (await api.get<ListResponse<Confession>>('/confessions')).data,
  });

  const reveal = useMutation({
    mutationFn: async (id: string) => (await api.post<Confession>(`/confessions/${id}/reveal`)).data,
    onSuccess: (full) => {
      setRevealed((prev) => new Set(prev).add(full.id));
      qc.invalidateQueries({ queryKey: ['confessions'] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const unread = items.filter((c) => !c.locked && !revealed.has(c.id)).length;
  const columnCount = useColumnCount();

  /** Deal the notes across columns like cards, keeping source order per column. */
  const columns = useMemo(() => {
    const cols: { c: Confession; i: number }[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((c, i) => cols[i % columnCount].push({ c, i }));
    return cols;
  }, [items, columnCount]);

  if (isLoading) return <Loading message="turning the lights down…" />;
  if (isError) {
    return (
      <ErrorState message={errorMessage(error, 'Could not load the confessions')} onRetry={refetch} />
    );
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#0c0a11] text-[#ded7ea]">
      <Spotlight />

      {/* dust, barely there */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-[2px] w-[2px] animate-[float-soft_ease-in-out_infinite] rounded-full bg-[#b3a6d8]"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              opacity: 0.16 + (i % 4) * 0.06,
              animationDuration: `${9 + (i % 6) * 2}s`,
              animationDelay: `${-i * 1.4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-28 pt-28 sm:px-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE.soft }}
          className="mb-14 text-center"
        >
          <h1 className="font-display text-[clamp(2.2rem,7vw,3.6rem)] leading-none">
            Confessions
          </h1>
          <p className="mt-4 font-hand text-2xl opacity-55">
            things I never quite said out loud
          </p>
          {items.length > 0 && (
            <p className="mt-3 text-xs uppercase tracking-[0.2em] opacity-30">
              {unread > 0 ? `${unread} still unread` : 'you have read them all'}
            </p>
          )}
        </motion.header>

        {!items.length ? (
          <Empty
            title="Nothing confessed yet"
            hint="Write the thing you have been meaning to say."
            action={
              <Link
                to="/admin/confessions?new=1"
                className="rounded-full border border-current/25 px-5 py-2.5 text-sm transition-colors hover:border-current"
              >
                Write the first one
              </Link>
            }
          />
        ) : (
          /* Columns are built by hand rather than with CSS multi-column: the
             transformed notes wouldn't fragment across columns, and multicol
             also makes screen readers read down one column and back up. */
          <div className="grid grid-cols-1 items-start gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {columns.map((col, ci) => (
              <div key={ci}>
                {col.map(({ c, i }) => (
                  <ConfessionNote
                    key={c.id}
                    confession={c}
                    index={i}
                    revealed={revealed.has(c.id) || (!!c.revealedByMe && !!c.text)}
                    onReveal={() => reveal.mutate(c.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-5">
            <Cat pose="sit" mood="shy" size={78} />
            <Link
              to="/admin/confessions?new=1"
              className="inline-flex items-center gap-2 rounded-full border border-current/20 px-5 py-2.5 text-sm opacity-50 transition-all hover:gap-3 hover:opacity-100"
            >
              <Icon name="plus" size={14} />
              Say something else
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
