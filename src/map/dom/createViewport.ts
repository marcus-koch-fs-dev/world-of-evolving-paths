import type { Camera } from '../../core/camera';
import type { BackgroundImage, BackgroundOptions } from '../options';
import { backgroundCss } from './backgroundCss';

const VIGNETTE = 'radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.45))';

export type Viewport = {
  root: HTMLElement;
  /** Where the canvas goes. */
  host: HTMLElement;
  /** Follows the camera. Controls placed here move and scale with the world. */
  overlay: HTMLElement;
  size(): { width: number; height: number };
  setCursor(cursor: string): void;
  /** Moves the image and overlay with the camera and repaints the background. */
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

/** Creates, updates or removes the image behind the paths. Returns the image element now in use. */
function showImage(
  backdrop: HTMLElement,
  current: HTMLImageElement | null,
  image: BackgroundImage | undefined,
): HTMLImageElement | null {
  if (!image) {
    current?.remove();
    return null;
  }
  let element = current;
  if (!element) {
    element = document.createElement('img');
    element.alt = '';
    element.draggable = false;
    Object.assign(element.style, { position: 'absolute', maxWidth: 'none' });
    backdrop.appendChild(element);
  }
  if (element.getAttribute('src') !== image.src) element.src = image.src;
  Object.assign(element.style, {
    left: `${image.x}px`,
    top: `${image.y}px`,
    width: `${image.width}px`,
    height: `${image.height}px`,
  });
  return element;
}

/**
 * The DOM the map lives in, from back to front: the background, an image layer, the canvas host,
 * a vignette, and an overlay for controls. Image and overlay follow the camera.
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
  const backdrop = worldLayer();
  backdrop.style.pointerEvents = 'none';
  const host = fillingLayer({ pointerEvents: 'none' });
  const vignette = fillingLayer({ pointerEvents: 'none', background: VIGNETTE });
  const overlay = worldLayer();
  root.append(backdrop, host, vignette, overlay);
  container.appendChild(root);
  let image: HTMLImageElement | null = null;

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
      backdrop.style.transform = transform;
      overlay.style.transform = transform;
      overlay.style.setProperty('--pw-inverse-zoom', String(1 / camera.zoom));
      image = showImage(backdrop, image, background.image);
      Object.assign(root.style, backgroundCss(background, camera));
    },
    destroy: () => root.remove(),
  };
}
