import { type ReactNode, useEffect, useId, useRef } from 'react';
import { Icon } from '../../icons/Icon.js';
import './dialog.css';

export type DialogProps = {
  title: string;
  /** The user wants to close the window: the cross, Escape, or a click beside it. Remove the dialog in your app. */
  onClose: () => void;
  children: ReactNode;
};

/**
 * A window in the middle of the page, over a dimmed background, for settings and the like. It is the browser's own
 * modal dialog, so Escape, the focus staying inside, and the focus going back afterwards work without extra code.
 * On a phone it fills the screen. Render it only while it should be open. Place it inside `<PathWorld>`.
 */
export function Dialog({ title, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // The newest onClose, so the listener below never has to be set up again
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    // A click on the dimmed background lands on the dialog element itself. So that a drag that began inside and ended
    // on the background does not close it, the press has to begin on the background as well. The keyboard has Escape.
    let pressedOnBackground = false;
    const rememberPress = (event: PointerEvent) => {
      pressedOnBackground = event.target === dialog;
    };
    const closeOnBackground = (event: MouseEvent) => {
      if (event.target === dialog && pressedOnBackground) onCloseRef.current();
      pressedOnBackground = false;
    };
    dialog.addEventListener('pointerdown', rememberPress);
    dialog.addEventListener('click', closeOnBackground);
    return () => {
      dialog.removeEventListener('pointerdown', rememberPress);
      dialog.removeEventListener('click', closeOnBackground);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="pw-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: the app decides whether the window goes
        event.preventDefault();
        onClose();
      }}
    >
      <header className="pw-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="pw-button" aria-label={`Close ${title}`} onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      <div className="pw-dialog-body">{children}</div>
    </dialog>
  );
}
