import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

interface UserState {
  profile: UserProfile | null;
  hasOnboarded: boolean;
  setProfile: (p: UserProfile) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  setHasOnboarded: (v: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      hasOnboarded: false,

      setProfile: (p) => set({ profile: p }),

      updateProfile: (p) =>
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...p } : null,
        })),

      setHasOnboarded: (v) => set({ hasOnboarded: v }),

      logout: () => set({ profile: null }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
