import { type CSSProperties, forwardRef, type ReactNode, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { PathWorldHandle, PathWorldOptions } from '../map/index.js';
import { DOCK_EDGES, type DockEdge } from './controls/control-bar/dock.js';
import { type DockContainers, DockContext } from './DockContext.js';
import { usePathWorldMount } from './hooks/usePathWorldMount.js';
import { PathWorldContext } from './PathWorldContext.js';
import './pathWorld.css';

export type PathWorldProps = PathWorldOptions & {
  className?: string;
  style?: CSSProperties;
  /** Controls such as `<ZoomControls />`. They are rendered once the map exists. */
  children?: ReactNode;
};

/**
 * The map as a React component. It fills its parent, so give the parent a size.
 * Pass the data of the periods in `periods` and the key of the one to show in `view`.
 * Everything the user does comes back through the `on...` callbacks.
 * A `ref` gives the handle of the map (zoom, fit, center, camera), or null until the map exists.
 */
export const PathWorld = forwardRef<PathWorldHandle | null, PathWorldProps>(function PathWorld(
  { className, style, children, ...options },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handle = usePathWorldMount(hostRef, options);
  useImperativeHandle(ref, () => handle as PathWorldHandle, [handle]);
  const [containers, setContainers] = useState<DockContainers>({});
  // One stable ref callback per edge, so the containers are not set again on every render
  const containerRefs = useMemo(
    () =>
      Object.fromEntries(
        DOCK_EDGES.map((edge) => [
          edge,
          (element: HTMLElement | null) => {
            if (element)
              setContainers((current) => (current[edge] === element ? current : { ...current, [edge]: element }));
          },
        ]),
      ) as Record<DockEdge, (element: HTMLElement | null) => void>,
    [],
  );
  // Controls render once the map and the places for the bars exist, so a bar never moves from one place to another
  const ready = handle !== null && DOCK_EDGES.every((edge) => containers[edge] !== undefined);

  return (
    <div className={`pw-root${className ? ` ${className}` : ''}`} style={style}>
      <div ref={hostRef} className="pw-host" />
      <PathWorldContext.Provider value={handle}>
        <DockContext.Provider value={containers}>
          <div className="pw-controls">
            {DOCK_EDGES.map((edge) => (
              <div key={edge} ref={containerRefs[edge]} className={`pw-dock pw-dock-${edge}`} />
            ))}
            {ready && children}
          </div>
        </DockContext.Provider>
      </PathWorldContext.Provider>
    </div>
  );
});
