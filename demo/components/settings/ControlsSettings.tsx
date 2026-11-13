import { Icon } from 'world-of-evolving-paths/react';
import {
  BAR_ITEMS,
  BAR_PRESETS,
  barItemsFor,
  MENU_CLOSE_CHOICES,
  type MenuClose,
  movedBarItem,
  presetOf,
  toggledBarItems,
  withHiddenKept,
} from '../../app-logic/controls';
import type { SettingsValues } from '../../hooks/useDemoSettings';
import { useDragReorder } from '../../hooks/useDragReorder';
import { Flag } from '../Flags';
import { Group } from './Group';

type Props = {
  values: SettingsValues;
  onChange: (patch: Partial<SettingsValues>) => void;
  /** In map mode what only the editor uses (undo and redo) is not offered. */
  editing: boolean;
};

/** Which controls sit in the bar and in which order, and how the menu behaves. */
export function ControlsSettings({ values, onChange, editing }: Props) {
  const preset = presetOf(values.barItems);
  const shown = barItemsFor(values.barItems, editing);
  const { drag, register, start } = useDragReorder(shown, (next) =>
    onChange({ barItems: withHiddenKept(next, values.barItems) }),
  );
  // The ones in the bar first, in their order, then the others
  const offered = BAR_ITEMS.filter((item) => editing || !item.editorOnly);
  const ordered = [
    ...shown.flatMap((id) => offered.filter((item) => item.id === id)),
    ...offered.filter((item) => !shown.includes(item.id)),
  ];

  return (
    <>
      <Group
        title="Bar"
        hint="Everything is always in the menu. Tick what you also want in the bar, and drag it to set the order."
      >
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
        {ordered.map((item) => {
          const chosen = shown.includes(item.id);
          const position = shown.indexOf(item.id);
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
                    onChange({ barItems: withHiddenKept(movedBarItem(shown, item.id, step), values.barItems) });
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
      </Group>

      <Group title="Menu">
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
      </Group>
    </>
  );
}
