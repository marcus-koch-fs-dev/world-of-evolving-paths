import type { ReactNode } from 'react';
import './sidePanel.css';

export type SidePanelProps = {
  /** Which side of the map the panel slides in from. */
  side: 'left' | 'right';
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** A panel over the full height of the map at one side, for settings. It scrolls when its content is long. */
export function SidePanel({ side, title, onClose, children }: SidePanelProps) {
  return (
    <aside className={`pw-side-panel pw-side-${side}`} aria-label={title}>
      <header className="pw-side-header">
        <h3>{title}</h3>
        <button type="button" className="pw-button" aria-label={`Close ${title}`} onClick={onClose}>
          ×
        </button>
      </header>
      <div className="pw-side-body">{children}</div>
    </aside>
  );
}
