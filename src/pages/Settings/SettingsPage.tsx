import { useState, useRef } from 'react';
import { Settings, Save, Clock, School, Download, Upload, Database, AlertTriangle, CheckCircle, FileJson } from 'lucide-react';
import { PageHeader } from '../../components/Layout/PageHeader';
import { Modal } from '../../components/Modal/Modal';
import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../store/toastStore';
import { exportBackupToFile, restoreBackupFromFile, applyBackup } from '../../utils/backupUtils';
import type { BackupData } from '../../types';
import { formatDate } from '../../utils/dateUtils';

export const SettingsPage = () => {
  const { schoolName, maxBorrowDays, updateSettings } = useSettingsStore();
  const { showSuccess, showError, showInfo } = useToast();

  const [formData, setFormData] = useState({
    schoolName,
    maxBorrowDays,
  });
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreData, setRestoreData] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings(formData);
    showSuccess('设置已保存');
  };

  const handleBackup = () => {
    exportBackupToFile();
    showSuccess('数据备份导出成功');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await restoreBackupFromFile(file);
      setRestoreData(data);
      showInfo('备份文件读取成功，请确认恢复');
    } catch (err: any) {
      showError(err.message || '备份文件读取失败');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmRestore = () => {
    if (!restoreData) return;
    applyBackup(restoreData);
    showSuccess('数据恢复成功，系统将使用新数据');
    setIsRestoreModalOpen(false);
    setRestoreData(null);
    setFormData({
      schoolName: useSettingsStore.getState().schoolName,
      maxBorrowDays: useSettingsStore.getState().maxBorrowDays,
    });
  };

  return (
    <div>
      <PageHeader
        title="系统设置"
        description="配置系统基础参数"
      />

      <div className="max-w-2xl">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-500" />
            基本设置
          </h3>

          <div className="space-y-6">
            <div>
              <label className="label flex items-center gap-2">
                <School className="w-4 h-4 text-slate-400" />
                学校名称
              </label>
              <input
                className="input"
                value={formData.schoolName}
                onChange={(e) =>
                  setFormData({ ...formData, schoolName: e.target.value })
                }
                placeholder="请输入学校名称"
              />
              <p className="text-xs text-slate-400 mt-1">
                将显示在系统标题和打印单据上
              </p>
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                最长借用天数
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="input w-32"
                  value={formData.maxBorrowDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxBorrowDays: parseInt(e.target.value) || 7,
                    })
                  }
                  min="1"
                  max="30"
                />
                <span className="text-slate-500">天</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                设置器材最长借用天数，超过将自动标记为逾期
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button className="btn-primary" onClick={handleSave}>
              <Save className="w-4 h-4" />
              保存设置
            </button>
          </div>
        </div>

        <div className="card p-6 mt-6">
          <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-500" />
            数据管理
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            定期导出数据备份，换电脑或系统重装后可快速恢复全部数据（含器材库、借还记录和损坏照片）
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              className="flex flex-col items-center gap-2 p-6 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors border-2 border-dashed border-primary-200 hover:border-primary-400"
              onClick={handleBackup}
            >
              <Download className="w-8 h-8 text-primary-600" />
              <span className="font-medium text-slate-800">导出备份</span>
              <span className="text-xs text-slate-500">生成 JSON 备份文件</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 p-6 bg-accent-50 rounded-xl hover:bg-accent-100 transition-colors border-2 border-dashed border-accent-200 hover:border-accent-400"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-accent-600" />
              <span className="font-medium text-slate-800">恢复备份</span>
              <span className="text-xs text-slate-500">从备份文件恢复数据</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {restoreData && !isRestoreModalOpen && (
            <button
              className="mt-4 w-full py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 flex items-center justify-center gap-2"
              onClick={() => setIsRestoreModalOpen(true)}
            >
              <FileJson className="w-4 h-4" />
              已选择备份文件：{restoreData.equipment.length} 个器材 / {restoreData.borrowRecords.length} 条记录，点击确认恢复
            </button>
          )}
        </div>

        <div className="card p-6 mt-6">
          <h3 className="font-semibold text-slate-800 mb-4">使用说明</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </span>
              <p>在【器材库】中录入器材信息，系统将自动生成器材编号</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </span>
              <p>在【借出登记】中选择班级或个人，批量登记器材借出</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </span>
              <p>在【归还验收】中扫描器材编号或手动查找，完成归还</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                4
              </span>
              <p>在【班级统计】中查看借用数据、热门器材和补采购建议</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                5
              </span>
              <p>在【损坏处理】中登记损坏器材、跟踪维修进度</p>
            </div>
          </div>
        </div>

        <div className="card p-6 mt-6 bg-gradient-to-br from-slate-50 to-white">
          <h3 className="font-semibold text-slate-800 mb-2">关于系统</h3>
          <p className="text-sm text-slate-500">
            智慧体育器材借还管理系统 v1.0.0
          </p>
          <p className="text-xs text-slate-400 mt-2">
            本系统数据存储在本地，请定期导出数据备份
          </p>
        </div>
      </div>

      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="确认恢复备份"
        size="lg"
        footer={
          <div className="flex justify-between">
            <button
              className="btn-secondary"
              onClick={() => setIsRestoreModalOpen(false)}
            >
              取消
            </button>
            <button className="btn-accent" onClick={handleConfirmRestore}>
              <CheckCircle className="w-4 h-4" />
              确认恢复
            </button>
          </div>
        }
      >
        {restoreData && (
          <div className="space-y-5">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">恢复操作将覆盖现有数据</p>
                <p className="text-sm text-red-600 mt-1">
                  此操作不可撤销，建议先导出当前数据备份
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileJson className="w-4 h-4" />
                备份文件信息
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">导出时间</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {formatDate(new Date(restoreData.exportDate))}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">备份版本</p>
                  <p className="font-medium text-slate-800 mt-1">{restoreData.version}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">器材数量</p>
                  <p className="font-medium text-primary-600 mt-1">
                    {restoreData.equipment.length} 个
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">借还记录</p>
                  <p className="font-medium text-primary-600 mt-1">
                    {restoreData.borrowRecords.length} 条
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">损坏记录</p>
                  <p className="font-medium text-primary-600 mt-1">
                    {restoreData.damageRecords.length} 条
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs">学校名称</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {restoreData.settings.schoolName || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
