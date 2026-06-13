import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Download,
  FileText,
  ShoppingCart,
  Calendar,
  Search,
  AlertTriangle,
  AlertOctagon,
  Table,
} from 'lucide-react';
import { PageHeader } from '../../components/Layout/PageHeader';
import { StatCard } from '../../components/Card/StatCard';
import { Modal } from '../../components/Modal/Modal';
import { useEquipmentStore } from '../../store/equipmentStore';
import { useBorrowStore } from '../../store/borrowStore';
import { useDamageStore } from '../../store/damageStore';
import { useToast } from '../../store/toastStore';
import { mockClasses } from '../../data/mockData';
import { CATEGORY_LABELS } from '../../types';
import type { Equipment } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { exportInventory, exportBorrowHistory, exportPurchaseList } from '../../utils/exportUtils';

interface ClassStats {
  className: string;
  borrowCount: number;
  totalQuantity: number;
}

interface ClassPeriodStats {
  className: string;
  borrowCount: number;
  overdueCount: number;
  damageCount: number;
  totalQuantity: number;
}

type TimeRange = 'week' | 'month' | 'all';

export const StatisticsPage = () => {
  const { equipment } = useEquipmentStore();
  const { getAllRecords } = useBorrowStore();
  const { records: damageRecords } = useDamageStore();
  const { showSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'popular' | 'purchase' | 'summary'>('overview');
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const records = getAllRecords();

  const totalEquipment = equipment.reduce((sum, e) => sum + e.totalQuantity, 0);
  const borrowedCount = equipment.reduce((sum, e) => sum + (e.totalQuantity - e.availableQuantity), 0);
  const totalBorrowRecords = records.length;
  const overdueCount = records.filter((r) => r.status === 'overdue').length;

  const classStats = useMemo<ClassStats[]>(() => {
    const classMap = new Map<string, ClassStats>();
    records.forEach((r) => {
      if (r.borrowerType === 'class' && r.className) {
        const existing = classMap.get(r.className);
        if (existing) {
          existing.borrowCount += 1;
          existing.totalQuantity += r.quantity;
        } else {
          classMap.set(r.className, {
            className: r.className,
            borrowCount: 1,
            totalQuantity: r.quantity,
          });
        }
      }
    });
    return Array.from(classMap.values()).sort((a, b) => b.borrowCount - a.borrowCount);
  }, [records]);

  const popularEquipment = useMemo(() => {
    return [...equipment]
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10);
  }, [equipment]);

  const purchaseList = useMemo(() => {
    const lowStockItems: { equipment: Equipment; suggestQuantity: number; reason: string }[] = [];

    equipment.forEach((eq) => {
      const availableRate = eq.availableQuantity / eq.totalQuantity;
      const borrowFreq = eq.borrowCount;
      let suggestQty = 0;
      let reason = '';

      if (availableRate < 0.3 && eq.borrowCount > 30) {
        suggestQty = Math.ceil(eq.totalQuantity * 0.5);
        reason = '库存不足且使用率高';
      } else if (availableRate < 0.5 && eq.borrowCount > 50) {
        suggestQty = Math.ceil(eq.totalQuantity * 0.3);
        reason = '使用率较高，建议补充';
      } else if (eq.totalQuantity < 5 && eq.borrowCount > 20) {
        suggestQty = 5;
        reason = '数量过少，建议增加';
      }

      if (suggestQty > 0) {
        lowStockItems.push({ equipment: eq, suggestQuantity: suggestQty, reason });
      }
    });

    return lowStockItems.sort((a, b) => b.suggestQuantity - a.suggestQuantity);
  }, [equipment]);

  const filteredHistory = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.equipmentName.includes(searchText) ||
        r.equipmentCode.toLowerCase().includes(searchText.toLowerCase()) ||
        r.className.includes(searchText) ||
        r.borrowerName.includes(searchText);
      const matchClass = !selectedClass || r.className === selectedClass;
      return matchSearch && matchClass;
    });
  }, [records, searchText, selectedClass]);

  const handleExportInventory = () => {
    exportInventory(equipment, `${formatDate(new Date())}_期末盘点表.csv`);
    showSuccess('盘点表导出成功');
    setIsInventoryModalOpen(false);
  };

  const handleExportHistory = () => {
    exportBorrowHistory(filteredHistory, `${formatDate(new Date())}_借用历史.csv`);
    showSuccess('历史记录导出成功');
  };

  const handleExportPurchase = () => {
    exportPurchaseList(purchaseList, `${formatDate(new Date())}_补采购清单.csv`);
    showSuccess('补采购清单导出成功');
    setIsPurchaseModalOpen(false);
  };

  const getStartDate = (range: TimeRange): string => {
    const now = new Date();
    if (range === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString().slice(0, 10);
    }
    if (range === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().slice(0, 10);
    }
    return '1970-01-01';
  };

  const periodStats = useMemo<ClassPeriodStats[]>(() => {
    const startDate = getStartDate(timeRange);
    const classMap = new Map<string, ClassPeriodStats>();

    const periodRecords = records.filter(
      (r) => r.borrowerType === 'class' && r.borrowDate >= startDate
    );

    periodRecords.forEach((r) => {
      const existing = classMap.get(r.className);
      if (existing) {
        existing.borrowCount += 1;
        existing.totalQuantity += r.quantity;
        if (r.status === 'overdue') {
          existing.overdueCount += 1;
        }
      } else {
        classMap.set(r.className, {
          className: r.className,
          borrowCount: 1,
          overdueCount: r.status === 'overdue' ? 1 : 0,
          damageCount: 0,
          totalQuantity: r.quantity,
        });
      }
    });

    const periodDamages = damageRecords.filter((d) => d.damageDate >= startDate);
    const damageRecordsMap = new Map<string, number>();
    periodDamages.forEach((d) => {
      const relatedRecord = records.find((r) => r.id === d.borrowRecordId);
      if (relatedRecord && relatedRecord.borrowerType === 'class' && relatedRecord.className) {
        damageRecordsMap.set(
          relatedRecord.className,
          (damageRecordsMap.get(relatedRecord.className) || 0) + 1
        );
      }
    });

    classMap.forEach((stats, className) => {
      stats.damageCount = damageRecordsMap.get(className) || 0;
    });

    return Array.from(classMap.values()).sort((a, b) => b.borrowCount - a.borrowCount);
  }, [records, damageRecords, timeRange]);

  const handleExportPeriodSummary = () => {
    const headers = ['班级', '借用次数', '借用器材总数', '逾期次数', '损坏次数'];
    const rows = periodStats.map((s) => [
      s.className,
      s.borrowCount.toString(),
      s.totalQuantity.toString(),
      s.overdueCount.toString(),
      s.damageCount.toString(),
    ]);

    const csvContent =
      '\uFEFF' + [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const rangeLabel = timeRange === 'week' ? '本周' : timeRange === 'month' ? '本月' : '全部';
    link.download = `${formatDate(new Date())}_${rangeLabel}班级统计汇总.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('统计汇总导出成功');
  };

  const maxBorrowCount = popularEquipment.length > 0 ? popularEquipment[0].borrowCount : 1;

  const tabs = [
    { key: 'overview', label: '数据概览', icon: BarChart3 },
    { key: 'summary', label: '时间汇总', icon: Table },
    { key: 'history', label: '借用历史', icon: FileText },
    { key: 'popular', label: '热门器材', icon: TrendingUp },
    { key: 'purchase', label: '补采购清单', icon: ShoppingCart },
  ];

  return (
    <div>
      <PageHeader
        title="班级统计"
        description="查看器材使用数据和统计分析"
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => setIsPurchaseModalOpen(true)}
            >
              <ShoppingCart className="w-4 h-4" />
              补采购清单
            </button>
            <button
              className="btn-primary"
              onClick={() => setIsInventoryModalOpen(true)}
            >
              <Download className="w-4 h-4" />
              导出盘点表
            </button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="器材总数"
          value={totalEquipment}
          icon={<Package className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="借出中"
          value={borrowedCount}
          icon={<TrendingUp className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="借用记录"
          value={totalBorrowRecords}
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="逾期未还"
          value={overdueCount}
          icon={<Calendar className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary-600 border-primary-500'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  班级借用排行
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {classStats.slice(0, 6).map((cls, index) => (
                    <div
                      key={cls.className}
                      className="p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                            index === 0
                              ? 'bg-yellow-500'
                              : index === 1
                              ? 'bg-slate-400'
                              : index === 2
                              ? 'bg-amber-600'
                              : 'bg-slate-300'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {cls.className}
                          </p>
                          <p className="text-xs text-slate-500">
                            {cls.borrowCount} 次借用
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">器材数量</span>
                        <span className="font-semibold text-primary-600">
                          {cls.totalQuantity} 件
                        </span>
                      </div>
                    </div>
                  ))}
                  {classStats.length === 0 && (
                    <div className="col-span-3 py-8 text-center text-slate-400">
                      暂无班级借用数据
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-500" />
                  分类库存分布
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {(['basketball', 'rope', 'stopwatch', 'training'] as const).map(
                    (cat) => {
                      const catEquipment = equipment.filter(
                        (e) => e.category === cat
                      );
                      const total = catEquipment.reduce(
                        (sum, e) => sum + e.totalQuantity,
                        0
                      );
                      const available = catEquipment.reduce(
                        (sum, e) => sum + e.availableQuantity,
                        0
                      );
                      const percentage =
                        total > 0 ? Math.round((available / total) * 100) : 0;

                      return (
                        <div
                          key={cat}
                          className="p-4 bg-slate-50 rounded-xl"
                        >
                          <p className="text-sm text-slate-500">
                            {CATEGORY_LABELS[cat]}
                          </p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">
                            {available}
                            <span className="text-sm font-normal text-slate-400 ml-1">
                              / {total}
                            </span>
                          </p>
                          <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-1 text-right">
                            {percentage}% 在库
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  班级统计汇总
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    {[
                      { value: 'week', label: '本周' },
                      { value: 'month', label: '本月' },
                      { value: 'all', label: '全部' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTimeRange(opt.value as TimeRange)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          timeRange === opt.value
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button className="btn-primary" onClick={handleExportPeriodSummary}>
                    <Download className="w-4 h-4" />
                    导出汇总
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <StatCard
                  title="班级总数"
                  value={periodStats.length}
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  title="借用总次数"
                  value={periodStats.reduce((sum, s) => sum + s.borrowCount, 0)}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="逾期总次数"
                  value={periodStats.reduce((sum, s) => sum + s.overdueCount, 0)}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  color="orange"
                />
                <StatCard
                  title="损坏总次数"
                  value={periodStats.reduce((sum, s) => sum + s.damageCount, 0)}
                  icon={<AlertOctagon className="w-5 h-5" />}
                  color="red"
                />
              </div>

              {periodStats.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>当前时间范围内暂无统计数据</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>班级</th>
                        <th className="text-center">借用次数</th>
                        <th className="text-center">借用器材总数</th>
                        <th className="text-center">逾期次数</th>
                        <th className="text-center">损坏次数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodStats.map((stats) => (
                        <tr key={stats.className}>
                          <td className="font-medium">{stats.className}</td>
                          <td className="text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold">
                              {stats.borrowCount}
                            </span>
                          </td>
                          <td className="text-center">{stats.totalQuantity} 件</td>
                          <td className="text-center">
                            {stats.overdueCount > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-semibold">
                                {stats.overdueCount}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="text-center">
                            {stats.damageCount > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-red-50 text-red-700 rounded-full text-sm font-semibold">
                                {stats.damageCount}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    className="input pl-9"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜索器材、班级、借用人..."
                  />
                </div>
                <select
                  className="input w-40"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">全部班级</option>
                  {mockClasses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-secondary"
                  onClick={handleExportHistory}
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>器材编号</th>
                      <th>器材名称</th>
                      <th>数量</th>
                      <th>借用人</th>
                      <th>类型</th>
                      <th>借出日期</th>
                      <th>应还日期</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.slice(0, 20).map((record) => (
                      <tr key={record.id}>
                        <td className="font-mono text-xs text-slate-500">
                          {record.equipmentCode}
                        </td>
                        <td className="font-medium">{record.equipmentName}</td>
                        <td>{record.quantity} 件</td>
                        <td>
                          {record.borrowerType === 'class'
                            ? record.className
                            : record.borrowerName}
                        </td>
                        <td>
                          <span className="badge-gray">
                            {record.borrowerType === 'class' ? '班级' : '个人'}
                          </span>
                        </td>
                        <td>{formatDate(record.borrowDate)}</td>
                        <td>{formatDate(record.dueDate)}</td>
                        <td>
                          <span
                            className={`${
                              record.status === 'returned'
                                ? 'badge-success'
                                : record.status === 'overdue'
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                          >
                            {record.status === 'returned'
                              ? '已归还'
                              : record.status === 'overdue'
                              ? '已逾期'
                              : record.status === 'partial'
                              ? '部分归还'
                              : '借出中'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredHistory.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    暂无记录
                  </div>
                )}
                {filteredHistory.length > 20 && (
                  <div className="py-4 text-center text-sm text-slate-400">
                    显示前 20 条，共 {filteredHistory.length} 条记录
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'popular' && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">
                热门器材排行榜（按借用次数）
              </h3>
              <div className="space-y-3">
                {popularEquipment.map((eq, index) => (
                  <div
                    key={eq.id}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                          ? 'bg-slate-400'
                          : index === 2
                          ? 'bg-amber-600'
                          : 'bg-slate-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl">
                      {eq.imageUrl}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">
                          {eq.name}
                        </span>
                        <span className="text-sm font-semibold text-primary-600">
                          {eq.borrowCount} 次
                        </span>
                      </div>
                      <div className="mt-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(eq.borrowCount / maxBorrowCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 w-16 text-right">
                      {CATEGORY_LABELS[eq.category]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'purchase' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">
                  建议补采购清单
                </h3>
                <button
                  className="btn-accent"
                  onClick={handleExportPurchase}
                >
                  <Download className="w-4 h-4" />
                  导出清单
                </button>
              </div>

              {purchaseList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无需要补采购的器材</p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>器材名称</th>
                      <th>分类</th>
                      <th>当前库存</th>
                      <th>总数量</th>
                      <th>借用次数</th>
                      <th>建议采购数量</th>
                      <th>采购原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseList.map((item) => (
                      <tr key={item.equipment.id}>
                        <td className="font-medium">{item.equipment.name}</td>
                        <td>{CATEGORY_LABELS[item.equipment.category]}</td>
                        <td>
                          <span className="text-accent-600 font-medium">
                            {item.equipment.availableQuantity}
                          </span>
                        </td>
                        <td>{item.equipment.totalQuantity}</td>
                        <td>{item.equipment.borrowCount}</td>
                        <td>
                          <span className="font-bold text-red-600">
                            +{item.suggestQuantity}
                          </span>
                        </td>
                        <td className="text-slate-500">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        title="期末盘点表预览"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <button
              className="btn-secondary"
              onClick={() => setIsInventoryModalOpen(false)}
            >
              取消
            </button>
            <button className="btn-primary" onClick={handleExportInventory}>
              <Download className="w-4 h-4" />
              导出 CSV
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="table text-sm">
            <thead>
              <tr>
                <th>编号</th>
                <th>名称</th>
                <th>分类</th>
                <th>规格</th>
                <th>总数量</th>
                <th>可用数量</th>
                <th>状态</th>
                <th>位置</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((eq) => (
                <tr key={eq.id}>
                  <td className="font-mono text-xs">{eq.code}</td>
                  <td>{eq.name}</td>
                  <td>{CATEGORY_LABELS[eq.category]}</td>
                  <td className="text-slate-500">{eq.specification}</td>
                  <td>{eq.totalQuantity}</td>
                  <td className="font-medium">{eq.availableQuantity}</td>
                  <td>
                    {eq.status === 'available'
                      ? '在库'
                      : eq.status === 'borrowed'
                      ? '借出'
                      : eq.status === 'repairing'
                      ? '维修中'
                      : '已报废'}
                  </td>
                  <td className="text-slate-500">{eq.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="补采购清单"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              className="btn-secondary"
              onClick={() => setIsPurchaseModalOpen(false)}
            >
              取消
            </button>
            <button className="btn-accent" onClick={handleExportPurchase}>
              <Download className="w-4 h-4" />
              导出清单
            </button>
          </div>
        }
      >
        {purchaseList.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            暂无需要补采购的器材
          </div>
        ) : (
          <div className="space-y-3">
            {purchaseList.map((item) => (
              <div
                key={item.equipment.id}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                  {item.equipment.imageUrl}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">
                    {item.equipment.name}
                  </p>
                  <p className="text-sm text-slate-500">{item.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">建议采购</p>
                  <p className="text-xl font-bold text-accent-600">
                    +{item.suggestQuantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
