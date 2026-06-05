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
        {Object.entries(colors).map(([name, color]) => {
          const isSelected = selected === name;
          // Empty color = sentinel (None / Match Hair): show a ⊘-style outline chip instead of a
          // filled circle. Tooltip carries the real meaning. (Distinct chips are a later polish.)
          if (!color) {
            return (
              <button
                key={name}
                onClick={() => onSelect(name)}
                className={`${sizeClass} rounded-full border-2 grid place-items-center transition-all hover:scale-110 bg-zinc-800/60 ${
                  isSelected ? 'border-emerald-500 scale-110 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'border-zinc-700'
                }`}
                title={name}
              >
                <span className="text-zinc-400 text-xs leading-none">⊘</span>
              </button>
            );
          }
          return (
            <button
              key={name}
              onClick={() => onSelect(name)}
              className={`${sizeClass} rounded-full border-2 transition-all hover:scale-110 ${
                isSelected
                  ? 'border-emerald-500 scale-110 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              title={name}
            />
          );
        })}
      </div>
    </div>
  );
};
