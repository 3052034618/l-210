import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BorrowRecord, BorrowStatus } from '../types';
import { mockBorrowRecords } from '../data/mockData';
import { generateId } from '../utils/idGenerator';
import { isOverdue, getToday } from '../utils/dateUtils';

interface BorrowState {
  records: BorrowRecord[];
  addRecord: (record: Omit<BorrowRecord, 'id' | 'status' | 'returnedQuantity' | 'quantityDiff'>) => void;
  returnEquipment: (recordId: string, returnedQuantity: number, quantityDiff: number, remark?: string) => void;
  updateRecordStatus: (id: string, status: BorrowStatus) => void;
  getActiveRecords: () => BorrowRecord[];
  getOverdueRecords: () => BorrowRecord[];
  getRecordsByEquipment: (equipmentId: string) => BorrowRecord[];
  getRecordsByClass: (className: string) => BorrowRecord[];
  getRecordsByBorrower: (borrowerName: string) => BorrowRecord[];
  getAllRecords: () => BorrowRecord[];
  refreshOverdueStatus: () => void;
}

export const useBorrowStore = create<BorrowState>()(
  persist(
    (set, get) => ({
      records: mockBorrowRecords,

      addRecord: (record) => {
        const { records } = get();
        const newRecord: BorrowRecord = {
          ...record,
          id: generateId(),
          status: 'borrowing',
          returnedQuantity: 0,
          quantityDiff: 0,
        };
        set({ records: [newRecord, ...records] });
      },

      returnEquipment: (recordId, returnedQuantity, quantityDiff, remark) => {
        const { records } = get();
        set({
          records: records.map((r) => {
            if (r.id !== recordId) return r;
            const allReturned = returnedQuantity >= r.quantity;
            return {
              ...r,
              returnedQuantity: r.returnedQuantity + returnedQuantity,
              quantityDiff,
              returnDate: getToday(),
              status: allReturned ? 'returned' : 'partial',
              remark: remark || r.remark,
            };
          }),
        });
      },

      updateRecordStatus: (id, status) => {
        const { records } = get();
        set({
          records: records.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        });
      },

      getActiveRecords: () => {
        const { records } = get();
        return records.filter((r) => r.status === 'borrowing' || r.status === 'overdue');
      },

      getOverdueRecords: () => {
        const { records } = get();
        return records.filter(
          (r) => (r.status === 'borrowing' || r.status === 'overdue') && isOverdue(r.dueDate)
        );
      },

      getRecordsByEquipment: (equipmentId) => {
        const { records } = get();
        return records.filter((r) => r.equipmentId === equipmentId);
      },

      getRecordsByClass: (className) => {
        const { records } = get();
        return records.filter((r) => r.className === className);
      },

      getRecordsByBorrower: (borrowerName) => {
        const { records } = get();
        return records.filter((r) => r.borrowerName === borrowerName);
      },

      getAllRecords: () => {
        return get().records;
      },

      refreshOverdueStatus: () => {
        const { records } = get();
        set({
          records: records.map((r) => {
            if (r.status === 'borrowing' && isOverdue(r.dueDate)) {
              return { ...r, status: 'overdue' as BorrowStatus };
            }
            return r;
          }),
        });
      },
    }),
    {
      name: 'borrow-storage',
    }
  )
);
