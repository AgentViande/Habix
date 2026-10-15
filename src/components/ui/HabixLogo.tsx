import React from 'react';
import { motion } from 'framer-motion';

export interface HabixLogoProps {
  size?: number;
  className?: string;
  withBackground?: boolean;
  animated?: boolean;
}

export const HabixLogo: React.FC<HabixLogoProps> = ({
  size = 40,
  className = '',
  withBackground = true,
  animated = false,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`select-none flex-shrink-0 ${className}`}
      fill="none"
      aria-label="Habix Logo"
    >
      <defs>
        <linearGradient id="habixLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="habixLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="45%" stopColor="#7c3aed" />
          <stop offset="85%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>

        <linearGradient id="habixFlameAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="60%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        <radialGradient id="habixCenterGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>

        <filter id="habixDropGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#6366f1" floodOpacity="0.4" />
        </filter>
      </defs>

      {withBackground && (
        <>
          <circle cx="256" cy="256" r="210" fill="url(#habixCenterGlow)" />
          <rect
            x="32"
            y="32"
            width="448"
            height="448"
            rx="112"
            fill="url(#habixLogoBg)"
            stroke="url(#habixLogoGrad)"
            strokeWidth="5"
            strokeOpacity="0.4"
          />
          <rect
            x="36"
            y="36"
            width="440"
            height="440"
            rx="108"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.1"
          />
        </>
      )}

      <g filter={withBackground ? 'url(#habixDropGlow)' : undefined}>
        {/* Left Pillar */}
        {animated ? (
          <motion.rect
            x="124"
            y="126"
            width="56"
            height="260"
            rx="28"
            fill="url(#habixLogoGrad)"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ originY: '100%' }}
          />
        ) : (
          <rect x="124" y="126" width="56" height="260" rx="28" fill="url(#habixLogoGrad)" />
        )}

        {/* Left Pillar Highlight */}
        <rect x="132" y="136" width="14" height="140" rx="7" fill="#ffffff" fillOpacity="0.22" />

        {/* Central Bridge + Rising Checkmark/Flame Wing */}
        {animated ? (
          <motion.path
            d="M172 232 C195 232 216 235 240 248 L258 259 C280 272 296 288 312 312 C330 262 360 196 400 134 C406 124 414 122 418 132 C422 142 418 156 410 172 C374 246 342 322 322 376 C316 392 302 400 286 398 C272 396 260 384 250 368 L226 332 C214 314 196 302 172 298 Z"
            fill="url(#habixLogoGrad)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeInOut' }}
          />
        ) : (
          <path
            d="M172 232 C195 232 216 235 240 248 L258 259 C280 272 296 288 312 312 C330 262 360 196 400 134 C406 124 414 122 418 132 C422 142 418 156 410 172 C374 246 342 322 322 376 C316 392 302 400 286 398 C272 396 260 384 250 368 L226 332 C214 314 196 302 172 298 Z"
            fill="url(#habixLogoGrad)"
          />
        )}

        {/* Dynamic Flame Spark */}
        {animated ? (
          <motion.path
            d="M294 330 C316 270 348 206 384 152 C372 188 348 248 334 290 C324 320 310 344 298 358 C292 352 290 340 294 330 Z"
            fill="url(#flameAccent)"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
        ) : (
          <path
            d="M294 330 C316 270 348 206 384 152 C372 188 348 248 334 290 C324 320 310 344 298 358 C292 352 290 340 294 330 Z"
            fill="url(#flameAccent)"
          />
        )}
      </g>

      {/* Sparkle Dot */}
      <circle cx="218" cy="214" r="8" fill="#ffffff" fillOpacity="0.85" />
    </svg>
  );
};
