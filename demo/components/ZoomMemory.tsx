import { useEffect, useRef } from 'react';
import { usePathWorldHandle } from 'world-of-evolving-paths/react';

const SETTLE_MS = 300;

/**
 * Tells the app the zoom of the layer that is shown, a moment after the user stopped zooming. It draws nothing. Place
 * it inside the map.
 */
export function ZoomMemory({ layer, onZoom }: { layer: string; onZoom: (layer: string, zoom: number) => void }) {
  const handle = usePathWorldHandle();
  // The newest values, so the listener below is set up once
  const latest = useRef({ layer, onZoom });
  latest.current = { layer, onZoom };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = handle.subscribeCamera((camera) => {
      clearTimeout(timer);
      timer = setTimeout(() => latest.current.onZoom(latest.current.layer, camera.zoom), SETTLE_MS);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [handle]);

  return null;
}
