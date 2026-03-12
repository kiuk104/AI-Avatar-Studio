import React from 'react';

interface ColorSwatchProps {
  colors: Record<string, string>;
  selected: string;
  onSelect: (name: string) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  colors,
  selected,
  onSelect,
  label,
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';

  return (
    <div className="space-y-2">
      {label && (
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{label}</span>
      )}
      <div className="flex flex-wrap gap-2">
        {Object.entries(colors).map(([name, color]) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`${sizeClass} rounded-full border-2 transition-all hover:scale-110 ${
              selected === name
                ? 'border-emerald-500 scale-110 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
            title={name}
          />
        ))}
      </div>
    </div>
  );
};
