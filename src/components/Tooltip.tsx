// src/components/Tooltip.tsx
import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  visible: boolean;
  className?: string;
}

export function Tooltip({ children, content, visible, className = '' }: TooltipProps) {
  if (!visible) return <>{children}</>;

  return (
    <>
      {children}
      {visible && (
        <div className={`absolute z-20 p-2 bg-[var(--color-card)] text-[var(--color-text-primary)] text-xs rounded-lg shadow-xl border border-[var(--color-border)] whitespace-pre-wrap max-w-64 bottom-full mb-2 left-1/2 -translate-x-1/2 ${className}`}>
          {content}
        </div>
      )}
    </>
  );
}
