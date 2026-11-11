import type { ViewLevel } from '../../../core/index.js';

const FREE = 'free';

type Props = {
  levels: readonly { level: ViewLevel; label: string; title?: string }[];
  level: ViewLevel | null;
  /** Label of the button for the free view. Without it there is no such button. */
  freeLabel?: string;
  /** Puts the button for the free view after the levels instead of before them. */
  freeLast?: boolean;
  /** One dropdown instead of one button per level. */
  compact?: boolean;
  onChange: (level: ViewLevel | null) => void;
};

/** Chooses the level of the view, as buttons or as a dropdown. */
export function LevelSwitch({ levels, level, freeLabel, freeLast, compact, onChange }: Props) {
  if (compact) {
    return (
      <select
        className="pw-select"
        aria-label="Level"
        value={level ?? FREE}
        onChange={(event) => onChange(event.target.value === FREE ? null : (event.target.value as ViewLevel))}
      >
        {freeLabel && <option value={FREE}>{freeLabel}</option>}
        {levels.map((option) => (
          <option key={option.level} value={option.level}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const free = freeLabel && (
    <button type="button" className={`pw-button${level === null ? ' is-active' : ''}`} onClick={() => onChange(null)}>
      {freeLabel}
    </button>
  );

  return (
    <div className="pw-view-group">
      {!freeLast && free}
      {levels.map((option) => (
        <button
          key={option.level}
          type="button"
          title={option.title}
          className={`pw-button${level === option.level ? ' is-active' : ''}`}
          onClick={() => onChange(option.level)}
        >
          {option.label}
        </button>
      ))}
      {freeLast && free}
    </div>
  );
}
