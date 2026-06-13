import { useState, useMemo } from 'react';
import {
  ScanLine,
  Search,
  Check,
  X,
  AlertTriangle,
  Clock,
  Package,
  ArrowLeft,
} from 'lucide-react';
import { PageHeader } from '../../components/Layout/PageHeader';
import { Modal } from '../../components/Modal/Modal';
import { useBorrowStore } from '../../store/borrowStore';
import { useEquipmentStore } from '../../store/equipmentStore';
  import { useDamageStore } from '../../store/damageStore';
import { useToast } from '../../store/toastStore';
import type { BorrowRecord } from '../../types';
import { BORROW_STATUS_LABELS } from '../../types';
import { formatDate, getOverdueDays, isOverdue } from '../../utils/dateUtils';

export const ReturnPage = () => {
  const { records, returnEquipment, getActiveRecords, refreshOverdueStatus } = useBorrowStore();
  const { updateEquipment } = useEquipmentStore();
  const { addRecord: addDamageRecord } = useDamageStore();
  const { showSuccess, showError } = useToast();

  const [scanCode, setScanCode] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(0);
  const [quantityDiff, setQuantityDiff] = useState(0);
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageType, setDamageType] = useState<'minor' | 'serious' | 'scrapped'>('minor');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [recentReturns, setRecentReturns] = useState<BorrowRecord[]>([]);

  const activeRecords = useMemo(() => {
    const active = getActiveRecords();
    return active.filter(
      (r) =>
        r.equipmentName.includes(searchText) ||
        r.equipmentCode.toLowerCase().includes(searchText.toLowerCase()) ||
        r.className.includes(searchText) ||
        r.borrowerName.includes(searchText)
    );
  }, [getActiveRecords, searchText]);

  const handleScan = () => {
    if (!scanCode.trim()) {
      showError('请输入或扫描器材编号');
      return;
    }

    const record = activeRecords.find(
      (r) => r.equipmentCode.toLowerCase() === scanCode.toLowerCase().trim()
    );

    if (record) {
      setSelectedRecord(record);
      setReturnQuantity(record.quantity - record.returnedQuantity);
      setQuantityDiff(0);
      setHasDamage(false);
      setDamageDescription('');
      setIsReturnModalOpen(true);
    } else {
      showError('未找到该器材的借出记录');
    }
    setScanCode('');
  };

  const handleQuickReturn = (record: BorrowRecord) => {
    setSelectedRecord(record);
    setReturnQuantity(record.quantity - record.returnedQuantity);
    setQuantityDiff(0);
    setHasDamage(false);
    setDamageDescription('');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!selectedRecord) return;

    if (returnQuantity <= 0) {
      showError('请输入归还数量');
      return;
    }

    const remainingQuantity = selectedRecord.quantity - selectedRecord.returnedQuantity;
    if (returnQuantity > remainingQuantity) {
      showError('归还数量不能超过借出未还数量');
      return;
    }

    returnEquipment(selectedRecord.id, returnQuantity, quantityDiff);

    const equipment = useEquipmentStore.getState().getEquipmentById(selectedRecord.equipmentId);
    if (equipment) {
      const newAvailable = Math.min(
        equipment.availableQuantity + returnQuantity,
        equipment.totalQuantity
      );
      updateEquipment(equipment.id, {
        availableQuantity: newAvailable,
        status: newAvailable > 0 ? 'available' : equipment.status,
      });
    }

    if (hasDamage && damageDescription.trim()) {
      addDamageRecord({
        equipmentId: selectedRecord.equipmentId,
        equipmentName: selectedRecord.equipmentName,
        borrowRecordId: selectedRecord.id,
        damageDate: formatDate(new Date()),
        damageType,
        description: damageDescription,
        photoUrl: '',
        handler: '',
        handleResult: '',
      });
    }

    refreshOverdueStatus();
    setRecentReturns((prev) => [selectedRecord, ...prev].slice(0, 5));
    setIsReturnModalOpen(false);
    setSelectedRecord(null);
    showSuccess('归还成功');
  };

  const handleQuantityChange = (val: number) => {
    setReturnQuantity(val);
    if (selectedRecord) {
      const remaining = selectedRecord.quantity - selectedRecord.returnedQuantity;
      setQuantityDiff(val - remaining);
    }
  };

  const getStatusBadgeClass = (record: BorrowRecord) => {
    if (record.status === 'overdue' || isOverdue(record.dueDate)) {
      return 'badge-danger';
    }
    return 'badge-warning';
  };

  const getStatusText = (record: BorrowRecord) => {
    if (isOverdue(record.dueDate) && record.status === 'borrowing') {
      return '已逾期';
    }
    return BORROW_STATUS_LABELS[record.status];
  };

  return (
    <div>
      <PageHeader
        title="归还验收"
        description="扫码或手动输入器材编号完成归还"
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-accent-500" />
              扫码归还
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  className="input pl-10 text-lg py-3"
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  placeholder="扫描或输入器材编号，按回车确认"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
              <button className="btn-accent px-6" onClick={handleScan}>
                确认归还
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              提示：可连接扫码枪快速扫描器材标签上的二维码/条码
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">借出中器材</h3>
              <div className="relative w-64">
                <input
                  type="text"
                  className="input pl-9 text-sm"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索器材/班级/借用人..."
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {activeRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无借出中的器材</p>
                </div>
              ) : (
                activeRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      📦
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">
                          {record.equipmentName}
                        </span>
                        <span className={`${getStatusBadgeClass(record)}`}>
                          {getStatusText(record)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>{record.equipmentCode}</span>
                        <span>·</span>
                        <span>
                          {record.borrowerType === 'class'
                            ? record.className
                            : record.borrowerName}
                        </span>
                        <span>·</span>
                        <span>
                          借 {record.quantity} 件 / 还 {record.returnedQuantity} 件
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>借出：{formatDate(record.borrowDate)}</span>
                        <span>·</span>
                        <span
                          className={
                            isOverdue(record.dueDate) ? 'text-red-500' : ''
                          }
                        >
                          应还：{formatDate(record.dueDate)}
                          {isOverdue(record.dueDate) &&
                            ` (逾期 ${getOverdueDays(record.dueDate)} 天)`}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-primary text-sm"
                      onClick={() => handleQuickReturn(record)}
                    >
                      归还
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">最近归还</h3>
            {recentReturns.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                暂无归还记录
              </div>
            ) : (
              <div className="space-y-2">
                {recentReturns.map((record, index) => (
                  <div
                    key={`${record.id}-${index}`}
                    className="flex items-center gap-3 p-2 rounded-lg bg-green-50"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {record.equipmentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {record.quantity} 件 · 刚刚
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 bg-gradient-to-br from-primary-50 to-white">
            <h3 className="font-semibold text-primary-800 mb-2">归还流程</h3>
            <ol className="space-y-2 text-sm text-primary-700">
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  1
                </span>
                <span>扫描器材编号或手动查找</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  2
                </span>
                <span>核对归还数量</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  3
                </span>
                <span>检查器材是否损坏</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  4
                </span>
                <span>确认完成归还</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="归还验收"
        size="lg"
        footer={
          <div className="flex justify-between">
            <button
              className="btn-secondary"
              onClick={() => setIsReturnModalOpen(false)}
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            <button className="btn-primary" onClick={handleConfirmReturn}>
              <Check className="w-4 h-4" />
              确认归还
            </button>
          </div>
        }
      >
        {selectedRecord && (
          <div className="space-y-5">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
                  📦
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-slate-800">
                    {selectedRecord.equipmentName}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {selectedRecord.equipmentCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">借出数量</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {selectedRecord.quantity}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">借用人</p>
                <p className="font-medium text-slate-800">
                  {selectedRecord.borrowerType === 'class'
                    ? selectedRecord.className
                    : selectedRecord.borrowerName}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">借出日期</p>
                <p className="font-medium text-slate-800">
                  {formatDate(selectedRecord.borrowDate)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">应还日期</p>
                <p
                  className={`font-medium ${
                    isOverdue(selectedRecord.dueDate)
                      ? 'text-red-600'
                      : 'text-slate-800'
                  }`}
                >
                  {formatDate(selectedRecord.dueDate)}
                  {isOverdue(selectedRecord.dueDate) &&
                    ` (逾期 ${getOverdueDays(selectedRecord.dueDate)} 天)`}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">已还数量</p>
                <p className="font-medium text-slate-800">
                  {selectedRecord.returnedQuantity} 件
                </p>
              </div>
            </div>

            <div>
              <label className="label">归还数量</label>
              <div className="flex items-center gap-3">
                <button
                  className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                  onClick={() =>
                    handleQuantityChange(Math.max(0, returnQuantity - 1))
                  }
                >
                  <span className="text-lg font-medium">-</span>
                </button>
                <input
                  type="number"
                  className="input w-24 text-center text-lg font-semibold"
                  value={returnQuantity}
                  onChange={(e) =>
                    handleQuantityChange(parseInt(e.target.value) || 0)
                  }
                  min="0"
                  max={selectedRecord.quantity - selectedRecord.returnedQuantity}
                />
                <button
                  className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                  onClick={() =>
                    handleQuantityChange(
                      Math.min(
                        selectedRecord.quantity - selectedRecord.returnedQuantity,
                        returnQuantity + 1
                      )
                    )
                  }
                >
                  <span className="text-lg font-medium">+</span>
                </button>
                <span className="text-sm text-slate-500">
                  / 剩余 {selectedRecord.quantity - selectedRecord.returnedQuantity} 件未还
                </span>
              </div>
            </div>

            {quantityDiff !== 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    数量差异：{quantityDiff > 0 ? '多还' : '少还'} {Math.abs(quantityDiff)} 件
                  </p>
                  <p className="text-xs text-yellow-600 mt-0.5">
                    请在备注中说明原因
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDamage}
                  onChange={(e) => setHasDamage(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-medium text-slate-700">器材有损坏</span>
              </label>

              {hasDamage && (
                <div className="mt-4 space-y-4 pl-8">
                  <div>
                    <label className="label">损坏程度</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'minor', label: '轻微损坏', color: 'yellow' },
                        { value: 'serious', label: '严重损坏', color: 'orange' },
                        { value: 'scrapped', label: '报废', color: 'red' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setDamageType(opt.value as typeof damageType)
                          }
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                            damageType === opt.value
                              ? opt.color === 'yellow'
                                ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                                : opt.color === 'orange'
                                ? 'bg-orange-50 border-orange-300 text-orange-700'
                                : 'bg-red-50 border-red-300 text-red-700'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">损坏描述</label>
                    <textarea
                      className="input min-h-[80px]"
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                      placeholder="请描述损坏情况..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
