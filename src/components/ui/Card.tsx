import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glow';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-2xl border p-4 sm:p-5 transition-all duration-200';

  const variantClasses: Record<string, string> = {
    default:
      'bg-[var(--bg-secondary)] border-[var(--border-subtle)] shadow-sm hover:border-[var(--border-default)]',
    elevated: 'bg-[var(--bg-elevated)] border-[var(--border-default)] shadow-xl shadow-black/20',
    interactive:
      'bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)] cursor-pointer hover:shadow-md hover:-translate-y-0.5',
    glow: 'bg-[var(--bg-secondary)] border-indigo-500/40 shadow-lg shadow-indigo-500/10 hover:border-indigo-500/70',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
