import React from 'react';
import { motion } from 'framer-motion';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'rgba(129, 140, 248, 0.15)',
  iconColor = '#818cf8',
  trend,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all shadow-sm flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {title}
        </span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tabular-nums tracking-tight">
            {value}
          </span>
          {trend && (
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                trend.isPositive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};
