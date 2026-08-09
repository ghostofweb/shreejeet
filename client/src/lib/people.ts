import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { Author, Role } from './types';

export interface Person {
  role: Role;
  displayName: string;
  avatarUrl: string | null;
}

/** Both people's names, cached for the session — used all over for attribution. */
export function usePeople() {
  const { data } = useQuery({
    queryKey: ['people'],
    queryFn: async () => (await api.get<{ items: Person[] }>('/people')).data,
    staleTime: 60 * 60 * 1000,
  });

  const byRole = (role: Role) => data?.items.find((p) => p.role === role);

  return {
    people: data?.items ?? [],
    nameOf: (role: Role) => byRole(role)?.displayName ?? (role === 'her' ? 'her' : 'him'),
    /** "added by Shree" / "added together" — real names once they're loaded. */
    attributionFor: (by: Author) => {
      if (by === 'both') return 'added together';
      const name = byRole(by === 'her' ? 'her' : 'me')?.displayName;
      return name ? `added by ${name}` : by === 'her' ? 'added by her' : 'added by him';
    },
  };
}
