import { createContext, useContext } from 'react';
import type { PathWorldHandle } from '../map/index.js';

export const PathWorldContext = createContext<PathWorldHandle | null>(null);

/** The map handle of the surrounding `<PathWorld>`. Controls use it; throws outside of a map. */
export function usePathWorldHandle(): PathWorldHandle {
  const handle = useContext(PathWorldContext);
  if (!handle) throw new Error('This control must be placed inside <PathWorld>.');
  return handle;
}
