import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BorrowRecord, BorrowStatus, ReturnDiffDetail } from '../types';
import { mockBorrowRecords } from '../data/mockData';
import { generateId } from '../utils/idGenerator';
import { isOverdue, getToday } from '../utils/dateUtils';

interface BorrowState {
  records: BorrowRecord[];
  addRecord: (record: Omit<BorrowRecord, 'id' | 'status' | 'returnedQuantity' | 'quantityDiff'>) => void;
  returnEquipment: (
    recordId: string,
    returnedQuantity: number,
    quantityDiff: number,
    remark?: string,
    diffDetails?: ReturnDiffDetail[]
  ) => void;
  updateRecordStatus: (id: string, status: BorrowStatus) => void;
  getActiveRecords: () => BorrowRecord[];
  getOverdueRecords: () => BorrowRecord[];
  getRecordsByEquipment: (equipmentId: string) => BorrowRecord[];
  getRecordsByClass: (className: string) => BorrowRecord[];
  getRecordsByBorrower: (borrowerName: string) => BorrowRecord[];
  getAllRecords: () => BorrowRecord[];
  refreshOverdueStatus: () => void;
  getLastBorrowByClass: (className: string) => { equipmentId: string; equipmentName: string; quantity: number }[];
  replaceAll: (records: BorrowRecord[]) => void;
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

      returnEquipment: (recordId, returnedQuantity, quantityDiff, remark, diffDetails) => {
        const { records } = get();
        set({
          records: records.map((r) => {
            if (r.id !== recordId) return r;
            const totalReturned = r.returnedQuantity + returnedQuantity;
            const allReturned = totalReturned >= r.quantity;
            const existingDiffs = r.diffDetails || [];
            return {
              ...r,
              returnedQuantity: totalReturned,
              quantityDiff,
              returnDate: getToday(),
              status: allReturned ? 'returned' : 'partial',
              remark: remark || r.remark,
              diffDetails: diffDetails ? [...existingDiffs, ...diffDetails] : existingDiffs,
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
        return records.filter((r) => 
          r.status === 'borrowing' || r.status === 'overdue' || r.status === 'partial'
        );
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

      getLastBorrowByClass: (className) => {
        const { records } = get();
        const classRecords = records
          .filter((r) => r.borrowerType === 'class' && r.className === className)
          .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());

        if (classRecords.length === 0) return [];

        const lastDate = classRecords[0].borrowDate;
        return classRecords
          .filter((r) => r.borrowDate === lastDate)
          .map((r) => ({
            equipmentId: r.equipmentId,
            equipmentName: r.equipmentName,
            quantity: r.quantity,
          }));
      },

      replaceAll: (records) => {
        set({ records });
      },
    }),
    {
      name: 'borrow-storage',
    }
  )
);
