import { type PointerEvent, type ReactNode, useContext, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BarSlotContext, DockContext } from '../../DockContext.js';
import { alignOf, type DockSlot, edgeOf, slotAt } from './dock.js';
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

type Drag = { startX: number; startY: number; x: number; y: number };

/**
 * A bar of controls docked at the top or bottom edge of the map. Bars in the same edge sit side by side and wrap
 * when there is little room. With `onDockChange` the user can drag it to another place, with `label` collapse it.
 */
export function ControlBar({ dock, onDockChange, label, startCollapsed, children }: ControlBarProps) {
  const container = useContext(DockContext)[edgeOf(dock)];
  const barRef = useRef<HTMLDivElement>(null);
  const [host] = useState(() => {
    const element = document.createElement('div');
    element.style.display = 'contents';
    return element;
  });
  useLayoutEffect(() => {
    container?.appendChild(host);
    return () => host.remove();
  }, [container, host]);
  const [collapsed, setCollapsed] = useState(label !== undefined && startCollapsed === true);
  const [drag, setDrag] = useState<Drag | null>(null);

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ startX: event.clientX, startY: event.clientY, x: 0, y: 0 });
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    setDrag((current) =>
      current ? { ...current, x: event.clientX - current.startX, y: event.clientY - current.startY } : current,
    );
  };
  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const area = barRef.current?.closest('.pw-controls')?.getBoundingClientRect();
    setDrag(null);
    if (!area) return;
    const next = slotAt(event.clientX - area.left, event.clientY - area.top, area.width, area.height);
    if (next !== dock) onDockChange?.(next);
  };

  const bar = (
    <div
      ref={barRef}
      className={`pw-control-bar pw-align-${alignOf(dock)}${drag ? ' is-dragging' : ''}`}
      style={drag ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
    >
      {onDockChange && (
        <button
          type="button"
          className="pw-grip"
          aria-label={`Move ${label ?? 'bar'}`}
          title="Drag to dock this bar elsewhere"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={() => setDrag(null)}
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
  // The bar always renders into its own host element. Moving to another edge moves that element, so React keeps
  // the bar (collapsed or not, panel open or not) instead of building it again.
  return container ? createPortal(placed, host) : placed;
}
