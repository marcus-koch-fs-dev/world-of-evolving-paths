import { type RefObject, useEffect, useState } from 'react';
import { createPathWorld, type PathWorldHandle, type PathWorldOptions } from '../../map';

/**
 * Creates the map on the element once, keeps it in sync with the options, and removes it on unmount.
 * Returns the handle as soon as the map exists.
 */
export function usePathWorldMount(
  hostRef: RefObject<HTMLElement | null>,
  options: PathWorldOptions,
): PathWorldHandle | null {
  const [handle, setHandle] = useState<PathWorldHandle | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the map is created once; later options go through update below
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const created = createPathWorld(host, options);
    setHandle(created);
    return () => {
      created.destroy();
      setHandle(null);
    };
  }, [hostRef]);

  useEffect(() => {
    handle?.update(options);
  });

  return handle;
}
