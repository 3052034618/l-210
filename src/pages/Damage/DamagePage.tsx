import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Wrench,
  CheckCircle,
  Trash2,
  Clock,
  Search,
  Camera,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../../components/Layout/PageHeader';
import { Modal } from '../../components/Modal/Modal';
import { ImageUpload, ImageViewer } from '../../components/Form/ImageUpload';
import { useDamageStore } from '../../store/damageStore';
import { useEquipmentStore } from '../../store/equipmentStore';
import { useToast } from '../../store/toastStore';
import type { DamageStatus, DamageType } from '../../types';
import { DAMAGE_STATUS_LABELS, DAMAGE_TYPE_LABELS } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { exportDamageRecords } from '../../utils/exportUtils';
import { Download } from 'lucide-react';

export const DamagePage = () => {
  const { records, addRecord, updateStatus, getPendingCount } = useDamageStore();
  const { equipment } = useEquipmentStore();
  const { showSuccess, showError } = useToast();

  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<DamageStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<(typeof records)[0] | null>(null);

  const [newDamage, setNewDamage] = useState({
    equipmentId: '',
    damageType: 'minor' as DamageType,
    description: '',
    photoUrl: '',
    photoUrls: [] as string[],
    handler: '',
  });

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.equipmentName.toLowerCase().includes(searchText.toLowerCase()) ||
        r.description.includes(searchText);
      const matchStatus = selectedStatus === 'all' || r.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [records, searchText, selectedStatus]);

  const pendingCount = getPendingCount();
  const repairingCount = records.filter((r) => r.status === 'repairing').length;
  const fixedCount = records.filter((r) => r.status === 'fixed').length;
  const scrappedCount = records.filter((r) => r.status === 'scrapped').length;

  const handleAddDamage = () => {
    if (!newDamage.equipmentId) {
      showError('请选择器材');
      return;
    }
    if (!newDamage.description.trim()) {
      showError('请填写损坏描述');
      return;
    }

    const eq = equipment.find((e) => e.id === newDamage.equipmentId);
    if (!eq) {
      showError('器材不存在');
      return;
    }

    addRecord({
      equipmentId: newDamage.equipmentId,
      equipmentName: eq.name,
      damageDate: formatDate(new Date()),
      damageType: newDamage.damageType,
      description: newDamage.description,
      photoUrl: newDamage.photoUrl,
      photoUrls: newDamage.photoUrls,
      handler: newDamage.handler,
      handleResult: '',
    });

    showSuccess('损坏记录已添加');
    setIsAddModalOpen(false);
    setNewDamage({
      equipmentId: '',
      damageType: 'minor',
      description: '',
      photoUrl: '',
      photoUrls: [],
      handler: '',
    });
  };

  const handleUpdateStatus = (id: string, status: DamageStatus) => {
    const handler = prompt('请输入处理人姓名：', '');
    if (handler === null) return;

    let result = '';
    if (status === 'fixed') {
      result = prompt('请输入修复结果：', '已修复，可正常使用') || '已修复';
    } else if (status === 'scrapped') {
      result = prompt('请输入报废说明：', '无法修复，作报废处理') || '已报废';
    }

    updateStatus(id, status, handler || '管理员', result);
    showSuccess('状态已更新');
    setIsDetailModalOpen(false);
  };

  const handleViewDetail = (record: (typeof records)[0]) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleExport = () => {
    exportDamageRecords(records, `${formatDate(new Date())}_损坏记录.csv`);
    showSuccess('导出成功');
  };

  const getStatusColorClass = (status: DamageStatus) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'repairing':
        return 'badge-info';
      case 'fixed':
        return 'badge-success';
      case 'scrapped':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  };

  const getDamageTypeColorClass = (type: DamageType) => {
    switch (type) {
      case 'minor':
        return 'text-yellow-600 bg-yellow-50';
      case 'serious':
        return 'text-orange-600 bg-orange-50';
      case 'scrapped':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const statusTabs: { value: DamageStatus | 'all'; label: string; count: number }[] = [
    { value: 'all', label: '全部', count: records.length },
    { value: 'pending', label: '待处理', count: pendingCount },
    { value: 'repairing', label: '维修中', count: repairingCount },
    { value: 'fixed', label: '已修复', count: fixedCount },
    { value: 'scrapped', label: '已报废', count: scrappedCount },
  ];

  return (
    <div>
      <PageHeader
        title="损坏处理"
        description="管理器材损坏记录和维修处理"
        actions={
          <>
            <button className="btn-secondary" onClick={handleExport}>
              <Download className="w-4 h-4" />
              导出记录
            </button>
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4" />
              登记损坏
            </button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
            <p className="text-sm text-slate-500">待处理</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Wrench className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{repairingCount}</p>
            <p className="text-sm text-slate-500">维修中</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{fixedCount}</p>
            <p className="text-sm text-slate-500">已修复</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-xl">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{scrappedCount}</p>
            <p className="text-sm text-slate-500">已报废</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="input pl-9"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索器材名称或描述..."
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedStatus === tab.value
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className="ml-1 text-xs opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无损坏记录</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => handleViewDetail(record)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getDamageTypeColorClass(
                      record.damageType
                    )}`}
                  >
                    <AlertTriangle className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-slate-800">
                        {record.equipmentName}
                      </h4>
                      <span className={getStatusColorClass(record.status)}>
                        {DAMAGE_STATUS_LABELS[record.status]}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getDamageTypeColorClass(
                          record.damageType
                        )}`}
                      >
                        {DAMAGE_TYPE_LABELS[record.damageType]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {record.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>发现日期：{formatDate(record.damageDate)}</span>
                      {record.handler && <span>处理人：{record.handler}</span>}
                      {record.handleDate && (
                        <span>处理日期：{formatDate(record.handleDate)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {record.status === 'pending' && (
                      <>
                        <button
                          className="btn-ghost text-sm px-3 py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(record.id, 'repairing');
                          }}
                        >
                          <Wrench className="w-4 h-4" />
                          送修
                        </button>
                        <button
                          className="btn-danger text-sm px-3 py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(record.id, 'scrapped');
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          报废
                        </button>
                      </>
                    )}
                    {record.status === 'repairing' && (
                      <button
                        className="btn-primary text-sm px-3 py-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(record.id, 'fixed');
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        修复完成
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="登记损坏"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              取消
            </button>
            <button className="btn-primary" onClick={handleAddDamage}>
              提交
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">选择器材 *</label>
            <select
              className="input"
              value={newDamage.equipmentId}
              onChange={(e) =>
                setNewDamage({ ...newDamage, equipmentId: e.target.value })
              }
            >
              <option value="">请选择器材</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.code}) - 库存 {eq.availableQuantity}/{eq.totalQuantity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">损坏程度 *</label>
            <div className="flex gap-3">
              {(['minor', 'serious', 'scrapped'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewDamage({ ...newDamage, damageType: type })}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    newDamage.damageType === type
                      ? getDamageTypeColorClass(type) + ' border-current'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {DAMAGE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">损坏描述 *</label>
            <textarea
              className="input min-h-[100px]"
              value={newDamage.description}
              onChange={(e) =>
                setNewDamage({ ...newDamage, description: e.target.value })
              }
              placeholder="请详细描述损坏情况..."
            />
          </div>

          <div>
            <label className="label">处理人</label>
            <input
              className="input"
              value={newDamage.handler}
              onChange={(e) =>
                setNewDamage({ ...newDamage, handler: e.target.value })
              }
              placeholder="请输入处理人姓名（可选）"
            />
          </div>

          <div>
            <label className="label">损坏照片</label>
            <ImageUpload
              images={newDamage.photoUrls}
              onChange={(images) => setNewDamage({ ...newDamage, photoUrls: images })}
              maxImages={5}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="损坏详情"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getDamageTypeColorClass(
                  selectedRecord.damageType
                )}`}
              >
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedRecord.equipmentName}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={getStatusColorClass(selectedRecord.status)}>
                    {DAMAGE_STATUS_LABELS[selectedRecord.status]}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${getDamageTypeColorClass(
                      selectedRecord.damageType
                    )}`}
                  >
                    {DAMAGE_TYPE_LABELS[selectedRecord.damageType]}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-700 mb-2">损坏描述</h4>
              <div className="bg-slate-50 rounded-lg p-4 text-slate-600">
                {selectedRecord.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">发现日期</p>
                <p className="font-medium text-slate-800 mt-1">
                  {formatDate(selectedRecord.damageDate)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">处理人</p>
                <p className="font-medium text-slate-800 mt-1">
                  {selectedRecord.handler || '-'}
                </p>
              </div>
              {selectedRecord.handleDate && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">处理日期</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {formatDate(selectedRecord.handleDate)}
                  </p>
                </div>
              )}
            </div>

            {selectedRecord.handleResult && (
              <div>
                <h4 className="font-medium text-slate-700 mb-2">处理结果</h4>
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-green-700">
                  {selectedRecord.handleResult}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium text-slate-700 mb-2">现场照片</h4>
              <ImageViewer images={selectedRecord.photoUrls || []} />
            </div>

            {selectedRecord.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  className="btn-secondary flex-1"
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'repairing')}
                >
                  <Wrench className="w-4 h-4" />
                  送修
                </button>
                <button
                  className="btn-danger flex-1"
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'scrapped')}
                >
                  <Trash2 className="w-4 h-4" />
                  报废
                </button>
              </div>
            )}

            {selectedRecord.status === 'repairing' && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  className="btn-primary w-full"
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'fixed')}
                >
                  <CheckCircle className="w-4 h-4" />
                  标记为已修复
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
