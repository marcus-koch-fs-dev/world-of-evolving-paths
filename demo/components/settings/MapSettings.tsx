import { type Orientation, VIEW_LEVELS } from 'world-of-evolving-paths';
import { toggledLevels } from '../../app-logic/levels';
import type { SettingsValues } from '../../hooks/useDemoSettings';
import { Flag } from '../Flags';
import { Group } from './Group';

const ORIENTATIONS: { orientation: Orientation; label: string }[] = [
  { orientation: 'auto', label: 'Auto (vertical on a tall screen)' },
  { orientation: 'horizontal', label: 'Horizontal' },
  { orientation: 'horizontal-inverted', label: 'Horizontal inverted' },
  { orientation: 'vertical', label: 'Vertical' },
  { orientation: 'vertical-inverted', label: 'Vertical inverted' },
];

type Props = { values: SettingsValues; onChange: (patch: Partial<SettingsValues>) => void };

/** The way time runs on the map and the levels you can switch to. */
export function MapSettings({ values, onChange }: Props) {
  return (
    <>
      <Group title="Direction of time">
        <select
          aria-label="Map orientation"
          value={values.orientation}
          onChange={(event) => onChange({ orientation: event.target.value as Orientation })}
        >
          {ORIENTATIONS.map((option) => (
            <option key={option.orientation} value={option.orientation}>
              {option.label}
            </option>
          ))}
        </select>
      </Group>

      <Group title="Levels" hint="The views you can switch to in the bar and the menu.">
        {VIEW_LEVELS.map((option) => (
          <Flag
            key={option.level}
            label={option.label}
            checked={values.levels.includes(option.level)}
            onChange={(on) => onChange({ levels: toggledLevels(values.levels, option.level, on) })}
          />
        ))}
      </Group>
    </>
  );
}
