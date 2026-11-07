import { Text } from 'pixi.js';

const FONT = 'system-ui, sans-serif';
const MAX_RESOLUTION = 4;
const SETTLE_MS = 150;

/** Creates texts and keeps them sharp: after zooming it waits briefly, then renders them at the matching resolution. */
export class TextPool {
  private readonly texts = new Set<Text>();
  private zoom = 1;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly requestRender: () => void) {}

  private resolution(): number {
    return Math.min(MAX_RESOLUTION, Math.max(1, (window.devicePixelRatio || 1) * this.zoom));
  }

  make(text: string, size: number, fill: string): Text {
    const created = new Text({ text, style: { fontFamily: FONT, fontSize: size, fill } });
    created.resolution = this.resolution();
    this.texts.add(created);
    return created;
  }

  drop(text: Text | null): void {
    if (!text) return;
    this.texts.delete(text);
    text.destroy();
  }

  setZoom(zoom: number): void {
    if (zoom === this.zoom) return;
    this.zoom = zoom;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const resolution = this.resolution();
      for (const text of this.texts) text.resolution = resolution;
      this.requestRender();
    }, SETTLE_MS);
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.texts.clear();
  }
}
