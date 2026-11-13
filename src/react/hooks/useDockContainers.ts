import { useMemo, useState } from 'react';
import { DOCK_SLOTS, type DockSlot } from '../controls/control-bar/dock.js';
import type { DockContainers } from '../DockContext.js';

type ZoneRef = (element: HTMLElement | null) => void;

/**
 * The elements along the edges where control bars dock, one for each zone. Give each zone its ref callback; `ready`
 * turns true once all of them exist, so a bar never moves from one place to another while it mounts.
 */
export function useDockContainers(): { containers: DockContainers; refs: Record<DockSlot, ZoneRef>; ready: boolean } {
  const [containers, setContainers] = useState<DockContainers>({});
  // One stable ref callback per zone, so the containers are not set again on every render
  const refs = useMemo(
    () =>
      Object.fromEntries(
        DOCK_SLOTS.map((slot) => [
          slot,
          (element: HTMLElement | null) => {
            if (element)
              setContainers((current) => (current[slot] === element ? current : { ...current, [slot]: element }));
          },
        ]),
      ) as Record<DockSlot, ZoneRef>,
    [],
  );
  return { containers, refs, ready: DOCK_SLOTS.every((slot) => containers[slot] !== undefined) };
}
