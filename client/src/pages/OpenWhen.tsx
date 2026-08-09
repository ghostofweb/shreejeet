import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api, errorMessage } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import type { ListResponse, OpenWhenLetter } from '@/lib/types';
import { Cat } from '@/components/Cat';
import { Icon } from '@/components/Icon';
import { Empty, ErrorState, Loading } from '@/components/ui/States';
import { Envelope } from '@/components/letters/Envelope';
import { LetterReader } from '@/components/letters/LetterReader';

export default function OpenWhen() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<{ letter: OpenWhenLetter; firstOpen: boolean } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['letters'],
    queryFn: async () => (await api.get<ListResponse<OpenWhenLetter>>('/letters')).data,
  });

  const letters = useMemo(() => data?.items ?? [], [data]);

  /** The body only arrives here — the list never carries it. */
  const openLetter = useMutation({
    mutationFn: async (id: string) =>
      (await api.post<OpenWhenLetter & { firstOpen: boolean }>(`/letters/${id}/open`)).data,
    onSuccess: (full) => {
      setFailed(null);
      setOpen({ letter: full, firstOpen: !!full.firstOpen });
      qc.invalidateQueries({ queryKey: ['letters'] });
    },
    onError: (err) => setFailed(errorMessage(err, 'That letter would not open')),
  });

  if (isLoading) return <Loading message="finding the letters…" />;
  if (isError) {
    return <ErrorState message={errorMessage(error, 'Could not load the letters')} onRetry={refetch} />;
  }

  const unread = letters.filter((l) => !l.locked && !l.openedByMe).length;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* the world: a warm desk under a lamp */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(80% 55% at 50% 0%, rgba(255,226,170,0.5), transparent 60%),' +
            'radial-gradient(70% 60% at 80% 100%, rgba(214,170,110,0.35), transparent 65%)',
        }}
      />
      <div aria-hidden className="grain pointer-events-none fixed inset-0 opacity-30" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-28 pt-28 sm:px-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE.soft }}
          className="mb-12 flex flex-col items-center text-center"
        >
          <Cat pose="hold-envelope" mood="happy" size={92} />
          <h1 className="mt-3 font-display text-[clamp(2.2rem,7vw,3.6rem)] leading-none">
            Open When…
          </h1>
          <p className="mt-3 max-w-md text-balance opacity-55">
            {letters.length
              ? unread > 0
                ? `${unread} ${unread === 1 ? 'letter is' : 'letters are'} still sealed.`
                : 'You have opened all of them. They still work the second time.'
              : 'Letters for the moments you need them.'}
          </p>
        </motion.header>

        {failed && (
          <p className="mb-6 text-center text-sm text-rose" role="alert">
            {failed}
          </p>
        )}

        {!letters.length ? (
          <Empty
            title="No letters yet"
            hint="Write one in the admin — something worth reading at 3am."
            action={
              <Link
                to="/admin/letters?new=1"
                className="rounded-full border border-current/25 px-5 py-2.5 text-sm transition-colors hover:border-current"
              >
                Write the first one
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {letters.map((l, i) => (
              <Envelope
                key={l.id}
                letter={l}
                index={i}
                onOpen={() => openLetter.mutate(l.id)}
              />
            ))}
          </div>
        )}

        {letters.length > 0 && (
          <div className="mt-14 text-center">
            <Link
              to="/admin/letters?new=1"
              className="inline-flex items-center gap-2 rounded-full border border-current/20 px-5 py-2.5 text-sm opacity-60 transition-all hover:gap-3 hover:opacity-100"
            >
              <Icon name="plus" size={14} />
              Write another
            </Link>
          </div>
        )}
      </div>

      <LetterReader
        letter={open?.letter ?? null}
        firstOpen={!!open?.firstOpen}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}
