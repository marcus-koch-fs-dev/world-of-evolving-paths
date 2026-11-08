import type { ReactNode } from 'react';
import { type Orientation, VIEW_LEVELS } from 'world-of-evolving-paths';
import { toggledLevels } from '../app-logic/levels';
import type { SettingsValues } from '../hooks/useDemoSettings';

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
  values: SettingsValues;
  /** One or more settings changed. */
  onChange: (patch: Partial<SettingsValues>) => void;
  /** More settings below, for example the background panel. */
  children?: ReactNode;
};

type FlagKey = 'wavy' | 'pointsLocked' | 'animate';

const FLAGS: { key: FlagKey; label: string }[] = [
  { key: 'wavy', label: 'Wave on the lines' },
  { key: 'pointsLocked', label: 'Lock points' },
  { key: 'animate', label: 'Animate' },
];

/** The demo's own settings. They are not part of the library: the app decides what to offer. */
export function SettingsPanel({ values, onChange, children }: Props) {
  return (
    <div className="demo-settings">
      {FLAGS.map(({ key, label }) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={values[key]}
            onChange={(event) => onChange({ [key]: event.target.checked })}
          />
          {label}
        </label>
      ))}

      <fieldset>
        <legend>Levels in the view bar</legend>
        {VIEW_LEVELS.map((option) => (
          <label key={option.level}>
            <input
              type="checkbox"
              checked={values.levels.includes(option.level)}
              onChange={(event) =>
                onChange({ levels: toggledLevels(values.levels, option.level, event.target.checked) })
              }
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <label>
        Map orientation
        <select
          value={values.orientation}
          onChange={(event) => onChange({ orientation: event.target.value as Orientation })}
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
        <select value={values.locale} onChange={(event) => onChange({ locale: event.target.value })}>
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
      {children}
    </div>
  );
}
