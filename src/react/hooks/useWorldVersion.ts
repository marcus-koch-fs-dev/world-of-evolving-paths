import { useCallback, useSyncExternalStore } from 'react';
import type { PathWorldHandle } from '../../map';

/** Changes whenever the points of the map were laid out again or moved. Use it to follow a point's position. */
export function useWorldVersion(handle: PathWorldHandle): number {
  const subscribe = useCallback((onChange: () => void) => handle.subscribeWorld(onChange), [handle]);
  return useSyncExternalStore(subscribe, () => handle.getWorldVersion());
}
