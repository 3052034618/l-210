import type { Equipment, BorrowRecord, DamageRecord } from '../types';
import { CATEGORY_LABELS, BORROW_STATUS_LABELS, DAMAGE_STATUS_LABELS } from '../types';
import { formatDate } from './dateUtils';

const toCSV = (rows: string[][]): string => {
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
};

const downloadCSV = (csv: string, filename: string): void => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportInventory = (equipment: Equipment[], filename = '期末盘点表.csv'): void => {
  const headers = [
    '器材编号',
    '器材名称',
    '分类',
    '规格',
    '总数量',
    '可用数量',
    '状态',
    '存放位置',
    '采购日期',
    '借用次数',
    '备注',
  ];

  const rows = equipment.map((eq) => [
    eq.code,
    eq.name,
    CATEGORY_LABELS[eq.category],
    eq.specification,
    eq.totalQuantity.toString(),
    eq.availableQuantity.toString(),
    eq.status === 'available'
      ? '在库'
      : eq.status === 'borrowed'
      ? '借出'
      : eq.status === 'repairing'
      ? '维修中'
      : '已报废',
    eq.location,
    formatDate(eq.purchaseDate),
    eq.borrowCount.toString(),
    eq.remark,
  ]);

  const csv = toCSV([headers, ...rows]);
  downloadCSV(csv, filename);
};

export const exportBorrowHistory = (records: BorrowRecord[], filename = '借用历史.csv'): void => {
  const headers = [
    '记录编号',
    '器材编号',
    '器材名称',
    '借用数量',
    '借用人类型',
    '班级',
    '借用人',
    '借出日期',
    '应还日期',
    '归还日期',
    '已归还数量',
    '状态',
    '数量差异',
    '备注',
  ];

  const rows = records.map((record) => [
    record.id,
    record.equipmentCode,
    record.equipmentName,
    record.quantity.toString(),
    record.borrowerType === 'class' ? '班级' : '个人',
    record.className,
    record.borrowerName,
    formatDate(record.borrowDate),
    formatDate(record.dueDate),
    record.returnDate ? formatDate(record.returnDate) : '',
    record.returnedQuantity.toString(),
    BORROW_STATUS_LABELS[record.status],
    record.quantityDiff.toString(),
    record.remark,
  ]);

  const csv = toCSV([headers, ...rows]);
  downloadCSV(csv, filename);
};

export const exportDamageRecords = (records: DamageRecord[], filename = '损坏记录.csv'): void => {
  const headers = [
    '记录编号',
    '器材名称',
    '发现日期',
    '损坏类型',
    '损坏描述',
    '处理状态',
    '处理人',
    '处理日期',
    '处理结果',
  ];

  const rows = records.map((record) => [
    record.id,
    record.equipmentName,
    formatDate(record.damageDate),
    record.damageType === 'minor' ? '轻微损坏' : record.damageType === 'serious' ? '严重损坏' : '报废',
    record.description,
    DAMAGE_STATUS_LABELS[record.status],
    record.handler,
    record.handleDate ? formatDate(record.handleDate) : '',
    record.handleResult,
  ]);

  const csv = toCSV([headers, ...rows]);
  downloadCSV(csv, filename);
};

export const exportPurchaseList = (items: { equipment: Equipment; suggestQuantity: number; reason: string }[], filename = '补采购清单.csv'): void => {
  const headers = ['器材编号', '器材名称', '分类', '当前库存', '建议采购数量', '采购原因'];

  const rows = items.map((item) => [
    item.equipment.code,
    item.equipment.name,
    CATEGORY_LABELS[item.equipment.category],
    item.equipment.availableQuantity.toString(),
    item.suggestQuantity.toString(),
    item.reason,
  ]);

  const csv = toCSV([headers, ...rows]);
  downloadCSV(csv, filename);
};
