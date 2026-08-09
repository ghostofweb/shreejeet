import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '@/lib/types';

/**
 * "Who are you?" — chosen on the Reasons gate, remembered across the site so
 * copy can address the right person. Separate from the auth account on purpose:
 * either of them may be signed in on a shared device.
 */
interface IdentityState {
  identity: Role | null;
  setIdentity: (r: Role | null) => void;
}

export const useIdentity = create<IdentityState>()(
  persist(
    (set) => ({
      identity: null,
      setIdentity: (identity) => set({ identity }),
    }),
    { name: 'olw-identity' }
  )
);
