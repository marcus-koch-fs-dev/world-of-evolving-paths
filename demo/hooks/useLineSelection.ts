import { useState } from 'react';
import type { LineSelectEvent } from 'world-of-evolving-paths';

/**
 * The line the user clicked, for its menu. The line belongs to the view it was clicked in: in another view it is
 * not shown, and coming back does not bring it back.
 */
export function useLineSelection(viewKey: string) {
  const [selected, setSelected] = useState<{ event: LineSelectEvent; viewKey: string } | null>(null);

  return {
    line: selected?.viewKey === viewKey ? selected.event : null,
    select: (event: LineSelectEvent) => setSelected({ event, viewKey }),
    clear: () => setSelected(null),
  };
}
