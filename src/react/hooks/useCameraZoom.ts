import { useCallback, useSyncExternalStore } from 'react';
import type { PathWorldHandle } from '../../map/index.js';

/** The current zoom of the map. Only the component that uses it re-renders when the camera moves. */
export function useCameraZoom(handle: PathWorldHandle): number {
  const subscribe = useCallback((onChange: () => void) => handle.subscribeCamera(onChange), [handle]);
  return useSyncExternalStore(subscribe, () => handle.getCamera().zoom);
}
