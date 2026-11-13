import { type CSSProperties, forwardRef, type ReactNode, useImperativeHandle, useRef } from 'react';
import type { PathWorldHandle, PathWorldOptions } from '../map/index.js';
import { DOCK_ALIGNS, DOCK_EDGES } from './controls/control-bar/dock.js';
import { DockContext } from './DockContext.js';
import { useDockContainers } from './hooks/useDockContainers.js';
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
 * Pass your `store` and the key of the period to show in `view`. Moves come back through `onStoreChange`.
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
  const { containers, refs, ready } = useDockContainers();

  return (
    <div className={`pw-root${className ? ` ${className}` : ''}`} style={style}>
      <div ref={hostRef} className="pw-host" />
      <PathWorldContext.Provider value={handle}>
        <DockContext.Provider value={containers}>
          <div className="pw-controls">
            {DOCK_EDGES.map((edge) => (
              <div key={edge} className={`pw-dock pw-dock-${edge}`}>
                {DOCK_ALIGNS.map((align) => (
                  <div key={align} ref={refs[`${edge}-${align}`]} className={`pw-dock-zone pw-zone-${align}`} />
                ))}
              </div>
            ))}
            {/* Controls render once the map and the places for the bars exist */}
            {handle !== null && ready && children}
          </div>
        </DockContext.Provider>
      </PathWorldContext.Provider>
    </div>
  );
});
