import React from 'react';

interface VisionLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const VisionLogo: React.FC<VisionLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric 'V' Monogram Emblem */}
      <div
        className={`${iconSizes[size]} rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-xs p-1.5 shrink-0 relative overflow-hidden`}
      >
        {/* Geometric light refraction line */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />
        
        {/* Sharp SVG Geometric V Mark */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white drop-shadow-2xs"
        >
          <path
            d="M3 4.5L12 20.5L21 4.5H16.8L12 13.8L7.2 4.5H3Z"
            fill="currentColor"
          />
          <path
            d="M9 4.5L12 10.5L15 4.5H18L12 16.5L6 4.5H9Z"
            fill="white"
            fillOpacity="0.4"
          />
        </svg>
      </div>

      {/* Typographic Wordmark */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-[0.2em] uppercase text-slate-900 ${textSizes[size]} font-sans`}
          >
            VISION
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
        </div>
        {showSubtitle && (
          <span className="text-[9px] font-mono tracking-widest text-slate-600 uppercase font-medium mt-0.5">
            ENTERPRISE SUITE
          </span>
        )}
      </div>
    </div>
  );
};
