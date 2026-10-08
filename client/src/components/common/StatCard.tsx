import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'sky' | 'emerald' | 'amber' | 'indigo' | 'purple' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'sky'
}) => {
  const colorMap = {
    sky: 'from-sky-500/20 to-sky-500/5 text-sky-400 border-sky-500/20 light:from-sky-50 light:to-sky-100/50 light:text-sky-700 light:border-sky-200',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20 light:from-emerald-50 light:to-emerald-100/50 light:text-emerald-700 light:border-emerald-200',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20 light:from-amber-50 light:to-amber-100/50 light:text-amber-700 light:border-amber-200',
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20 light:from-indigo-50 light:to-indigo-100/50 light:text-indigo-700 light:border-indigo-200',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20 light:from-purple-50 light:to-purple-100/50 light:text-purple-700 light:border-purple-200',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20 light:from-rose-50 light:to-rose-100/50 light:text-rose-700 light:border-rose-200'
  };

  const iconBgMap = {
    sky: 'bg-slate-800/80 border-slate-700/60 light:bg-sky-200/80 light:border-sky-300 light:text-sky-800',
    emerald: 'bg-slate-800/80 border-slate-700/60 light:bg-emerald-200/80 light:border-emerald-300 light:text-emerald-800',
    amber: 'bg-slate-800/80 border-slate-700/60 light:bg-amber-200/80 light:border-amber-300 light:text-amber-800',
    indigo: 'bg-slate-800/80 border-slate-700/60 light:bg-indigo-200/80 light:border-indigo-300 light:text-indigo-800',
    purple: 'bg-slate-800/80 border-slate-700/60 light:bg-purple-200/80 light:border-purple-300 light:text-purple-800',
    rose: 'bg-slate-800/80 border-slate-700/60 light:bg-rose-200/80 light:border-rose-300 light:text-rose-800'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 bg-gradient-to-br glass-card ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-white light:text-slate-900 mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 light:text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border shadow-inner ${iconBgMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 text-xs font-semibold text-slate-300 light:text-slate-600 flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
};
