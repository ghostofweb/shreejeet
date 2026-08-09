import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { api, errorMessage, mediaUrl } from '@/lib/api';
import {
  byUpcoming,
  nextAhead,
  nextOccurrenceOf,
  ordinalSuffix,
  ordinalYears,
  wholeDaysBetween,
} from '@/lib/dates';
import { DUR, EASE } from '@/lib/motion';
import { usePeople } from '@/lib/people';
import type { ImportantDate, ListResponse } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { Cat } from '@/components/Cat';
import { Icon, type IconName } from '@/components/Icon';
import { Modal } from '@/components/ui/Modal';
import { Empty, ErrorState, Loading } from '@/components/ui/States';
import { Countdown, useCountdown } from '@/components/dates/Countdown';
import { Orbit } from '@/components/dates/Orbit';

export default function Dates() {
  const [view, setView] = useState<'orbit' | 'list'>('orbit');
  const [selected, setSelected] = useState<ImportantDate | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dates'],
    queryFn: async () => (await api.get<ListResponse<ImportantDate>>('/dates?limit=200')).data,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const anchor = useMemo(() => items.find((d) => d.isAnchor), [items]);
  const upcoming = useMemo(() => byUpcoming(items.filter((d) => !d.isAnchor)), [items]);
  const nextUp = useMemo(() => nextAhead(items.filter((d) => !d.isAnchor)), [items]);

  if (isLoading) return <Loading message="counting the days…" />;
  if (isError) {
    return <ErrorState message={errorMessage(error, 'Could not load the dates')} onRetry={refetch} />;
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#191325] text-[#f2e8dd]">
      {/* dusk */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(90% 60% at 50% -10%, rgba(230,187,106,0.16), transparent 60%),' +
            'radial-gradient(70% 50% at 50% 110%, rgba(120,80,160,0.22), transparent 65%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-5 pb-28 pt-28 sm:px-8">
        <DaysTogether anchor={anchor} />

        {!items.length ? (
          <Empty
            title="No dates yet"
            hint="Add the day you met and everything starts counting from there."
            action={
              <Link
                to="/admin/dates?new=1"
                className="rounded-full border border-current/25 px-5 py-2.5 text-sm transition-colors hover:border-current"
              >
                Add the first date
              </Link>
            }
          />
        ) : (
          <>
            {nextUp && <NextUp date={nextUp} onSelect={() => setSelected(nextUp)} />}

            <div className="mb-6 mt-16 flex items-center justify-center gap-1.5">
              {(['orbit', 'list'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm capitalize transition-colors',
                    view === v
                      ? 'bg-[var(--accent)] text-[#191325]'
                      : 'opacity-45 hover:opacity-90'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {view === 'orbit' ? (
                <motion.div
                  key="orbit"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: DUR.base, ease: EASE.soft }}
                >
                  <Orbit dates={upcoming} nextUp={nextUp} onSelect={setSelected} />
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: DUR.base, ease: EASE.soft }}
                >
                  <DateList dates={upcoming} onSelect={setSelected} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {items.length > 0 && (
          <div className="mt-16 flex flex-col items-center gap-5">
            <Cat pose="point" mood="happy" size={80} />
            <Link
              to="/admin/dates?new=1"
              className="inline-flex items-center gap-2 rounded-full border border-current/20 px-5 py-2.5 text-sm opacity-55 transition-all hover:gap-3 hover:opacity-100"
            >
              <Icon name="plus" size={14} />
              Add a date
            </Link>
          </div>
        )}
      </div>

      <DateDetail date={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* ── the counter everything hangs off ─────────────────────────── */

function DaysTogether({ anchor }: { anchor?: ImportantDate }) {
  const days = anchor ? wholeDaysBetween(new Date(anchor.date), new Date()) : null;

  return (
    <motion.header
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.scene, ease: EASE.soft }}
      className="mb-16 text-center"
    >
      <p className="text-[0.7rem] uppercase tracking-[0.24em] opacity-40">Important Dates</p>

      {days !== null && anchor ? (
        <>
          <p className="mt-5 font-display text-[clamp(3.4rem,14vw,7rem)] leading-[0.9] tabular-nums">
            {days.toLocaleString()}
          </p>
          <p className="mt-2 font-hand text-3xl opacity-70">days together</p>
          <p className="mt-3 text-sm opacity-40">since {formatDate(anchor.date)}</p>
        </>
      ) : (
        <>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,7vw,3.6rem)] leading-none">
            Important Dates
          </h1>
          <p className="mt-3 text-sm opacity-45">
            Mark one date as the anchor in the admin and the counter starts here.
          </p>
        </>
      )}
    </motion.header>
  );
}

/* ── the next thing coming ────────────────────────────────────── */

function NextUp({ date, onSelect }: { date: ImportantDate; onSelect: () => void }) {
  const target = useMemo(() => nextOccurrenceOf(date), [date]);
  const p = useCountdown(target);
  const [celebrated, setCelebrated] = useState(false);
  const years = ordinalYears(date, target);

  // If a countdown reaches zero while she is watching, mark the moment.
  useEffect(() => {
    if (p.total <= 0 && p.total > -2000 && !celebrated) setCelebrated(true);
  }, [p.total, celebrated]);

  return (
    <motion.button
      onClick={onSelect}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, ease: EASE.soft, delay: 0.15 }}
      className="relative mx-auto block w-full max-w-lg rounded-3xl border border-current/12 bg-black/20 px-6 py-7 backdrop-blur-sm transition-colors hover:border-current/25"
    >
      <p className="flex items-center justify-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] opacity-45">
        <Icon name={(date.icon as IconName) ?? 'heart'} size={12} />
        next up
      </p>
      {/* The ordinal trails the title: "Her birthday · 27th" reads properly for
          any wording, where "27th Her birthday" does not. */}
      <p className="mt-2 font-display text-2xl">
        {date.title}
        {years && (
          <span className="opacity-40"> · {years}
            {ordinalSuffix(years)}
          </span>
        )}
      </p>
      <Countdown target={target} className="mt-5" />

      <AnimatePresence>
        {celebrated && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 font-hand text-2xl text-[var(--accent)]"
          >
            it's today
          </motion.p>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ── the plain list ───────────────────────────────────────────── */

function DateList({
  dates,
  onSelect,
}: {
  dates: ImportantDate[];
  onSelect: (d: ImportantDate) => void;
}) {
  const now = new Date();
  return (
    <ul className="mx-auto max-w-2xl space-y-2">
      {dates.map((d, i) => {
        const next = nextOccurrenceOf(d, now);
        const days = wholeDaysBetween(now, next);
        return (
          <motion.li
            key={d.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: DUR.base, ease: EASE.soft, delay: i * 0.04 }}
          >
            <button
              onClick={() => onSelect(d)}
              className="flex w-full items-center gap-4 rounded-2xl border border-current/8 bg-black/15 px-5 py-4 text-left transition-colors hover:border-current/20"
            >
              <Icon name={(d.icon as IconName) ?? 'heart'} size={19} className="opacity-70" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{d.title}</span>
                <span className="block text-xs opacity-40">
                  {formatDate(next)}
                  {d.recurrence === 'yearly' && ' · every year'}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-xs tabular-nums opacity-70">
                {days === 0 ? 'today' : days > 0 ? `in ${days}d` : `${-days}d ago`}
              </span>
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}

/* ── detail ───────────────────────────────────────────────────── */

function DateDetail({ date, onClose }: { date: ImportantDate | null; onClose: () => void }) {
  const { attributionFor } = usePeople();
  if (!date) return null;
  const next = nextOccurrenceOf(date);

  return (
    <Modal
      open={!!date}
      onClose={onClose}
      className="max-w-md border border-white/10 bg-[#1d1630] text-[#f2e8dd]"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full p-2 opacity-40 transition-opacity hover:opacity-90"
      >
        <Icon name="close" size={16} />
      </button>

      <div className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] opacity-45">
        <Icon name={(date.icon as IconName) ?? 'heart'} size={13} />
        {formatDate(date.date)}
        {date.recurrence === 'yearly' && ' · every year'}
      </div>

      <h2 className="mt-2 font-display text-3xl leading-tight">{date.title}</h2>

      {date.location && (
        <p className="mt-2 flex items-center gap-1.5 text-sm opacity-55">
          <Icon name="pin" size={13} />
          {date.location}
        </p>
      )}

      <Countdown target={next} className="my-7" />

      {date.description && <p className="opacity-75">{date.description}</p>}
      {date.message && <p className="mt-4 font-hand text-2xl opacity-85">{date.message}</p>}

      {date.photo?.url && (
        <img
          src={mediaUrl(date.photo.url)}
          alt={date.photo.alt ?? ''}
          loading="lazy"
          className="mt-5 w-full rounded-xl border border-white/10 object-cover"
        />
      )}

      <p className="mt-6 text-xs uppercase tracking-[0.16em] opacity-35">
        {attributionFor(date.createdBy)}
      </p>
    </Modal>
  );
}
