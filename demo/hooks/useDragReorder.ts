import { type PointerEvent, useRef, useState } from 'react';
import { movedTo, slotAt } from '../app-logic/reorder';

/**
 * Lets the user drag the rows of a list to another place with the mouse or a finger. `register` goes on every row
 * (as `ref`), `start` on the handle of a row. While a row is dragged, `drag` says which one and where it would land.
 */
export function useDragReorder<T extends string>(items: readonly T[], onReorder: (next: T[]) => void) {
  const rows = useRef(new Map<T, HTMLElement>());
  const [drag, setDrag] = useState<{ id: T; over: number } | null>(null);

  const register = (id: T) => (element: HTMLElement | null) => {
    if (element) rows.current.set(id, element);
    else rows.current.delete(id);
  };

  const slotUnder = (pointerY: number) =>
    slotAt(
      items.map((id) => {
        const box = rows.current.get(id)?.getBoundingClientRect();
        return box ? (box.top + box.bottom) / 2 : 0;
      }),
      pointerY,
    );

  const start = (id: T) => (event: PointerEvent) => {
    event.preventDefault();
    const from = items.indexOf(id);
    setDrag({ id, over: from });
    const move = (moved: globalThis.PointerEvent) => setDrag({ id, over: slotUnder(moved.clientY) });
    const finish = (ended: globalThis.PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      const to = slotUnder(ended.clientY);
      setDrag(null);
      if (ended.type === 'pointerup' && to !== from) onReorder(movedTo(items, id, to));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  };

  return { drag, register, start };
}
