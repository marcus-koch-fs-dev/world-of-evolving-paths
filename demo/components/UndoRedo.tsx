export type UndoRedoProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

/** Two buttons in the bar: one step back and one step forward in the changes the user made. */
export function UndoRedo({ canUndo, canRedo, onUndo, onRedo }: UndoRedoProps) {
  return (
    <div className="demo-undo-redo">
      <button
        type="button"
        className="pw-button"
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        onClick={onUndo}
      >
        ↶
      </button>
      <button
        type="button"
        className="pw-button"
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
        disabled={!canRedo}
        onClick={onRedo}
      >
        ↷
      </button>
    </div>
  );
}
