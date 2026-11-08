import { Text } from 'pixi.js';

const FONT = 'system-ui, sans-serif';
const MAX_RESOLUTION = 4;
const SETTLE_MS = 150;

export type TextPool = {
  /** A text with this content, size and color. It may be one that was dropped before, so set anchor and position yourself. */
  make(text: string, size: number, fill: string): Text;
  /** Takes a text out of the scene and keeps it for the next `make`. Do not use it afterwards. */
  drop(text: Text | null): void;
  setZoom(zoom: number): void;
  destroy(): void;
};

/** The resolution that keeps text sharp at a zoom. */
function resolutionFor(zoom: number): number {
  return Math.min(MAX_RESOLUTION, Math.max(1, (window.devicePixelRatio || 1) * zoom));
}

/**
 * Creates texts and keeps them sharp: after zooming it waits briefly, then renders them at the matching resolution.
 * Dropped texts are reused, not destroyed: Pixi warns when the texture of a text that was drawn is destroyed
 * while the batch that drew it still points to it, and reusing is cheaper than building new texts anyway.
 */
export function createTextPool(requestRender: () => void): TextPool {
  const texts = new Set<Text>();
  const free: Text[] = [];
  let zoom = 1;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    make(text, size, fill) {
      const reused = free.pop();
      if (reused) {
        reused.text = text;
        reused.style.fontSize = size;
        reused.style.fill = fill;
        reused.anchor.set(0, 0);
        reused.position.set(0, 0);
        reused.resolution = resolutionFor(zoom);
        return reused;
      }
      const created = new Text({ text, style: { fontFamily: FONT, fontSize: size, fill } });
      created.resolution = resolutionFor(zoom);
      texts.add(created);
      return created;
    },

    drop(text) {
      if (!text) return;
      text.removeFromParent();
      free.push(text);
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
      // The texts still in the scene are destroyed with it; only the ones waiting for reuse are ours to destroy
      free.splice(0).forEach((text) => {
        text.destroy();
      });
      texts.clear();
    },
  };
}
