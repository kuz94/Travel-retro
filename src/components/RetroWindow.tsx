import React from 'react';

interface Props {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export default function RetroWindow({ title, icon = '🪟', children, className = '', onClose }: Props) {
  return (
    <div className={`retro-card ${className}`}>
      <div className="retro-titlebar select-none">
        <span>{icon} {title}</span>
        <div className="flex gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="retro-btn retro-btn-sm font-bold px-2 text-black"
              style={{ minWidth: 20 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
