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
  const cardStyles = {
    sky: {
      card: 'bg-[#eef7ff] border-[#bde0fe] text-[#004085] dark:bg-[#07193b] dark:border-[#0c316a] dark:text-sky-400',
      title: 'text-[#004085] dark:text-sky-400',
      value: 'text-[#0a192f] dark:text-white',
      subtitle: 'text-[#475569] dark:text-slate-400',
      iconBox: 'bg-[#bde0fe] text-[#0070f3] dark:bg-[#0070f3] dark:text-white',
      watermark: 'text-[#0070f3] opacity-25 dark:opacity-10'
    },
    emerald: {
      card: 'bg-[#e8fbf4] border-[#a7f3d0] text-[#046c4e] dark:bg-[#03261a] dark:border-[#084d34] dark:text-emerald-400',
      title: 'text-[#046c4e] dark:text-emerald-400',
      value: 'text-[#0a192f] dark:text-white',
      subtitle: 'text-[#475569] dark:text-slate-400',
      iconBox: 'bg-[#a3f3d1] text-[#059669] dark:bg-[#10b981] dark:text-white',
      watermark: 'text-[#059669] opacity-25 dark:opacity-10'
    },
    purple: {
      card: 'bg-[#f5efff] border-[#ddd6fe] text-[#5b21b6] dark:bg-[#1f0a38] dark:border-[#431475] dark:text-purple-300',
      title: 'text-[#5b21b6] dark:text-purple-300',
      value: 'text-[#0a192f] dark:text-white',
      subtitle: 'text-[#475569] dark:text-slate-400',
      iconBox: 'bg-[#e9d5ff] text-[#7c3aed] dark:bg-[#8b5cf6] dark:text-white',
      watermark: 'text-[#7c3aed] opacity-25 dark:opacity-10'
    },
    amber: {
      card: 'bg-[#fff4e6] border-[#fed7aa] text-[#c2410c] dark:bg-[#331505] dark:border-[#6b2d0b] dark:text-[#f97316]',
      title: 'text-[#c2410c] dark:text-[#f97316]',
      value: 'text-[#ea580c] dark:text-[#f97316]',
      subtitle: 'text-[#c2410c]/80 dark:text-slate-400',
      iconBox: 'bg-[#ffedd5] text-[#ea580c] dark:bg-[#f97316] dark:text-white',
      watermark: 'text-[#ea580c] opacity-25 dark:opacity-10'
    },
    indigo: {
      card: 'bg-[#e0e7ff] border-[#c7d2fe] text-[#3730a3] dark:bg-[#121340] dark:border-[#222475] dark:text-indigo-400',
      title: 'text-[#3730a3] dark:text-indigo-400',
      value: 'text-[#0a192f] dark:text-white',
      subtitle: 'text-[#475569] dark:text-slate-400',
      iconBox: 'bg-[#c7d2fe] text-[#4f46e5] dark:bg-[#6366f1] dark:text-white',
      watermark: 'text-[#4f46e5] opacity-25 dark:opacity-10'
    },
    rose: {
      card: 'bg-[#ffe4e6] border-[#fecdd3] text-[#9f1239] dark:bg-[#2e0917] dark:border-[#5e1230] dark:text-rose-400',
      title: 'text-[#9f1239] dark:text-rose-400',
      value: 'text-[#0a192f] dark:text-white',
      subtitle: 'text-[#475569] dark:text-slate-400',
      iconBox: 'bg-[#fecdd3] text-[#e11d48] dark:bg-[#f43f5e] dark:text-white',
      watermark: 'text-[#e11d48] opacity-25 dark:opacity-10'
    }
  };

  const style = cardStyles[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${style.card}`}>
      {/* Background Watermark Icon matching reference mockup */}
      <Icon className={`absolute -right-2 -bottom-2 w-20 h-20 pointer-events-none ${style.watermark}`} />

      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${style.iconBox}`}>
          <Icon className="w-7 h-7" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-extrabold uppercase tracking-wider truncate ${style.title}`}>{title}</p>
          <h3 className={`text-2xl sm:text-3xl font-black mt-0.5 tracking-tight truncate ${style.value}`}>{value}</h3>
          {subtitle && <p className={`text-xs mt-0.5 font-semibold truncate ${style.subtitle}`}>{subtitle}</p>}
        </div>
      </div>

      {trend && (
        <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 relative z-10">
          {trend}
        </div>
      )}
    </div>
  );
};
