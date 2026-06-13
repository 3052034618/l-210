import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

export const StatCard = ({ title, value, icon, trend, trendUp, color = 'blue' }: StatCardProps) => {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-2 ${
                trendUp ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
