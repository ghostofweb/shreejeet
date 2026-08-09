import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import type { AdminStats } from '@/lib/types';
import { DUR, EASE, revealUp, stagger } from '@/lib/motion';
import { Cat } from '@/components/Cat';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/auth';

const ROWS = [
  { key: 'memories', icon: '❤️', label: 'Memories', to: '/admin/story' },
  { key: 'stars', icon: '⭐', label: 'Universe Stars', to: '/admin/stars' },
  { key: 'reasons', icon: '🌹', label: 'Reasons', to: '/admin/reasons' },
  { key: 'letters', icon: '💌', label: 'Open When', to: '/admin/letters' },
  { key: 'confessions', icon: '🫣', label: 'Confessions', to: '/admin/confessions' },
  { key: 'dates', icon: '🗓️', label: 'Important Dates', to: '/admin/dates' },
] as const;

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.get<AdminStats>('/admin/stats')).data,
  });

  const total = data ? Object.values(data).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-24 sm:px-8">
      <motion.div variants={stagger(0.07)} initial="hidden" animate="show">
        <motion.header variants={revealUp} className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm opacity-40">signed in as {user?.displayName}</p>
            <h1 className="mt-1 font-display text-4xl">🐈 Admin</h1>
            <p className="mt-2 font-hand text-xl opacity-50">
              {total > 0
                ? `${total} things in our world so far`
                : 'nothing here yet — let’s put something in'}
            </p>
          </div>
          <Cat pose="sit" mood="happy" size={82} />
        </motion.header>

        <motion.ul variants={stagger(0.05)} className="mb-10 space-y-1.5">
          {ROWS.map((row) => (
            <motion.li key={row.key} variants={revealUp}>
              <Link
                to={row.to}
                className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 transition-all duration-300 ease-soft hover:border-[var(--accent)]/40 hover:bg-white/[0.06]"
              >
                <span className="text-xl">{row.icon}</span>
                <span className="flex-1 font-medium">{row.label}</span>
                <span className="font-display text-2xl tabular-nums opacity-70">
                  {isLoading ? (
                    <span className="inline-block h-6 w-8 animate-breathe rounded bg-white/10" />
                  ) : (
                    (data?.[row.key] ?? 0)
                  )}
                </span>
                <span className="opacity-20 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-60">
                  →
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div variants={revealUp} className="flex flex-wrap gap-2">
          {ROWS.map((row) => (
            <Link
              key={row.key}
              to={`${row.to}?new=1`}
              className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm opacity-60 transition-all duration-200 hover:border-[var(--accent)] hover:opacity-100"
            >
              + {row.label}
            </Link>
          ))}
        </motion.div>

        <motion.div
          variants={revealUp}
          className="mt-14 flex items-center justify-between border-t border-white/8 pt-6 text-sm"
        >
          <Link to="/story" className="opacity-50 transition-opacity hover:opacity-100">
            ← back to our world
          </Link>
          <button onClick={signOut} className="opacity-40 transition-opacity hover:opacity-90">
            sign out
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
