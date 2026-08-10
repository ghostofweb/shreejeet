import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { usePeople } from '@/lib/people';
import type { Role } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { Toggle } from '@/components/ui/Field';
import { useSettings, type IntroSettings } from '@/intro/useIntroGate';

/**
 * Arming the birthday intro. Deliberately manual — you want to choose the exact
 * moment it goes live, not have it fire off a date in the background.
 */
export function IntroControls() {
  const qc = useQueryClient();
  const { data } = useSettings();
  const { nameOf } = usePeople();

  const save = useMutation({
    mutationFn: async (patch: Partial<IntroSettings>) => api.patch('/settings', patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const enabled = data?.introEnabled === true;
  const seen = data?.introSeenBy ?? {};

  const replay = (role: Role) =>
    save.mutate({
      introReplayFor: role,
      introSeenBy: { ...seen, [role]: undefined },
    });

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 rounded-2xl border border-white/8 bg-white/[0.03] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-medium">
            <Icon name="flame" size={16} className="opacity-70" />
            The birthday intro
          </h2>
          <p className="mt-1 max-w-md text-sm opacity-45">
            A dark room she searches by candlelight, then the message. Plays once per
            person. Write it in <code className="opacity-70">src/intro/config.ts</code>.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Toggle
          label={enabled ? 'Armed — it will play' : 'Off'}
          checked={enabled}
          onChange={(v) => save.mutate({ introEnabled: v })}
        />
      </div>

      <ul className="mt-4 space-y-2 border-t border-white/8 pt-4">
        {(['her', 'me'] as Role[]).map((role) => (
          <li key={role} className="flex items-center justify-between gap-3 text-sm">
            <span className="opacity-70">{nameOf(role)}</span>
            <span className="flex items-center gap-3">
              <span className="text-xs opacity-35">
                {seen[role] ? `seen ${formatDate(seen[role])}` : 'not seen yet'}
              </span>
              <button
                onClick={() => replay(role)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs opacity-60 transition-all hover:border-[var(--accent)] hover:opacity-100"
              >
                play it again
              </button>
            </span>
          </li>
        ))}
      </ul>

      {enabled && (
        <p className="mt-4 rounded-xl bg-[var(--accent)]/10 px-3 py-2 text-xs opacity-70">
          Next time {nameOf('her')} signs in, the intro is what she sees.
        </p>
      )}
    </motion.section>
  );
}
