import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Role } from '@/lib/types';
import { useAuth } from '@/store/auth';

export interface IntroSettings {
  /** Armed by you in the admin. Off by default so it can never surprise anyone. */
  introEnabled?: boolean;
  /** When each person last got through it. */
  introSeenBy?: Partial<Record<Role, string>>;
  /** Set by "play it again" — forces one more run for that person. */
  introReplayFor?: Role | null;
}

export function useSettings() {
  const status = useAuth((s) => s.status);
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<IntroSettings>('/settings')).data,
    // Settings are behind auth. Firing this before the session is restored gets
    // a 401, and the query would then sit on that error and never retry.
    enabled: status === 'authed',
    staleTime: 30_000,
  });
}

/**
 * Decides whether the intro should play right now.
 *
 * It plays when it is armed, and either this person has never seen it or you
 * have explicitly queued a replay for them. Anything unknown means "don't" —
 * an intro that fires unexpectedly is worse than one that never fires.
 */
export function useIntroGate() {
  const qc = useQueryClient();
  const role = useAuth((s) => s.user?.role);
  const { data, isLoading } = useSettings();

  const mark = useMutation({
    mutationFn: async (patch: Partial<IntroSettings>) => api.patch('/settings', patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const shouldPlay =
    !isLoading &&
    !!data &&
    !!role &&
    data?.introEnabled === true &&
    (data?.introReplayFor === role || !data?.introSeenBy?.[role]);

  const finish = useCallback(() => {
    if (!role) return;
    mark.mutate({
      introSeenBy: { ...(data?.introSeenBy ?? {}), [role]: new Date().toISOString() },
      introReplayFor: null,
    });
  }, [role, data, mark]);

  return { shouldPlay, finish, loading: isLoading };
}
