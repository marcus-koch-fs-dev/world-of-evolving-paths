import { VIEW_LEVELS, type ViewLevel } from '../../../core/index.js';
import { LevelSwitch } from './LevelSwitch.js';
import './viewBar.css';

export type ViewBarProps = {
  /** Levels to offer. Default: day, week, month, half year, year. */
  levels?: readonly { level: ViewLevel; label: string }[];
  /** The active level, or null for the free view. */
  level: ViewLevel | null;
  onLevelChange: (level: ViewLevel | null) => void;
  /** Label of the button for the free view. Without it there is no such button. */
  freeLabel?: string;
  /** Label of the shown period, such as `CW 45, 2 Nov – 8 Nov 2026`. */
  periodLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  /** Zero-based page and the number of pages. The page buttons show when there are pages. */
  page?: number;
  pages?: number;
  onPageChange?: (page: number) => void;
  /** Shows a button that asks for another generated layout. */
  onReroll?: () => void;
  /** One dropdown for the level instead of one button per level. Saves room in a narrow bar. */
  compact?: boolean;
};

/** Switches between levels, moves through periods and pages. It holds no state: the app decides what each button does. */
export function ViewBar(props: ViewBarProps) {
  const { levels = VIEW_LEVELS, level, onLevelChange } = props;
  const pages = props.pages ?? 0;
  const page = props.page ?? 0;

  return (
    <nav className="pw-view-bar" aria-label="View">
      <LevelSwitch
        levels={levels}
        level={level}
        freeLabel={props.freeLabel}
        compact={props.compact}
        onChange={onLevelChange}
      />

      {level !== null && (
        <div className="pw-view-group">
          <button type="button" className="pw-button" aria-label="Previous period" onClick={props.onPrevious}>
            ◀
          </button>
          <span className="pw-view-label">{props.periodLabel}</span>
          <button type="button" className="pw-button" aria-label="Next period" onClick={props.onNext}>
            ▶
          </button>
          <button type="button" className="pw-button" onClick={props.onToday}>
            Today
          </button>
        </div>
      )}

      {pages > 0 && (
        <div className="pw-view-group" title="Other graphs in the same view">
          <button
            type="button"
            className="pw-button"
            aria-label="Previous page"
            disabled={page <= 0}
            onClick={() => props.onPageChange?.(page - 1)}
          >
            ▲
          </button>
          <span className="pw-view-label">
            Page {page + 1}/{pages}
          </span>
          <button
            type="button"
            className="pw-button"
            aria-label="Next page"
            disabled={page >= pages - 1}
            onClick={() => props.onPageChange?.(page + 1)}
          >
            ▼
          </button>
        </div>
      )}

      {props.onReroll && level !== null && (
        <div className="pw-view-group">
          <button type="button" className="pw-button" title="Generate another layout" onClick={props.onReroll}>
            Reroll
          </button>
        </div>
      )}
    </nav>
  );
}
