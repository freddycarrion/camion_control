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
  const cardBgMap = {
    sky: 'bg-[#07193b] border-[#0c316a] text-sky-400 light:bg-[#f0f9ff] light:border-[#bae6fd] light:text-[#0369a1]',
    emerald: 'bg-[#03261a] border-[#084d34] text-emerald-400 light:bg-[#ecfdf5] light:border-[#a7f3d0] light:text-[#047857]',
    amber: 'bg-[#331505] border-[#6b2d0b] text-[#f97316] light:bg-[#fff7ed] light:border-[#fed7aa] light:text-[#c2410c]',
    indigo: 'bg-[#121340] border-[#222475] text-indigo-400 light:bg-[#e0e7ff] light:border-[#c7d2fe] light:text-[#3730a3]',
    purple: 'bg-[#1f0a38] border-[#431475] text-purple-300 light:bg-[#f3e8ff] light:border-[#ddd6fe] light:text-[#6b21a8]',
    rose: 'bg-[#2e0917] border-[#5e1230] text-rose-400 light:bg-[#ffe4e6] light:border-[#fecdd3] light:text-[#9f1239]'
  };

  const iconBgMap = {
    sky: 'bg-[#0070f3] text-white shadow-lg shadow-blue-500/25',
    emerald: 'bg-[#10b981] text-white shadow-lg shadow-emerald-500/25',
    amber: 'bg-[#f97316] text-white shadow-lg shadow-amber-500/25',
    indigo: 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/25',
    purple: 'bg-[#8b5cf6] text-white shadow-lg shadow-purple-500/25',
    rose: 'bg-[#f43f5e] text-white shadow-lg shadow-rose-500/25'
  };

  const valueColorMap = {
    sky: 'text-white light:text-[#0f172a]',
    emerald: 'text-white light:text-[#0f172a]',
    amber: 'text-[#f97316] light:text-[#c2410c]',
    indigo: 'text-white light:text-[#0f172a]',
    purple: 'text-white light:text-[#0f172a]',
    rose: 'text-white light:text-[#0f172a]'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 ${cardBgMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className={`text-2xl font-extrabold mt-1 tracking-tight ${valueColorMap[color]}`}>{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 light:text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBgMap[color]}`}>
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
