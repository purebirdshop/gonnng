import React from 'react';

export interface ProfileProgressRingProps {
  progress?: number | null; // 0 - 100
  status?: 'idle' | 'uploading' | 'saving' | 'complete' | 'error';
  size?: number; // Outer container size in pixels (e.g. 112 for profile hero, 24 for header)
  strokeWidth?: number; // Border stroke width in pixels
  children: React.ReactNode;
  className?: string;
  showPercentTooltip?: boolean;
}

export const ProfileProgressRing: React.FC<ProfileProgressRingProps> = ({
  progress = null,
  status = 'idle',
  size = 80,
  strokeWidth = 3.5,
  children,
  className = '',
  showPercentTooltip = false
}) => {
  const isProcessActive = status && status !== 'idle' && progress !== null;
  const currentProgress = progress !== null ? Math.min(Math.max(progress, 0), 100) : 0;

  // Geometry calculation for SVG circle
  const radius = Math.max(1, (size - strokeWidth * 2) / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

  let strokeColor = '#F59E0B'; // Default Gonnng Gold
  let trackColor = 'rgba(209, 213, 219, 0.5)'; // gray-300 transparent

  if (status === 'complete') {
    strokeColor = '#10B981'; // Emerald 500
  } else if (status === 'error') {
    strokeColor = '#EF4444'; // Red 500
  }

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={isProcessActive ? `Post upload & sync: ${currentProgress}% (${status})` : undefined}
    >
      {/* SVG Circular Progress Wheel Ring */}
      {isProcessActive && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10 overflow-visible"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Active progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
            style={{
              filter: status === 'uploading' || status === 'saving'
                ? 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.6))'
                : status === 'complete'
                ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))'
                : 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))'
            }}
          />
        </svg>
      )}

      {/* Embedded Avatar / Child Content */}
      <div 
        className="w-full h-full rounded-full flex items-center justify-center overflow-hidden z-0"
        style={{
          padding: isProcessActive ? `${strokeWidth + 1.5}px` : '0px',
          transition: 'padding 0.2s ease'
        }}
      >
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
          {children}
        </div>
      </div>

      {/* Optional Progress % Indicator Badge */}
      {isProcessActive && showPercentTooltip && (
        <div 
          className={`absolute -bottom-2 z-20 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black shadow-md border flex items-center gap-1 ${
            status === 'error'
              ? 'bg-red-600 text-white border-red-400 animate-bounce'
              : status === 'complete'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-[#F59E0B] text-black border-amber-300'
          }`}
        >
          {status === 'error' ? (
            <span>!</span>
          ) : status === 'complete' ? (
            <span>✓</span>
          ) : (
            <span>{currentProgress}%</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileProgressRing;
