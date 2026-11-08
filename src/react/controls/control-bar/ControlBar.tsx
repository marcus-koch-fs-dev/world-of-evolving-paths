import { type ReactNode, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BarSlotContext, DockContext } from '../../DockContext.js';
import { alignOf, type DockSlot, edgeOf } from './dock.js';
import { useBarDrag } from './useBarDrag.js';
import { usePortalHost } from './usePortalHost.js';
import './controlBar.css';

export type ControlBarProps = {
  /** Where the bar is docked: along the top or the bottom edge, at the left, in the middle or at the right. */
  dock: DockSlot;
  /** The user dragged the bar to another place. Store it in your app and pass it back in `dock`. The bar can be dragged when this is given. */
  onDockChange?: (dock: DockSlot) => void;
  /** Name of the bar. When given, the bar can be collapsed and shows this name while it is. */
  label?: string;
  /** Start collapsed, for example on a small screen. Only counts with `label`. */
  startCollapsed?: boolean;
  children: ReactNode;
};

/**
 * A bar of controls docked at the top or bottom edge of the map. Bars in the same edge sit side by side and wrap
 * when there is little room. With `onDockChange` the user can drag it to another place, with `label` collapse it.
 */
export function ControlBar({ dock, onDockChange, label, startCollapsed, children }: ControlBarProps) {
  const container = useContext(DockContext)[edgeOf(dock)];
  const barRef = useRef<HTMLDivElement>(null);
  const host = usePortalHost(container);
  const [collapsed, setCollapsed] = useState(label !== undefined && startCollapsed === true);
  const { offset, handlers } = useBarDrag(barRef, dock, onDockChange);

  const bar = (
    <div
      ref={barRef}
      className={`pw-control-bar pw-align-${alignOf(dock)}${offset ? ' is-dragging' : ''}`}
      style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
    >
      {onDockChange && (
        <button
          type="button"
          className="pw-grip"
          aria-label={`Move ${label ?? 'bar'}`}
          title="Drag to dock this bar elsewhere"
          {...handlers}
        >
          ⠿
        </button>
      )}
      {collapsed ? <span className="pw-bar-label">{label}</span> : children}
      {label && (
        <button
          type="button"
          className="pw-button pw-collapse"
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label}`}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? '+' : '–'}
        </button>
      )}
    </div>
  );

  const placed = <BarSlotContext.Provider value={dock}>{bar}</BarSlotContext.Provider>;
  return container ? createPortal(placed, host) : placed;
}
