import { create } from 'zustand';
import { api, refreshOnce, setAccessToken } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  status: 'loading' | 'authed' | 'anon';
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  async signIn(email, password) {
    const { data } = await api.post<{ user: User; accessToken: string }>('/auth/login', {
      email,
      password,
    });
    setAccessToken(data.accessToken);
    set({ user: data.user, status: 'authed' });
  },

  async signOut() {
    await api.post('/auth/logout').catch(() => undefined);
    setAccessToken(null);
    set({ user: null, status: 'anon' });
  },

  /** Called once on boot: turns the refresh cookie back into a live session. */
  async restore() {
    const token = await refreshOnce();
    if (!token) {
      set({ user: null, status: 'anon' });
      return;
    }
    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      set({ user: data.user, status: 'authed' });
    } catch {
      setAccessToken(null);
      set({ user: null, status: 'anon' });
    }
  },
}));

// The api layer fires this when a refresh finally fails.
if (typeof window !== 'undefined') {
  window.addEventListener('olw:signed-out', () => {
    useAuth.setState({ user: null, status: 'anon' });
  });
}
