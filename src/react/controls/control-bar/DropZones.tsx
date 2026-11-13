import { DOCK_SLOTS, type DockSlot } from './dock.js';

/** The six places a bar can be dropped at, shown while a bar is dragged. The one the bar would go to lights up. */
export function DropZones({ target }: { target: DockSlot }) {
  return (
    <div className="pw-drop-zones" aria-hidden="true">
      {DOCK_SLOTS.map((slot) => (
        <div key={slot} className={`pw-drop-zone pw-drop-${slot}${slot === target ? ' is-target' : ''}`} />
      ))}
    </div>
  );
}
