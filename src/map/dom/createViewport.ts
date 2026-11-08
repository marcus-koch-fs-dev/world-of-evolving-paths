import { backgroundCss } from '../../core/background/backgroundCss.js';
import type { Camera } from '../../core/camera.js';
import type { BackgroundOptions } from '../options.js';

const VIGNETTE = 'radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.45))';

export type Viewport = {
  root: HTMLElement;
  /** Where the canvas goes. */
  host: HTMLElement;
  /** Follows the camera. Controls placed here move and scale with the world. */
  overlay: HTMLElement;
  size(): { width: number; height: number };
  setCursor(cursor: string): void;
  /** Moves the overlay with the camera and repaints the background. */
  render(camera: Camera, background: BackgroundOptions): void;
  destroy(): void;
};

/** An empty layer that fills the viewport. */
function fillingLayer(style: Partial<CSSStyleDeclaration>): HTMLElement {
  const element = document.createElement('div');
  Object.assign(element.style, { position: 'absolute', inset: '0', ...style });
  return element;
}

/** A layer whose children are placed in world units and follow the camera. */
function worldLayer(): HTMLElement {
  const element = document.createElement('div');
  Object.assign(element.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '0',
    height: '0',
    transformOrigin: '0 0',
  });
  return element;
}

/**
 * The DOM the map lives in, from back to front: the background, the canvas host,
 * a vignette, and an overlay for controls. The overlay follows the camera.
 */
export function createViewport(container: HTMLElement): Viewport {
  const root = fillingLayer({
    position: 'relative',
    inset: '',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    userSelect: 'none',
    touchAction: 'none',
    cursor: 'grab',
  });
  const host = fillingLayer({ pointerEvents: 'none' });
  const vignette = fillingLayer({ pointerEvents: 'none', background: VIGNETTE });
  const overlay = worldLayer();
  root.append(host, vignette, overlay);
  container.appendChild(root);

  return {
    root,
    host,
    overlay,
    size: () => ({ width: root.clientWidth || 1, height: root.clientHeight || 1 }),
    setCursor: (cursor) => {
      root.style.cursor = cursor;
    },
    render(camera, background) {
      const transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
      overlay.style.transform = transform;
      overlay.style.setProperty('--pw-inverse-zoom', String(1 / camera.zoom));
      Object.assign(root.style, backgroundCss(background, camera));
    },
    destroy: () => root.remove(),
  };
}
