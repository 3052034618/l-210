import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Equipment, EquipmentCategory } from '../types';
import { mockEquipment } from '../data/mockData';
import { generateId, generateEquipmentCode } from '../utils/idGenerator';

interface EquipmentState {
  equipment: Equipment[];
  addEquipment: (eq: Omit<Equipment, 'id' | 'code' | 'borrowCount'>) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  getEquipmentById: (id: string) => Equipment | undefined;
  getEquipmentByCode: (code: string) => Equipment | undefined;
  getEquipmentByCategory: (category: EquipmentCategory) => Equipment[];
  updateBorrowCount: (id: string) => void;
  replaceAll: (equipment: Equipment[]) => void;
}

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      equipment: mockEquipment,

      addEquipment: (eq) => {
        const { equipment } = get();
        const existingCodes = equipment.map((e) => e.code);
        const code = generateEquipmentCode(eq.category, existingCodes);
        const newEquipment: Equipment = {
          ...eq,
          id: generateId(),
          code,
          borrowCount: 0,
        };
        set({ equipment: [...equipment, newEquipment] });
      },

      updateEquipment: (id, updates) => {
        const { equipment } = get();
        set({
          equipment: equipment.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        });
      },

      deleteEquipment: (id) => {
        const { equipment } = get();
        set({ equipment: equipment.filter((e) => e.id !== id) });
      },

      getEquipmentById: (id) => {
        const { equipment } = get();
        return equipment.find((e) => e.id === id);
      },

      getEquipmentByCode: (code) => {
        const { equipment } = get();
        return equipment.find((e) => e.code === code);
      },

      getEquipmentByCategory: (category) => {
        const { equipment } = get();
        return equipment.filter((e) => e.category === category);
      },

      updateBorrowCount: (id) => {
        const { equipment } = get();
        set({
          equipment: equipment.map((e) =>
            e.id === id ? { ...e, borrowCount: e.borrowCount + 1 } : e
          ),
        });
      },

      replaceAll: (equipment) => {
        set({ equipment });
      },
    }),
    {
      name: 'equipment-storage',
    }
  )
);
