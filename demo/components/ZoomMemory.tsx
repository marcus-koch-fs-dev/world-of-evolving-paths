import { useEffect, useRef } from 'react';
import { usePathWorldHandle } from 'world-of-evolving-paths/react';

const SETTLE_MS = 300;

type Pending = { layer: string; zoom: number };

/**
 * Tells the app the zoom of the layer that is shown, a moment after the user stopped zooming. The zoom belongs to the
 * layer that was shown when it was made, also when the layer changes before the moment is over. It draws nothing.
 * Place it inside the map.
 */
export function ZoomMemory({ layer, onZoom }: { layer: string; onZoom: (layer: string, zoom: number) => void }) {
  const handle = usePathWorldHandle();
  // The newest values, so the listener below is set up once
  const latest = useRef({ layer, onZoom });
  latest.current = { layer, onZoom };

  useEffect(() => {
    let pending: Pending | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      clearTimeout(timer);
      if (pending) latest.current.onZoom(pending.layer, pending.zoom);
      pending = null;
    };
    const unsubscribe = handle.subscribeCamera((camera) => {
      const now = latest.current.layer;
      // Another layer is shown now: what was waiting belongs to the one before, so it is saved right away
      if (pending && pending.layer !== now) save();
      pending = { layer: now, zoom: camera.zoom };
      clearTimeout(timer);
      timer = setTimeout(save, SETTLE_MS);
    });
    return () => {
      unsubscribe();
      save();
    };
  }, [handle]);

  return null;
}
