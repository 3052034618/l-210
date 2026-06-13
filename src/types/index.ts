export type EquipmentCategory = 'basketball' | 'rope' | 'stopwatch' | 'training';

export type EquipmentStatus = 'available' | 'borrowed' | 'repairing' | 'scrapped';

export type BorrowStatus = 'borrowing' | 'returned' | 'partial' | 'overdue';

export type DamageStatus = 'pending' | 'repairing' | 'fixed' | 'scrapped';

export type DamageType = 'minor' | 'serious' | 'scrapped';

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  specification: string;
  totalQuantity: number;
  availableQuantity: number;
  status: EquipmentStatus;
  location: string;
  purchaseDate: string;
  remark: string;
  imageUrl: string;
  borrowCount: number;
}

export interface BorrowRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  quantity: number;
  borrowerType: 'class' | 'individual';
  className: string;
  borrowerName: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  returnedQuantity: number;
  status: BorrowStatus;
  quantityDiff: number;
  remark: string;
}

export interface DamageRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  borrowRecordId?: string;
  damageDate: string;
  damageType: DamageType;
  description: string;
  photoUrl: string;
  status: DamageStatus;
  handler: string;
  handleDate?: string;
  handleResult: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
}

export interface AppSettings {
  maxBorrowDays: number;
  schoolName: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  basketball: '篮球',
  rope: '跳绳',
  stopwatch: '秒表',
  training: '训练器械',
};

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: '在库',
  borrowed: '借出',
  repairing: '维修中',
  scrapped: '已报废',
};

export const BORROW_STATUS_LABELS: Record<BorrowStatus, string> = {
  borrowing: '借出中',
  returned: '已归还',
  partial: '部分归还',
  overdue: '已逾期',
};

export const DAMAGE_STATUS_LABELS: Record<DamageStatus, string> = {
  pending: '待处理',
  repairing: '维修中',
  fixed: '已修复',
  scrapped: '已报废',
};

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  minor: '轻微损坏',
  serious: '严重损坏',
  scrapped: '报废',
};
