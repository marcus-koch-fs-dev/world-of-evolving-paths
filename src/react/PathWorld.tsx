import { type CSSProperties, type ReactNode, useRef } from 'react';
import type { PathWorldOptions } from '../map';
import { usePathWorldMount } from './hooks/usePathWorldMount';
import { PathWorldContext } from './PathWorldContext';
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
 */
export function PathWorld({ className, style, children, ...options }: PathWorldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handle = usePathWorldMount(hostRef, options);

  return (
    <div className={`pw-root${className ? ` ${className}` : ''}`} style={style}>
      <div ref={hostRef} className="pw-host" />
      <PathWorldContext.Provider value={handle}>
        <div className="pw-controls">{handle && children}</div>
      </PathWorldContext.Provider>
    </div>
  );
}
