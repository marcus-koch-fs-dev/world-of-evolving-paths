import type { Camera } from '../../core/camera';
import type { BackgroundImage, BackgroundOptions } from '../options';
import { backgroundCss } from './backgroundCss';

const VIGNETTE = 'radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.45))';

function fill(element: HTMLElement): void {
  Object.assign(element.style, { position: 'absolute', inset: '0' });
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
 * The DOM the map lives in, from back to front: the background, an image layer, the canvas host,
 * a vignette, and an overlay for controls. Image and overlay follow the camera.
 */
export class Viewport {
  readonly root: HTMLElement;
  readonly host: HTMLElement;
  readonly overlay: HTMLElement;
  private readonly backdrop: HTMLElement;
  private image: HTMLImageElement | null = null;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      userSelect: 'none',
      touchAction: 'none',
      cursor: 'grab',
    });
    this.backdrop = worldLayer();
    this.backdrop.style.pointerEvents = 'none';
    this.root.appendChild(this.backdrop);
    this.host = this.layer({ pointerEvents: 'none' });
    this.layer({ pointerEvents: 'none', background: VIGNETTE });
    this.overlay = worldLayer();
    this.root.appendChild(this.overlay);
    container.appendChild(this.root);
  }

  size(): { width: number; height: number } {
    return { width: this.root.clientWidth || 1, height: this.root.clientHeight || 1 };
  }

  setCursor(cursor: string): void {
    this.root.style.cursor = cursor;
  }

  /** Moves the image and overlay with the camera and repaints the background. */
  render(camera: Camera, background: BackgroundOptions): void {
    const transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
    this.backdrop.style.transform = transform;
    this.overlay.style.transform = transform;
    this.overlay.style.setProperty('--pw-inverse-zoom', String(1 / camera.zoom));
    this.showImage(background.image);
    Object.assign(this.root.style, backgroundCss(background, camera));
  }

  destroy(): void {
    this.root.remove();
  }

  private showImage(image: BackgroundImage | undefined): void {
    if (!image) {
      this.image?.remove();
      this.image = null;
      return;
    }
    if (!this.image) {
      this.image = document.createElement('img');
      this.image.alt = '';
      this.image.draggable = false;
      Object.assign(this.image.style, { position: 'absolute', maxWidth: 'none' });
      this.backdrop.appendChild(this.image);
    }
    if (this.image.getAttribute('src') !== image.src) this.image.src = image.src;
    Object.assign(this.image.style, {
      left: `${image.x}px`,
      top: `${image.y}px`,
      width: `${image.width}px`,
      height: `${image.height}px`,
    });
  }

  private layer(style: Partial<CSSStyleDeclaration>): HTMLElement {
    const element = document.createElement('div');
    fill(element);
    Object.assign(element.style, style);
    this.root.appendChild(element);
    return element;
  }
}
