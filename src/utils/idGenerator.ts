import type { EquipmentCategory } from '../types';

const CATEGORY_PREFIXES: Record<EquipmentCategory, string> = {
  basketball: 'BASK',
  rope: 'ROPE',
  stopwatch: 'TIME',
  training: 'TRAI',
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export const generateEquipmentCode = (
  category: EquipmentCategory,
  existingCodes: string[]
): string => {
  const prefix = CATEGORY_PREFIXES[category];
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}${year}`;

  const existingNumbers = existingCodes
    .filter((code) => code.startsWith(yearPrefix))
    .map((code) => {
      const numStr = code.substring(yearPrefix.length);
      return parseInt(numStr, 10);
    })
    .filter((num) => !isNaN(num));

  const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  const nextNum = (maxNum + 1).toString().padStart(3, '0');

  return `${yearPrefix}${nextNum}`;
};
