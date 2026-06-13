import type { BackupData } from '../types';
import { useEquipmentStore } from '../store/equipmentStore';
import { useBorrowStore } from '../store/borrowStore';
import { useDamageStore } from '../store/damageStore';
import { useSettingsStore } from '../store/settingsStore';

export const BACKUP_VERSION = '1.0.0';

export const createBackup = (): BackupData => {
  return {
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    equipment: useEquipmentStore.getState().equipment,
    borrowRecords: useBorrowStore.getState().records,
    damageRecords: useDamageStore.getState().records,
    settings: {
      maxBorrowDays: useSettingsStore.getState().maxBorrowDays,
      schoolName: useSettingsStore.getState().schoolName,
    },
  };
};

export const exportBackupToFile = () => {
  const backup = createBackup();
  const dataStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `器材管理系统备份_${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const restoreBackupFromFile = (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as BackupData;
        if (!data.version || !data.equipment || !data.borrowRecords || !data.damageRecords) {
          reject(new Error('备份文件格式不正确'));
          return;
        }
        resolve(data);
      } catch (err) {
        reject(new Error('备份文件解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};

export const applyBackup = (backup: BackupData) => {
  useEquipmentStore.getState().replaceAll(backup.equipment);
  useBorrowStore.getState().replaceAll(backup.borrowRecords);
  useDamageStore.getState().replaceAll(backup.damageRecords);
  useSettingsStore.getState().replaceAll(backup.settings);
};
