import { useState } from 'react';
import { Settings, Save, Clock, School } from 'lucide-react';
import { PageHeader } from '../../components/Layout/PageHeader';
import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../store/toastStore';

export const SettingsPage = () => {
  const { schoolName, maxBorrowDays, updateSettings } = useSettingsStore();
  const { showSuccess } = useToast();

  const [formData, setFormData] = useState({
    schoolName,
    maxBorrowDays,
  });

  const handleSave = () => {
    updateSettings(formData);
    showSuccess('设置已保存');
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
            本系统数据存储在本地浏览器中，请定期导出数据备份
          </p>
        </div>
      </div>
    </div>
  );
};
