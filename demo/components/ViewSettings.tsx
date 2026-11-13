import type { ReactNode } from 'react';
import { type Orientation, VIEW_LEVELS } from 'world-of-evolving-paths';
import { Icon } from 'world-of-evolving-paths/react';
import {
  BAR_ITEMS,
  BAR_PRESETS,
  MENU_CLOSE_CHOICES,
  type MenuClose,
  movedBarItem,
  presetOf,
  toggledBarItems,
} from '../app-logic/controls';
import { toggledLevels } from '../app-logic/levels';
import { MAX_SCALE, MIN_SCALE, UI_SIZES } from '../app-logic/uiSize';
import type { SettingsValues } from '../hooks/useDemoSettings';
import { useDragReorder } from '../hooks/useDragReorder';
import { Flag } from './Flags';

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
  onChange: (patch: Partial<SettingsValues>) => void;
  /** More settings below, for example the background panel. */
  children?: ReactNode;
};

/** What every user may change about how the map looks and how the controls are arranged. */
export function ViewSettings({ values, onChange, children }: Props) {
  const preset = presetOf(values.barItems);
  const { drag, register, start } = useDragReorder(values.barItems, (barItems) => onChange({ barItems }));
  // The ones in the bar first, in their order, then the others
  const ordered = [
    ...values.barItems.flatMap((id) => BAR_ITEMS.filter((item) => item.id === id)),
    ...BAR_ITEMS.filter((item) => !values.barItems.includes(item.id)),
  ];
  return (
    <div className="demo-settings">
      <fieldset>
        <legend>Size</legend>
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
        {values.uiSize === 'custom' && (
          <label>
            {Math.round(values.uiScale)} %
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={5}
              value={values.uiScale}
              onChange={(event) => onChange({ uiScale: Number(event.target.value) })}
            />
          </label>
        )}
      </fieldset>

      <fieldset>
        <legend>Controls</legend>
        <div className="demo-choice">
          <button
            type="button"
            className={`pw-button${preset === 'bar' ? ' is-active' : ''}`}
            onClick={() => onChange({ barItems: [...BAR_PRESETS.bar] })}
          >
            Bar
          </button>
          <button
            type="button"
            className={`pw-button${preset === 'tiles' ? ' is-active' : ''}`}
            onClick={() => onChange({ barItems: [...BAR_PRESETS.tiles] })}
          >
            Tiles only
          </button>
        </div>
        <p className="demo-hint">
          Everything is always in the menu. Tick what you also want in the bar, and set the order.
        </p>
        {ordered.map((item) => {
          const chosen = values.barItems.includes(item.id);
          const position = values.barItems.indexOf(item.id);
          const dragging = drag?.id === item.id;
          const target = drag !== null && chosen && position === drag.over && !dragging;
          return (
            <div
              key={item.id}
              ref={chosen ? register(item.id) : undefined}
              className={`demo-order-row${dragging ? ' is-dragging' : ''}${target ? ' is-target' : ''}`}
            >
              {chosen ? (
                <button
                  type="button"
                  className="demo-grip"
                  aria-label={`Place of ${item.label} in the bar. Drag it, or use the arrow keys.`}
                  title="Drag to change the place in the bar"
                  onPointerDown={start(item.id)}
                  onKeyDown={(event) => {
                    const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
                    if (step === 0) return;
                    event.preventDefault();
                    onChange({ barItems: movedBarItem(values.barItems, item.id, step) });
                  }}
                >
                  <Icon name="grip" />
                </button>
              ) : (
                <span className="demo-grip-space" />
              )}
              <Flag
                label={item.label}
                checked={chosen}
                onChange={(on) => onChange({ barItems: toggledBarItems(values.barItems, item.id, on) })}
              />
            </div>
          );
        })}
        <label>
          Close the menu after a tap
          <select
            value={values.menuClose}
            onChange={(event) => onChange({ menuClose: event.target.value as MenuClose })}
          >
            {MENU_CLOSE_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <Flag label="Animate" checked={values.animate} onChange={(animate) => onChange({ animate })} />

      <fieldset>
        <legend>Levels in the view bar</legend>
        {VIEW_LEVELS.map((option) => (
          <Flag
            key={option.level}
            label={option.label}
            checked={values.levels.includes(option.level)}
            onChange={(on) => onChange({ levels: toggledLevels(values.levels, option.level, on) })}
          />
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
      {children}
    </div>
  );
}
