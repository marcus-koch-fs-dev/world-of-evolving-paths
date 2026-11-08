import { type PointerEvent, type RefObject, useState } from 'react';
import { type DockSlot, slotAt } from './dock.js';

type Drag = { startX: number; startY: number; x: number; y: number };

type Handlers = {
  onPointerDown(event: PointerEvent<HTMLButtonElement>): void;
  onPointerMove(event: PointerEvent<HTMLButtonElement>): void;
  onPointerUp(event: PointerEvent<HTMLButtonElement>): void;
  onPointerCancel(): void;
};

/**
 * Dragging a bar by its grip. While it is dragged the bar follows the pointer by `offset`;
 * on release `onDockChange` gets the slot nearest to the pointer, if it is another one.
 */
export function useBarDrag(
  barRef: RefObject<HTMLElement | null>,
  dock: DockSlot,
  onDockChange: ((dock: DockSlot) => void) | undefined,
): { offset: { x: number; y: number } | null; handlers: Handlers } {
  const [drag, setDrag] = useState<Drag | null>(null);

  const handlers: Handlers = {
    onPointerDown(event) {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDrag({ startX: event.clientX, startY: event.clientY, x: 0, y: 0 });
    },
    onPointerMove(event) {
      setDrag((current) =>
        current ? { ...current, x: event.clientX - current.startX, y: event.clientY - current.startY } : current,
      );
    },
    onPointerUp(event) {
      const area = barRef.current?.closest('.pw-controls')?.getBoundingClientRect();
      setDrag(null);
      if (!area) return;
      const next = slotAt(event.clientX - area.left, event.clientY - area.top, area.width, area.height);
      if (next !== dock) onDockChange?.(next);
    },
    onPointerCancel: () => setDrag(null),
  };

  return { offset: drag ? { x: drag.x, y: drag.y } : null, handlers };
}
