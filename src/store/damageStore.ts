import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DamageRecord, DamageStatus } from '../types';
import { mockDamageRecords } from '../data/mockData';
import { generateId } from '../utils/idGenerator';
import { getToday } from '../utils/dateUtils';

interface DamageState {
  records: DamageRecord[];
  addRecord: (record: Omit<DamageRecord, 'id' | 'status'> & { photoUrls?: string[] }) => void;
  updateRecord: (id: string, updates: Partial<DamageRecord>) => void;
  updateStatus: (id: string, status: DamageStatus, handler?: string, handleResult?: string) => void;
  getRecordsByEquipment: (equipmentId: string) => DamageRecord[];
  getRecordsByStatus: (status: DamageStatus) => DamageRecord[];
  getPendingCount: () => number;
  replaceAll: (records: DamageRecord[]) => void;
}

export const useDamageStore = create<DamageState>()(
  persist(
    (set, get) => ({
      records: mockDamageRecords,

      addRecord: (record) => {
        const { records } = get();
        const newRecord: DamageRecord = {
          ...record,
          photoUrls: record.photoUrls || [],
          id: generateId(),
          status: 'pending',
        };
        set({ records: [newRecord, ...records] });
      },

      updateRecord: (id, updates) => {
        const { records } = get();
        set({
          records: records.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        });
      },

      updateStatus: (id, status, handler, handleResult) => {
        const { records } = get();
        set({
          records: records.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  handler: handler || r.handler,
                  handleResult: handleResult || r.handleResult,
                  handleDate:
                    status === 'fixed' || status === 'scrapped'
                      ? getToday()
                      : r.handleDate,
                }
              : r
          ),
        });
      },

      getRecordsByEquipment: (equipmentId) => {
        const { records } = get();
        return records.filter((r) => r.equipmentId === equipmentId);
      },

      getRecordsByStatus: (status) => {
        const { records } = get();
        return records.filter((r) => r.status === status);
      },

      getPendingCount: () => {
        const { records } = get();
        return records.filter((r) => r.status === 'pending').length;
      },

      replaceAll: (records) => {
        set({ records });
      },
    }),
    {
      name: 'damage-storage',
    }
  )
);
