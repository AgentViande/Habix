import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-center mb-4 text-3xl sm:text-4xl shadow-inner">
        {emoji ? <span>{emoji}</span> : icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};
