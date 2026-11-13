import { Fragment, type ReactNode } from 'react';
import { VIEW_LEVELS, type ViewLevel } from '../../../core/index.js';
import { Icon } from '../../icons/Icon.js';
import { LevelSwitch } from './LevelSwitch.js';
import { PeriodLabel } from './PeriodLabel.js';
import './viewBar.css';

/** The two parts of the bar: the level buttons, and the period with its arrows, Today and pages. */
export type ViewBarPart = 'levels' | 'period';

const DEFAULT_PARTS: readonly ViewBarPart[] = ['levels', 'period'];

export type ViewBarProps = {
  /** Which parts to show and in which order. Default: the levels, then the period. Use it to put other controls in between. */
  parts?: readonly ViewBarPart[];
  /** Levels to offer. Default: week, month, year (`VIEW_LEVELS`). */
  levels?: readonly { level: ViewLevel; label: string; title?: string }[];
  /** The active level, or null for the free view. */
  level: ViewLevel | null;
  onLevelChange: (level: ViewLevel | null) => void;
  /** Label of the button for the free view. Without it there is no such button. */
  freeLabel?: string;
  /** Puts the button for the free view after the levels instead of before them. */
  freeLast?: boolean;
  /** Label of the shown period, such as `CW 45, 2 Nov – 8 Nov 2026`. */
  periodLabel?: string;
  /** A date inside the shown period, as `YYYY-MM-DD`. The date picker starts there. */
  date?: string;
  /** The user picked a date (`YYYY-MM-DD`). With it the period label is a button that opens a date picker. */
  onDateChange?: (date: string) => void;
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
  /** Only the period with its arrows and today, and the two page arrows without a label. Levels and reroll then go somewhere else, such as a `TilePanel`. */
  periodOnly?: boolean;
  /** With `periodOnly`: still show the level buttons (or dropdown). */
  levelChips?: boolean;
  /** Show the arrows and Today around the period label. Default true. Without them only the label stays. */
  navigation?: boolean;
  /** Puts the two arrows in front of the levels instead of around the period: `◀ ▶  levels  period  Today`. */
  arrowsFirst?: boolean;
  /** Your own control in place of the period label, for example a picker for the period. */
  periodSlot?: ReactNode;
  /** Your own control right after the levels, for example a counter for how many years the year view spans. It belongs to the levels part: it is not shown when `parts` leaves `'levels'` out. */
  afterLevels?: ReactNode;
};

/** Switches between levels, moves through periods and pages. It holds no state: the app decides what each button does. */
export function ViewBar(props: ViewBarProps) {
  const { levels = VIEW_LEVELS, level, onLevelChange } = props;
  const pages = props.pages ?? 0;
  const page = props.page ?? 0;
  const previous = (
    <button type="button" className="pw-button" aria-label="Previous period" onClick={props.onPrevious}>
      <Icon name="previous" />
    </button>
  );
  const next = (
    <button type="button" className="pw-button" aria-label="Next period" onClick={props.onNext}>
      <Icon name="next" />
    </button>
  );
  const label = props.periodSlot ?? (
    <PeriodLabel label={props.periodLabel} date={props.date} onDateChange={props.onDateChange} />
  );
  const today = (
    <button type="button" className="pw-button" onClick={props.onToday}>
      Today
    </button>
  );

  const levelsPart = (!props.periodOnly || props.levelChips) && (
    <LevelSwitch
      levels={levels}
      level={level}
      freeLabel={props.freeLabel}
      freeLast={props.freeLast}
      compact={props.compact}
      onChange={onLevelChange}
    />
  );

  const periodPart = (
    <>
      {props.arrowsFirst && props.navigation !== false && level !== null && (
        <div className="pw-view-group">
          {previous}
          {next}
        </div>
      )}

      {level !== null &&
        (props.navigation === false ? (
          <div className="pw-view-group">{label}</div>
        ) : props.arrowsFirst ? (
          <div className="pw-view-group">
            {label}
            {today}
          </div>
        ) : (
          <div className="pw-view-group">
            {previous}
            {label}
            {next}
            {today}
          </div>
        ))}

      {pages > 0 && (
        <div className="pw-view-group" title={`Other graphs in the same view: page ${page + 1} of ${pages}`}>
          <button
            type="button"
            className="pw-button"
            aria-label="Previous page"
            disabled={page <= 0}
            onClick={() => props.onPageChange?.(page - 1)}
          >
            ▲
          </button>
          {!props.periodOnly && (
            <span className="pw-view-label">
              Page {page + 1}/{pages}
            </span>
          )}
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
    </>
  );

  return (
    <nav className="pw-view-bar" aria-label="View">
      {(props.parts ?? DEFAULT_PARTS).map((part) =>
        part === 'levels' ? (
          <Fragment key="levels">
            {levelsPart}
            {props.afterLevels}
          </Fragment>
        ) : (
          <Fragment key="period">{periodPart}</Fragment>
        ),
      )}

      {!props.periodOnly && props.onReroll && level !== null && (
        <div className="pw-view-group">
          <button type="button" className="pw-button" title="Generate another layout" onClick={props.onReroll}>
            Reroll
          </button>
        </div>
      )}
    </nav>
  );
}
