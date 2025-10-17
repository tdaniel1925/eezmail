import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Density = 'comfortable' | 'compact' | 'default';

interface PreferencesStore {
  // UI Preferences
  density: Density;
  language: string;

  // Notification Settings
  desktopNotifications: boolean;
  soundEffects: boolean;
  emailNotifications: boolean;

  // Actions
  setDensity: (density: Density) => void;
  setLanguage: (language: string) => void;
  toggleDesktopNotifications: () => void;
  toggleSoundEffects: () => void;
  toggleEmailNotifications: () => void;
  setPreferences: (
    prefs: Partial<
      Omit<
        PreferencesStore,
        | 'setDensity'
        | 'setLanguage'
        | 'toggleDesktopNotifications'
        | 'toggleSoundEffects'
        | 'toggleEmailNotifications'
        | 'setPreferences'
      >
    >
  ) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      // Initial State
      density: 'default',
      language: 'en',
      desktopNotifications: true,
      soundEffects: true,
      emailNotifications: true,

      // Actions
      setDensity: (density) => set({ density }),

      setLanguage: (language) => set({ language }),

      toggleDesktopNotifications: () =>
        set((state) => ({
          desktopNotifications: !state.desktopNotifications,
        })),

      toggleSoundEffects: () =>
        set((state) => ({
          soundEffects: !state.soundEffects,
        })),

      toggleEmailNotifications: () =>
        set((state) => ({
          emailNotifications: !state.emailNotifications,
        })),

      setPreferences: (prefs) => set(prefs),
    }),
    {
      name: 'preferences-storage',
    }
  )
);
