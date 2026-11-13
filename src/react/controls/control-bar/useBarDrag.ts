import { type PointerEvent, type RefObject, useState } from 'react';
import { type DockSlot, slotAt } from './dock.js';

type Drag = { startX: number; startY: number; x: number; y: number; target: DockSlot; area: Element | null };

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
): {
  offset: { x: number; y: number } | null;
  target: DockSlot | null;
  /** The area the bars are docked in, while a bar is dragged. */
  area: Element | null;
  handlers: Handlers;
} {
  const [drag, setDrag] = useState<Drag | null>(null);

  // The place nearest to the pointer, in the area the bars are docked in
  const slotUnder = (event: PointerEvent<HTMLElement>): DockSlot | null => {
    const area = barRef.current?.closest('.pw-controls')?.getBoundingClientRect();
    return area ? slotAt(event.clientX - area.left, event.clientY - area.top, area.width, area.height) : null;
  };

  const handlers: Handlers = {
    onPointerDown(event) {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDrag({
        startX: event.clientX,
        startY: event.clientY,
        x: 0,
        y: 0,
        target: dock,
        area: barRef.current?.closest('.pw-controls') ?? null,
      });
    },
    onPointerMove(event) {
      setDrag((current) =>
        current
          ? {
              ...current,
              x: event.clientX - current.startX,
              y: event.clientY - current.startY,
              target: slotUnder(event) ?? current.target,
            }
          : current,
      );
    },
    onPointerUp(event) {
      const next = slotUnder(event);
      setDrag(null);
      if (next && next !== dock) onDockChange?.(next);
    },
    onPointerCancel: () => setDrag(null),
  };

  return {
    offset: drag ? { x: drag.x, y: drag.y } : null,
    target: drag?.target ?? null,
    area: drag?.area ?? null,
    handlers,
  };
}
