import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types';
import { mockSettings } from '../data/mockData';

interface SettingsState extends AppSettings {
  updateSettings: (updates: Partial<AppSettings>) => void;
  replaceAll: (settings: AppSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...mockSettings,

      updateSettings: (updates) => {
        set((state) => ({ ...state, ...updates }));
      },

      replaceAll: (settings) => {
        set(settings);
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
