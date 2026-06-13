import { NavLink } from 'react-router-dom';
import {
  Package,
  ArrowRightLeft,
  Undo2,
  BarChart3,
  AlertTriangle,
  Settings,
  Dumbbell,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useBorrowStore } from '../../store/borrowStore';
import { useDamageStore } from '../../store/damageStore';
import { useEffect, useState } from 'react';

const navItems = [
  { path: '/equipment', label: '器材库', icon: Package },
  { path: '/borrow', label: '借出登记', icon: ArrowRightLeft },
  { path: '/return', label: '归还验收', icon: Undo2 },
  { path: '/statistics', label: '班级统计', icon: BarChart3 },
  { path: '/damage', label: '损坏处理', icon: AlertTriangle },
  { path: '/settings', label: '系统设置', icon: Settings },
];

export const Sidebar = () => {
  const { schoolName } = useSettingsStore();
  const { getOverdueRecords, refreshOverdueStatus } = useBorrowStore();
  const { getPendingCount } = useDamageStore();
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    refreshOverdueStatus();
    setOverdueCount(getOverdueRecords().length);
  }, [refreshOverdueStatus, getOverdueRecords]);

  const pendingDamageCount = getPendingCount();

  return (
    <aside className="w-64 bg-gradient-to-b from-primary-800 to-primary-900 h-full flex flex-col">
      <div className="px-6 py-6 border-b border-primary-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">智慧体育器材</h1>
            <p className="text-primary-300 text-xs">{schoolName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.path === '/borrow' && overdueCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {overdueCount}
                </span>
              )}
              {item.path === '/damage' && pendingDamageCount > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingDamageCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-primary-700/50">
        <div className="bg-primary-700/30 rounded-lg p-3">
          <p className="text-primary-200 text-xs">体育组管理系统</p>
          <p className="text-primary-400 text-xs mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
};
