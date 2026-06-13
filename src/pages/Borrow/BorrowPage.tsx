import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  User,
  Clock,
  AlertTriangle,
  Plus,
  Minus,
  Check,
  Calendar,
  ArrowRight,
  Printer,
  ClipboardList,
  History,
} from 'lucide-react';
import { PageHeader } from '../../components/Layout/PageHeader';
import { SearchInput } from '../../components/Form/SearchInput';
import { StatCard } from '../../components/Card/StatCard';
import { Modal } from '../../components/Modal/Modal';
import { useBorrowStore } from '../../store/borrowStore';
import { useEquipmentStore } from '../../store/equipmentStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../../store/toastStore';
import { mockClasses } from '../../data/mockData';
import type { Equipment } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { getToday, addDays, getOverdueDays, formatDate } from '../../utils/dateUtils';

interface BorrowItem {
  equipment: Equipment;
  quantity: number;
}

export const BorrowPage = () => {
  const { addRecord, getOverdueRecords, refreshOverdueStatus, getLastBorrowByClass } = useBorrowStore();
  const { equipment, updateEquipment, updateBorrowCount, getEquipmentById } = useEquipmentStore();
  const { maxBorrowDays, schoolName } = useSettingsStore();
  const { showSuccess, showError, showInfo } = useToast();

  const [borrowerType, setBorrowerType] = useState<'class' | 'individual'>('class');
  const [selectedGrade, setSelectedGrade] = useState('高一');
  const [selectedClass, setSelectedClass] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowDays, setBorrowDays] = useState(maxBorrowDays);
  const [remark, setRemark] = useState('');
  const [searchText, setSearchText] = useState('');

  const [borrowItems, setBorrowItems] = useState<BorrowItem[]>([]);
  const [overdueRecords, setOverdueRecords] = useState<ReturnType<typeof getOverdueRecords>>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<{
    borrowId: string;
    className: string;
    borrowerName: string;
    borrowDate: string;
    dueDate: string;
    items: BorrowItem[];
    remark: string;
  } | null>(null);

  const grades = ['高一', '高二', '高三'];
  const classes = mockClasses.filter((c) => c.grade === selectedGrade);

  useEffect(() => {
    refreshOverdueStatus();
    setOverdueRecords(getOverdueRecords());
  }, [refreshOverdueStatus, getOverdueRecords]);

  const availableEquipment = useMemo(() => {
    return equipment.filter(
      (eq) =>
        eq.status === 'available' &&
        eq.availableQuantity > 0 &&
        (eq.name.toLowerCase().includes(searchText.toLowerCase()) ||
          eq.code.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [equipment, searchText]);

  const totalBorrowQuantity = borrowItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddItem = (eq: Equipment) => {
    const existing = borrowItems.find((item) => item.equipment.id === eq.id);
    if (existing) {
      if (existing.quantity < eq.availableQuantity) {
        setBorrowItems(
          borrowItems.map((item) =>
            item.equipment.id === eq.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setBorrowItems([...borrowItems, { equipment: eq, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (equipmentId: string) => {
    const existing = borrowItems.find((item) => item.equipment.id === equipmentId);
    if (existing && existing.quantity > 1) {
      setBorrowItems(
        borrowItems.map((item) =>
          item.equipment.id === equipmentId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setBorrowItems(borrowItems.filter((item) => item.equipment.id !== equipmentId));
    }
  };

  const handleClearAll = () => {
    setBorrowItems([]);
  };

  const handleLoadLastBorrow = () => {
    if (!selectedClass) {
      showError('请先选择班级');
      return;
    }
    const lastBorrow = getLastBorrowByClass(selectedClass);
    if (lastBorrow.length === 0) {
      showInfo('该班级还没有借用记录');
      return;
    }

    const newItems: BorrowItem[] = [];
    lastBorrow.forEach((item) => {
      const eq = getEquipmentById(item.equipmentId);
      if (eq && eq.availableQuantity > 0) {
        const qty = Math.min(item.quantity, eq.availableQuantity);
        newItems.push({ equipment: eq, quantity: qty });
      }
    });

    if (newItems.length > 0) {
      setBorrowItems(newItems);
      showSuccess(`已载入上次借用清单（${newItems.length}种器材）`);
    } else {
      showInfo('上次借用的器材当前都不可用');
    }
  };

  const handlePrintSlip = () => {
    if (printData) {
      window.print();
    }
  };

  const handleBorrow = () => {
    if (borrowItems.length === 0) {
      showError('请选择要借出的器材');
      return;
    }

    if (borrowerType === 'class' && !selectedClass) {
      showError('请选择班级');
      return;
    }

    if (borrowerType === 'individual' && !borrowerName.trim()) {
      showError('请输入借用人姓名');
      return;
    }

    if (borrowDays > maxBorrowDays) {
      showError(`借用天数不能超过最长借用天数（${maxBorrowDays}天）`);
      return;
    }

    if (borrowDays < 1) {
      showError('借用天数至少为1天');
      return;
    }

    const actualBorrowDays = Math.min(borrowDays, maxBorrowDays);
    const borrowDate = getToday();
    const dueDate = addDays(borrowDate, actualBorrowDays);
    const className = borrowerType === 'class' ? selectedClass : '';
    const borrower = borrowerType === 'class' ? borrowerName || '体育老师' : borrowerName;
    const borrowId = 'BR' + Date.now().toString().slice(-8);

    borrowItems.forEach((item) => {
      addRecord({
        equipmentId: item.equipment.id,
        equipmentName: item.equipment.name,
        equipmentCode: item.equipment.code,
        quantity: item.quantity,
        borrowerType,
        className,
        borrowerName: borrower,
        borrowDate,
        dueDate,
        remark,
      });

      updateEquipment(item.equipment.id, {
        availableQuantity: item.equipment.availableQuantity - item.quantity,
        status:
          item.equipment.availableQuantity - item.quantity === 0
            ? 'borrowed'
            : item.equipment.status,
      });

      updateBorrowCount(item.equipment.id);
    });

    setPrintData({
      borrowId,
      className,
      borrowerName: borrower,
      borrowDate,
      dueDate,
      items: borrowItems.map((item) => ({ ...item })),
      remark,
    });

    showSuccess('借出登记成功');
    setBorrowItems([]);
    setRemark('');
    setIsPrintModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="借出登记"
        description="快速完成班级或个人器材借出登记"
      />

      {overdueRecords.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                逾期提醒：有 {overdueRecords.length} 笔借出已逾期
              </h3>
              <p className="text-sm text-red-600 mt-1">
                请及时催还，避免影响器材周转
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {overdueRecords.slice(0, 3).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
              >
                <div>
                  <span className="font-medium text-slate-700">
                    {record.equipmentName}
                  </span>
                  <span className="text-sm text-slate-500 ml-2">
                    {record.className || record.borrowerName}
                  </span>
                </div>
                <span className="text-red-600 text-sm font-medium">
                  逾期 {getOverdueDays(record.dueDate)} 天
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">选择器材</h3>
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="搜索器材名称或编号..."
              className="mb-4 w-80"
            />
            <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {availableEquipment.map((eq) => {
                const borrowed = borrowItems.find(
                  (item) => item.equipment.id === eq.id
                )?.quantity || 0;
                return (
                  <div
                    key={eq.id}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      borrowed > 0
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'
                    }`}
                    onClick={() => handleAddItem(eq)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl">
                        {eq.imageUrl}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">
                          {eq.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          库存 {eq.availableQuantity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {CATEGORY_LABELS[eq.category]}
                      </span>
                      {borrowed > 0 && (
                        <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {borrowed} 件
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {availableEquipment.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                暂无可用器材
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">借用人信息</h3>

            <div className="flex bg-slate-100 rounded-lg p-1 mb-4">
              <button
                onClick={() => setBorrowerType('class')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  borrowerType === 'class'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Users className="w-4 h-4" />
                班级
              </button>
              <button
                onClick={() => setBorrowerType('individual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  borrowerType === 'individual'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <User className="w-4 h-4" />
                个人
              </button>
            </div>

            {borrowerType === 'class' ? (
              <>
                <div className="mb-3">
                  <label className="label">年级</label>
                  <select
                    className="input"
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      setSelectedClass('');
                    }}
                  >
                    {grades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="label">班级</label>
                  <select
                    className="input"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">请选择班级</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedClass && (
                  <button
                    type="button"
                    onClick={handleLoadLastBorrow}
                    className="w-full mb-4 py-2 px-3 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    载入该班上一次借用清单
                  </button>
                )}
              </>
            ) : (
              <div className="mb-3">
                <label className="label">借用人姓名</label>
                <input
                  className="input"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="请输入姓名"
                />
              </div>
            )}

            {borrowerType === 'class' && (
              <div className="mb-3">
                <label className="label">负责老师</label>
                <input
                  className="input"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="请输入老师姓名"
                />
              </div>
            )}

            <div className="mb-3">
              <label className="label flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                借用天数
                <span className="text-xs text-slate-400 font-normal">
                  （最长 {maxBorrowDays} 天）
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                  onClick={() => setBorrowDays(Math.max(1, borrowDays - 1))}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  className={`input flex-1 text-center ${
                    borrowDays > maxBorrowDays ? 'border-red-400 focus:ring-red-300' : ''
                  }`}
                  value={borrowDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setBorrowDays(val);
                  }}
                  onBlur={() => {
                    if (borrowDays > maxBorrowDays) {
                      setBorrowDays(maxBorrowDays);
                    }
                    if (borrowDays < 1) {
                      setBorrowDays(1);
                    }
                  }}
                  min="1"
                  max={maxBorrowDays}
                />
                <button
                  className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                  onClick={() => setBorrowDays(Math.min(maxBorrowDays, borrowDays + 1))}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {borrowDays > maxBorrowDays && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  借用天数超过上限（{maxBorrowDays}天），请调整
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                应还日期：{formatDate(addDays(getToday(), Math.min(borrowDays, maxBorrowDays)))}
              </p>
            </div>

            <div>
              <label className="label">备注</label>
              <textarea
                className="input min-h-[60px]"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="可选"
              />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                借出清单
              </h3>
              <div className="flex items-center gap-2">
                {borrowItems.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-slate-400 hover:text-red-500"
                  >
                    清空
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">
              {borrowItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  点击左侧器材添加
                </div>
              ) : (
                borrowItems.map((item) => (
                  <div
                    key={item.equipment.id}
                    className="flex items-center gap-2 bg-slate-50 rounded-lg p-2"
                  >
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-sm">
                      {item.equipment.imageUrl}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {item.equipment.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-300"
                        onClick={() => handleRemoveItem(item.equipment.id)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-300"
                        onClick={() => handleAddItem(item.equipment)}
                        disabled={item.quantity >= item.equipment.availableQuantity}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-slate-500">合计</span>
                <span className="font-bold text-lg text-primary-600">
                  {totalBorrowQuantity} 件
                </span>
              </div>
              <button
                className="btn-accent w-full"
                onClick={handleBorrow}
                disabled={borrowItems.length === 0}
              >
                <Check className="w-4 h-4" />
                确认借出
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="今日借出"
              value={12}
              icon={<ArrowRight className="w-5 h-5" />}
              color="orange"
            />
            <StatCard
              title="借出中"
              value={equipment.reduce((sum, e) => sum + (e.totalQuantity - e.availableQuantity), 0)}
              icon={<Clock className="w-5 h-5" />}
              color="blue"
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="打印借用单"
        size="lg"
        footer={
          <div className="flex justify-end gap-3 no-print">
            <button
              className="btn-secondary"
              onClick={() => setIsPrintModalOpen(false)}
            >
              关闭
            </button>
            <button className="btn-primary" onClick={handlePrintSlip}>
              <Printer className="w-4 h-4" />
              打印借用单
            </button>
          </div>
        }
      >
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        {printData && (
          <div className="print-area">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                {schoolName || '学校'}
              </h1>
              <h2 className="text-xl font-semibold text-slate-700">体育器材借用单</h2>
              <p className="text-sm text-slate-500 mt-2">
                单据编号：{printData.borrowId}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <span className="text-slate-500">借用班级/个人：</span>
                <span className="font-medium text-slate-800">
                  {printData.className || printData.borrowerName}
                </span>
              </div>
              <div>
                <span className="text-slate-500">负责老师：</span>
                <span className="font-medium text-slate-800">{printData.borrowerName}</span>
              </div>
              <div>
                <span className="text-slate-500">借用日期：</span>
                <span className="font-medium text-slate-800">{printData.borrowDate}</span>
              </div>
              <div>
                <span className="text-slate-500">应还日期：</span>
                <span className="font-medium text-slate-800">{printData.dueDate}</span>
              </div>
            </div>

            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm">序号</th>
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm">器材名称</th>
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm">器材编号</th>
                  <th className="border border-slate-300 px-4 py-2 text-center text-sm">数量</th>
                </tr>
              </thead>
              <tbody>
                {printData.items.map((item, index) => (
                  <tr key={item.equipment.id}>
                    <td className="border border-slate-300 px-4 py-2 text-sm">{index + 1}</td>
                    <td className="border border-slate-300 px-4 py-2 text-sm">
                      {item.equipment.imageUrl} {item.equipment.name}
                    </td>
                    <td className="border border-slate-300 px-4 py-2 text-sm font-mono">
                      {item.equipment.code}
                    </td>
                    <td className="border border-slate-300 px-4 py-2 text-center text-sm font-medium">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="border border-slate-300 px-4 py-2 text-right" colSpan={3}>
                    合计
                  </td>
                  <td className="border border-slate-300 px-4 py-2 text-center">
                    {printData.items.reduce((sum, item) => sum + item.quantity, 0)} 件
                  </td>
                </tr>
              </tbody>
            </table>

            {printData.remark && (
              <div className="mb-6 text-sm">
                <span className="text-slate-500">备注：</span>
                <span className="text-slate-800">{printData.remark}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-8 mt-12 text-sm text-slate-600">
              <div className="text-center">
                <div className="border-b border-slate-400 pb-8 mb-2">借用人签字</div>
                <p>日期：_____________</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 pb-8 mb-2">器材管理员签字</div>
                <p>日期：_____________</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 pb-8 mb-2">归还确认</div>
                <p>日期：_____________</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
