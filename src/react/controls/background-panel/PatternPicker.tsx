import type { BackgroundPattern } from '../../../map/index.js';

const PATTERNS: { pattern: BackgroundPattern; label: string }[] = [
  { pattern: 'none', label: 'Blank' },
  { pattern: 'stars', label: 'Stars' },
  { pattern: 'hex', label: 'Hex' },
  { pattern: 'dots', label: 'Dots' },
];

type Props = { value: BackgroundPattern; onChange: (pattern: BackgroundPattern) => void };

/** Buttons to choose the pattern of the background. */
export function PatternPicker({ value, onChange }: Props) {
  return (
    <div className="pw-segments">
      {PATTERNS.map((option) => (
        <button
          key={option.pattern}
          type="button"
          className={`pw-button${value === option.pattern ? ' is-active' : ''}`}
          onClick={() => onChange(option.pattern)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
