import type { ReactNode } from 'react';
import { type Orientation, VIEW_LEVELS, type ViewLevel } from 'world-of-evolving-paths';

export const LOCALES = [
  { locale: 'de', label: 'European · 2.11.' },
  { locale: 'en-GB', label: 'British · 2/11' },
  { locale: 'en-US', label: 'American · 11/2' },
];

const ORIENTATIONS: { orientation: Orientation; label: string }[] = [
  { orientation: 'auto', label: 'Auto (vertical on a tall screen)' },
  { orientation: 'horizontal', label: 'Horizontal' },
  { orientation: 'horizontal-inverted', label: 'Horizontal inverted' },
  { orientation: 'vertical', label: 'Vertical' },
  { orientation: 'vertical-inverted', label: 'Vertical inverted' },
];

type Props = {
  orientation: Orientation;
  onOrientationChange: (orientation: Orientation) => void;
  wavy: boolean;
  pointsLocked: boolean;
  animate: boolean;
  /** The levels the view bar offers. */
  levels: ViewLevel[];
  locale: string;
  onWavyChange: (wavy: boolean) => void;
  onPointsLockedChange: (locked: boolean) => void;
  onAnimateChange: (animate: boolean) => void;
  onLevelsChange: (levels: ViewLevel[]) => void;
  onLocaleChange: (locale: string) => void;
  /** More settings below, for example the background panel. */
  children?: ReactNode;
};

/** The demo's own settings. They are not part of the library: the app decides what to offer. */
export function SettingsPanel(props: Props) {
  const toggleLevel = (level: ViewLevel, on: boolean) => {
    const next = on ? [...props.levels, level] : props.levels.filter((existing) => existing !== level);
    // Keep the order of the view bar, and always at least one level
    const ordered = VIEW_LEVELS.map((option) => option.level).filter((candidate) => next.includes(candidate));
    if (ordered.length > 0) props.onLevelsChange(ordered);
  };

  return (
    <div className="demo-settings">
      <label>
        <input type="checkbox" checked={props.wavy} onChange={(event) => props.onWavyChange(event.target.checked)} />
        Wave on the lines
      </label>
      <label>
        <input
          type="checkbox"
          checked={props.pointsLocked}
          onChange={(event) => props.onPointsLockedChange(event.target.checked)}
        />
        Lock points
      </label>
      <label>
        <input
          type="checkbox"
          checked={props.animate}
          onChange={(event) => props.onAnimateChange(event.target.checked)}
        />
        Animate
      </label>

      <fieldset>
        <legend>Levels in the view bar</legend>
        {VIEW_LEVELS.map((option) => (
          <label key={option.level}>
            <input
              type="checkbox"
              checked={props.levels.includes(option.level)}
              onChange={(event) => toggleLevel(option.level, event.target.checked)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <label>
        Map orientation
        <select
          value={props.orientation}
          onChange={(event) => props.onOrientationChange(event.target.value as Orientation)}
        >
          {ORIENTATIONS.map((option) => (
            <option key={option.orientation} value={option.orientation}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Date format
        <select value={props.locale} onChange={(event) => props.onLocaleChange(event.target.value)}>
          {LOCALES.map((option) => (
            <option key={option.locale} value={option.locale}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="demo-hint">
        Double-click empty space to add a point. Click a point for its menu. Keys: M center, E fit.
      </p>
      {props.children}
    </div>
  );
}
