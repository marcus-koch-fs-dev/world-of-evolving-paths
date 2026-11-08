import { useMemo, useState } from 'react';
import { DOCK_EDGES, type DockEdge } from '../controls/control-bar/dock.js';
import type { DockContainers } from '../DockContext.js';

type EdgeRef = (element: HTMLElement | null) => void;

/**
 * The elements along the edges where control bars dock. Give each edge its ref callback; `ready` turns true
 * once all of them exist, so a bar never moves from one place to another while it mounts.
 */
export function useDockContainers(): { containers: DockContainers; refs: Record<DockEdge, EdgeRef>; ready: boolean } {
  const [containers, setContainers] = useState<DockContainers>({});
  // One stable ref callback per edge, so the containers are not set again on every render
  const refs = useMemo(
    () =>
      Object.fromEntries(
        DOCK_EDGES.map((edge) => [
          edge,
          (element: HTMLElement | null) => {
            if (element)
              setContainers((current) => (current[edge] === element ? current : { ...current, [edge]: element }));
          },
        ]),
      ) as Record<DockEdge, EdgeRef>,
    [],
  );
  return { containers, refs, ready: DOCK_EDGES.every((edge) => containers[edge] !== undefined) };
}
