import type { SettingsValues } from '../hooks/useDemoSettings';
import { Flag } from './Flags';

type Props = {
  values: SettingsValues;
  onChange: (patch: Partial<SettingsValues>) => void;
};

/** What only the editor needs: how points and lines behave while they are changed. */
export function EditorSettings({ values, onChange }: Props) {
  return (
    <div className="demo-settings">
      <Flag label="Lock points" checked={values.pointsLocked} onChange={(pointsLocked) => onChange({ pointsLocked })} />
      <Flag label="Snap to grid" checked={values.snap} onChange={(snap) => onChange({ snap })} />
      <Flag label="Wave on the lines" checked={values.wavy} onChange={(wavy) => onChange({ wavy })} />
      <Flag
        label="Close the point menu after a change"
        checked={values.pointMenuCloses}
        onChange={(pointMenuCloses) => onChange({ pointMenuCloses })}
      />
      <p className="demo-hint">
        Double-click empty space to add a point. Click a point for its menu. Keys: M center, E fit.
      </p>
    </div>
  );
}
