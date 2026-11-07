import { type CSSProperties, forwardRef, type ReactNode, useImperativeHandle, useRef } from 'react';
import type { PathWorldHandle, PathWorldOptions } from '../map/index.js';
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

  return (
    <div className={`pw-root${className ? ` ${className}` : ''}`} style={style}>
      <div ref={hostRef} className="pw-host" />
      <PathWorldContext.Provider value={handle}>
        <div className="pw-controls">{handle && children}</div>
      </PathWorldContext.Provider>
    </div>
  );
});
