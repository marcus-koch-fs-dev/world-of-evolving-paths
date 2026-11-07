type Props = {
  wavy: boolean;
  dotsLocked: boolean;
  onWavyChange: (wavy: boolean) => void;
  onDotsLockedChange: (locked: boolean) => void;
};

/** The demo's own switches. They are not part of the library: the app decides what to offer. */
export function DemoToolbar({ wavy, dotsLocked, onWavyChange, onDotsLockedChange }: Props) {
  return (
    <div className="demo-toolbar">
      <strong>World of Evolving Paths</strong>
      <label>
        <input type="checkbox" checked={wavy} onChange={(event) => onWavyChange(event.target.checked)} />
        Wave
      </label>
      <label>
        <input type="checkbox" checked={dotsLocked} onChange={(event) => onDotsLockedChange(event.target.checked)} />
        Lock points
      </label>
      <span className="demo-hint">
        Double-click empty space to add a point. Click a point for its menu. Keys: M center, E fit.
      </span>
    </div>
  );
}
