import { Text } from 'pixi.js';

const FONT = 'system-ui, sans-serif';
const MAX_RESOLUTION = 4;
const SETTLE_MS = 150;

export type TextPool = {
  make(text: string, size: number, fill: string): Text;
  drop(text: Text | null): void;
  setZoom(zoom: number): void;
  destroy(): void;
};

/** The resolution that keeps text sharp at a zoom. */
function resolutionFor(zoom: number): number {
  return Math.min(MAX_RESOLUTION, Math.max(1, (window.devicePixelRatio || 1) * zoom));
}

/** Creates texts and keeps them sharp: after zooming it waits briefly, then renders them at the matching resolution. */
export function createTextPool(requestRender: () => void): TextPool {
  const texts = new Set<Text>();
  let zoom = 1;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    make(text, size, fill) {
      const created = new Text({ text, style: { fontFamily: FONT, fontSize: size, fill } });
      created.resolution = resolutionFor(zoom);
      texts.add(created);
      return created;
    },

    drop(text) {
      if (!text) return;
      texts.delete(text);
      text.destroy();
    },

    setZoom(next) {
      if (next === zoom) return;
      zoom = next;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const resolution = resolutionFor(zoom);
        texts.forEach((text) => {
          text.resolution = resolution;
        });
        requestRender();
      }, SETTLE_MS);
    },

    destroy() {
      if (timer) clearTimeout(timer);
      texts.clear();
    },
  };
}
