export type DemoMode = 'edit' | 'map';

type Props = { mode: DemoMode; onChange: (mode: DemoMode) => void };

/** Switches the demo between the editor (everything on) and the map as an end user sees it (read only, few controls). */
export function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="demo-mode">
      <button
        type="button"
        className={`pw-button${mode === 'edit' ? ' is-active' : ''}`}
        onClick={() => onChange('edit')}
      >
        Editor
      </button>
      <button
        type="button"
        className={`pw-button${mode === 'map' ? ' is-active' : ''}`}
        onClick={() => onChange('map')}
      >
        Map
      </button>
    </div>
  );
}
