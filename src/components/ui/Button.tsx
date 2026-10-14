import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  iconOnly?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  iconOnly = false,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeClasses: Record<ButtonSize, string> = {
    sm: iconOnly ? 'w-8 h-8 rounded-lg' : 'h-8 px-3 text-xs rounded-lg gap-1.5',
    md: iconOnly ? 'w-11 h-11 rounded-xl' : 'h-11 px-4 text-sm rounded-xl gap-2',
    lg: iconOnly ? 'w-13 h-13 rounded-2xl' : 'h-13 px-6 text-base rounded-2xl gap-2.5',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] shadow-sm shadow-indigo-500/20 active:bg-indigo-700',
    secondary:
      'bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)]',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
    danger: 'bg-[var(--danger)] text-white hover:bg-red-600 shadow-sm shadow-red-500/20',
    icon: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.1 }}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
