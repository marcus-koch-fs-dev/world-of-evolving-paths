import type { ReactNode } from 'react';

type Props = {
  wavy: boolean;
  pointsLocked: boolean;
  animate: boolean;
  onWavyChange: (wavy: boolean) => void;
  onPointsLockedChange: (locked: boolean) => void;
  onAnimateChange: (animate: boolean) => void;
  /** More settings below the switches, for example the background panel. */
  children?: ReactNode;
};

/** The demo's own settings. They are not part of the library: the app decides what to offer. */
export function SettingsPanel(props: Props) {
  return (
    <aside className="demo-settings">
      <h3>Settings</h3>
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
      <p className="demo-hint">
        Double-click empty space to add a point. Click a point for its menu. Keys: M center, E fit.
      </p>
      {props.children}
    </aside>
  );
}
