import { ACCENTS, isReadyMade } from '../../app-logic/accent';
import { UI_SIZES } from '../../app-logic/uiSize';
import type { SettingsValues } from '../../hooks/useDemoSettings';
import { Flag } from '../Flags';
import { Group } from './Group';

export const LOCALES = [
  { locale: 'de', label: 'European · 2.11.' },
  { locale: 'en-GB', label: 'British · 2/11' },
  { locale: 'en-US', label: 'American · 11/2' },
];

type Props = { values: SettingsValues; onChange: (patch: Partial<SettingsValues>) => void };

/** How big the controls are, how dates look, and whether things move. */
export function DisplaySettings({ values, onChange }: Props) {
  return (
    <>
      <Group
        title="Size"
        hint="Small is tiny and clean. Regular has the names under the symbols. Large is a little bigger. Changes show when you close this window."
      >
        <div className="demo-choice">
          {UI_SIZES.map((choice) => (
            <button
              key={choice.value}
              type="button"
              className={`pw-button${values.uiSize === choice.value ? ' is-active' : ''}`}
              onClick={() => onChange({ uiSize: choice.value })}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Accent color" hint="The color of what is switched on or selected.">
        <div className="demo-swatches">
          {ACCENTS.map((accent) => (
            <button
              key={accent.id}
              type="button"
              className={`demo-swatch${values.accent === accent.color ? ' is-on' : ''}`}
              style={{ background: accent.color }}
              aria-label={accent.label}
              aria-pressed={values.accent === accent.color}
              title={accent.label}
              onClick={() => onChange({ accent: accent.color })}
            />
          ))}
          <label className={`demo-own-color${isReadyMade(values.accent) ? '' : ' is-on'}`}>
            <input
              type="color"
              value={values.accent}
              aria-label="Own color"
              onChange={(event) => onChange({ accent: event.target.value })}
            />
            Own color
          </label>
        </div>
        <Flag label="Glow" checked={values.glow} onChange={(glow) => onChange({ glow })} />
      </Group>

      <Group title="Date format">
        <div className="demo-choice">
          {LOCALES.map((option) => (
            <button
              key={option.locale}
              type="button"
              className={`pw-button${values.locale === option.locale ? ' is-active' : ''}`}
              onClick={() => onChange({ locale: option.locale })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Bars and menus">
        <Flag label="Transparent" checked={values.transparent} onChange={(transparent) => onChange({ transparent })} />
      </Group>

      <Group
        title="Keyboard"
        hint="Single keys such as 1, 2, 3, T, M and E. Switch them off if they get in the way, for example with speech control."
      >
        <Flag
          label="Keyboard shortcuts"
          checked={values.keyboardShortcuts}
          onChange={(keyboardShortcuts) => onChange({ keyboardShortcuts })}
        />
      </Group>

      <Group title="Zoom">
        <Flag
          label="Remember the zoom of each view"
          checked={values.rememberZoom}
          onChange={(rememberZoom) => onChange({ rememberZoom })}
        />
      </Group>

      <Group title="Motion">
        <Flag label="Animate" checked={values.animate} onChange={(animate) => onChange({ animate })} />
      </Group>
    </>
  );
}
