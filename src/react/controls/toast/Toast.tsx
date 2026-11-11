import { useEffect, useRef } from 'react';
import './toast.css';

const DEFAULT_DURATION_MS = 6000;

export type ToastProps = {
  /** The message to show. `null` shows nothing. A new message restarts the timer. */
  message: string | null;
  /** Called when the user closes the toast or when its time is up. Clear the message here. */
  onDismiss: () => void;
  /** How long the message stays. Default 6 seconds. */
  durationMs?: number;
  /** A button next to the message. Clicking it runs `onClick` and closes the toast. */
  action?: { label: string; onClick: () => void };
};

/**
 * A short message at the top of the map that slides into view and goes away by itself.
 * Use it to tell the user about something that happened out of sight. It holds no state: the app owns the message.
 */
export function Toast({ message, onDismiss, durationMs = DEFAULT_DURATION_MS, action }: ToastProps) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    if (message === null) return;
    const timer = setTimeout(() => dismiss.current(), durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs]);

  if (message === null) return null;
  return (
    <div className="pw-toast" role="status" key={message}>
      <span>{message}</span>
      {action && (
        <button
          type="button"
          className="pw-button is-active"
          onClick={() => {
            action.onClick();
            onDismiss();
          }}
        >
          {action.label}
        </button>
      )}
      <button type="button" className="pw-button" aria-label="Dismiss" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}
