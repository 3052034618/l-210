import { useState, useMemo } from 'react';
import { Plus, Printer, Grid3x3, List, Edit2, Trash2, Eye } from 'lucide-react';
import { PageHeader } from '../../components/Layout/PageHeader';
import { SearchInput } from '../../components/Form/SearchInput';
import { Modal } from '../../components/Modal/Modal';
import { useEquipmentStore } from '../../store/equipmentStore';
import { useToast } from '../../store/toastStore';
import type { Equipment, EquipmentCategory, EquipmentStatus } from '../../types';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../types';
import { formatDate } from '../../utils/dateUtils';

const categories: { value: EquipmentCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'basketball', label: '篮球' },
  { value: 'rope', label: '跳绳' },
  { value: 'stopwatch', label: '秒表' },
  { value: 'training', label: '训练器械' },
];

const statusOptions: { value: EquipmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'available', label: '在库' },
  { value: 'borrowed', label: '借出' },
  { value: 'repairing', label: '维修中' },
  { value: 'scrapped', label: '已报废' },
];

export const EquipmentPage = () => {
  const { equipment, addEquipment, updateEquipment, deleteEquipment } = useEquipmentStore();
  const { showSuccess, showError, toasts, removeToast } = useToast();
  
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Partial<Equipment> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      const matchSearch =
        eq.name.toLowerCase().includes(searchText.toLowerCase()) ||
        eq.code.toLowerCase().includes(searchText.toLowerCase());
      const matchCategory = selectedCategory === 'all' || eq.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || eq.status === selectedStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [equipment, searchText, selectedCategory, selectedStatus]);

  const handleAddEquipment = () => {
    setEditingEquipment({
      name: '',
      category: 'basketball',
      specification: '',
      totalQuantity: 1,
      availableQuantity: 1,
      status: 'available',
      location: '',
      purchaseDate: formatDate(new Date()),
      remark: '',
      imageUrl: '📦',
    });
    setIsEditing(false);
    setIsAddModalOpen(true);
  };

  const handleEditEquipment = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setEditingEquipment({ ...eq });
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleViewDetail = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setIsDetailModalOpen(true);
  };

  const handleDeleteEquipment = (id: string) => {
    if (window.confirm('确定要删除该器材吗？')) {
      deleteEquipment(id);
      showSuccess('器材已删除');
    }
  };

  const handleSaveEquipment = () => {
    if (!editingEquipment?.name || !editingEquipment.name.trim()) {
      showError('请输入器材名称');
      return;
    }
    if (!editingEquipment.totalQuantity || editingEquipment.totalQuantity <= 0) {
      showError('请输入有效的数量');
      return;
    }

    if (isEditing && selectedEquipment) {
      updateEquipment(selectedEquipment.id, editingEquipment as Equipment);
      showSuccess('器材信息已更新');
    } else {
      addEquipment(editingEquipment as Omit<Equipment, 'id' | 'code' | 'borrowCount'>);
      showSuccess('器材已添加');
    }
    setIsAddModalOpen(false);
    setEditingEquipment(null);
  };

  const handlePrintLabels = () => {
    window.print();
  };

  const getStatusBadgeClass = (status: EquipmentStatus) => {
    switch (status) {
      case 'available':
        return 'badge-success';
      case 'borrowed':
        return 'badge-warning';
      case 'repairing':
        return 'badge-info';
      case 'scrapped':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  };

  return (
    <div>
      <PageHeader
        title="器材库"
        description={`共 ${equipment.length} 种器材，${equipment.reduce((sum, e) => sum + e.totalQuantity, 0)} 件`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setIsPrintModalOpen(true)}>
              <Printer className="w-4 h-4" />
              打印编号
            </button>
            <button className="btn-primary" onClick={handleAddEquipment}>
              <Plus className="w-4 h-4" />
              新增器材
            </button>
          </>
        }
      />

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput
            value={searchText}
            onChange={setSearchText}
            placeholder="搜索器材名称或编号..."
            className="w-64"
          />

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">分类：</label>
            <select
              className="input w-32"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as EquipmentCategory | 'all')}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">状态：</label>
            <select
              className="input w-32"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as EquipmentStatus | 'all')}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEquipment.map((eq) => (
            <div
              key={eq.id}
              className="card p-4 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleViewDetail(eq)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl">
                  {eq.imageUrl}
                </div>
                <span className={`${getStatusBadgeClass(eq.status)}`}>
                  {STATUS_LABELS[eq.status]}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 truncate">{eq.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{eq.code}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-500">库存：</span>
                  <span className="font-medium text-slate-700">
                    {eq.availableQuantity}/{eq.totalQuantity}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{CATEGORY_LABELS[eq.category]}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="btn-ghost text-xs px-2 py-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditEquipment(eq);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                  编辑
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>编号</th>
                <th>名称</th>
                <th>分类</th>
                <th>规格</th>
                <th>库存</th>
                <th>状态</th>
                <th>存放位置</th>
                <th>借用次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((eq) => (
                <tr key={eq.id} className="cursor-pointer" onClick={() => handleViewDetail(eq)}>
                  <td className="font-mono text-xs text-slate-500">{eq.code}</td>
                  <td className="font-medium text-slate-800">{eq.name}</td>
                  <td>{CATEGORY_LABELS[eq.category]}</td>
                  <td className="text-slate-500">{eq.specification}</td>
                  <td>
                    <span className="font-medium">
                      {eq.availableQuantity}
                    </span>
                    <span className="text-slate-400"> / {eq.totalQuantity}</span>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(eq.status)}>
                      {STATUS_LABELS[eq.status]}
                    </span>
                  </td>
                  <td className="text-slate-500">{eq.location}</td>
                  <td className="text-slate-500">{eq.borrowCount}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(eq);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEquipment(eq);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEquipment(eq.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEquipment.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              暂无器材数据
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isEditing ? '编辑器材' : '新增器材'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={handleSaveEquipment}>
              {isEditing ? '保存修改' : '添加器材'}
            </button>
          </div>
        }
      >
        {editingEquipment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">器材名称 *</label>
                <input
                  className="input"
                  value={editingEquipment.name || ''}
                  onChange={(e) =>
                    setEditingEquipment({ ...editingEquipment, name: e.target.value })
                  }
                  placeholder="请输入器材名称"
                />
              </div>
              <div>
                <label className="label">分类 *</label>
                <select
                  className="input"
                  value={editingEquipment.category || 'basketball'}
                  onChange={(e) =>
                    setEditingEquipment({
                      ...editingEquipment,
                      category: e.target.value as EquipmentCategory,
                    })
                  }
                >
                  {categories.filter(c => c.value !== 'all').map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">规格</label>
                <input
                  className="input"
                  value={editingEquipment.specification || ''}
                  onChange={(e) =>
                    setEditingEquipment({ ...editingEquipment, specification: e.target.value })
                  }
                  placeholder="如：7号标准球"
                />
              </div>
              <div>
                <label className="label">总数量 *</label>
                <input
                  type="number"
                  className="input"
                  value={editingEquipment.totalQuantity || 0}
                  onChange={(e) =>
                    setEditingEquipment({
                      ...editingEquipment,
                      totalQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">可用数量</label>
                <input
                  type="number"
                  className="input"
                  value={editingEquipment.availableQuantity || 0}
                  onChange={(e) =>
                    setEditingEquipment({
                      ...editingEquipment,
                      availableQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
              </div>
              <div>
                <label className="label">状态</label>
                <select
                  className="input"
                  value={editingEquipment.status || 'available'}
                  onChange={(e) =>
                    setEditingEquipment({
                      ...editingEquipment,
                      status: e.target.value as EquipmentStatus,
                    })
                  }
                >
                  {statusOptions.filter(s => s.value !== 'all').map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">存放位置</label>
                <input
                  className="input"
                  value={editingEquipment.location || ''}
                  onChange={(e) =>
                    setEditingEquipment({ ...editingEquipment, location: e.target.value })
                  }
                  placeholder="如：器材室A区1号架"
                />
              </div>
              <div>
                <label className="label">采购日期</label>
                <input
                  type="date"
                  className="input"
                  value={editingEquipment.purchaseDate || ''}
                  onChange={(e) =>
                    setEditingEquipment({ ...editingEquipment, purchaseDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">图标 (emoji)</label>
              <input
                className="input"
                value={editingEquipment.imageUrl || ''}
                onChange={(e) =>
                  setEditingEquipment({ ...editingEquipment, imageUrl: e.target.value })
                }
                placeholder="输入emoji，如：🏀"
              />
            </div>

            <div>
              <label className="label">备注</label>
              <textarea
                className="input min-h-[80px]"
                value={editingEquipment.remark || ''}
                onChange={(e) =>
                  setEditingEquipment({ ...editingEquipment, remark: e.target.value })
                }
                placeholder="备注信息"
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="器材详情"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
              关闭
            </button>
            {selectedEquipment && (
              <button
                className="btn-primary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditEquipment(selectedEquipment);
                }}
              >
                编辑
              </button>
            )}
          </div>
        }
      >
        {selectedEquipment && (
          <div>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center text-4xl">
                {selectedEquipment.imageUrl}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedEquipment.name}</h3>
                <p className="text-slate-500 mt-1">{selectedEquipment.code}</p>
                <span
                  className={`mt-2 inline-block ${getStatusBadgeClass(selectedEquipment.status)}`}
                >
                  {STATUS_LABELS[selectedEquipment.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">分类</p>
                <p className="font-medium">{CATEGORY_LABELS[selectedEquipment.category]}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">规格</p>
                <p className="font-medium">{selectedEquipment.specification || '-'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">库存</p>
                <p className="font-medium">
                  {selectedEquipment.availableQuantity} / {selectedEquipment.totalQuantity} 件
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">借用次数</p>
                <p className="font-medium">{selectedEquipment.borrowCount} 次</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">存放位置</p>
                <p className="font-medium">{selectedEquipment.location || '-'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">采购日期</p>
                <p className="font-medium">{formatDate(selectedEquipment.purchaseDate)}</p>
              </div>
            </div>

            {selectedEquipment.remark && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-1">备注</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                  {selectedEquipment.remark}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="打印器材编号标签"
        size="xl"
        footer={
          <div className="flex justify-end gap-3 no-print">
            <button className="btn-secondary" onClick={() => setIsPrintModalOpen(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={handlePrintLabels}>
              <Printer className="w-4 h-4" />
              打印
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-4 gap-4">
          {equipment.slice(0, 12).map((eq) => (
            <div
              key={eq.id}
              className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center"
            >
              <div className="text-3xl mb-2">{eq.imageUrl}</div>
              <p className="text-sm font-medium text-slate-800 truncate">{eq.name}</p>
              <p className="text-xs font-mono text-primary-600 mt-1">{eq.code}</p>
              <div className="mt-2 text-xs text-slate-400">{eq.specification}</div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Toast 容器放在 App 级别更好，这里暂时放在页面内 */}
      <div className="fixed top-4 right-4 z-50">
        {/* Toast 会通过 hook 管理 */}
      </div>
    </div>
  );
};
