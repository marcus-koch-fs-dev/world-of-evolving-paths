import type { Camera } from '../../core/camera';
import type { BackgroundOptions } from '../options';
import { backgroundCss } from './backgroundCss';

const VIGNETTE = 'radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.45))';

function fill(element: HTMLElement): void {
  Object.assign(element.style, { position: 'absolute', inset: '0' });
}

/** The DOM the map lives in: a background layer with the canvas host, a vignette, and an overlay that follows the camera. */
export class Viewport {
  readonly root: HTMLElement;
  readonly host: HTMLElement;
  readonly overlay: HTMLElement;

  constructor(private readonly container: HTMLElement) {
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
    this.host = this.layer({ pointerEvents: 'none' });
    this.layer({ pointerEvents: 'none', background: VIGNETTE });
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '0',
      height: '0',
      transformOrigin: '0 0',
    });
    this.root.appendChild(this.overlay);
    container.appendChild(this.root);
  }

  size(): { width: number; height: number } {
    return { width: this.root.clientWidth || 1, height: this.root.clientHeight || 1 };
  }

  setCursor(cursor: string): void {
    this.root.style.cursor = cursor;
  }

  /** Moves the overlay with the camera and repaints the background. */
  render(camera: Camera, background: BackgroundOptions): void {
    this.overlay.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
    this.overlay.style.setProperty('--pw-inverse-zoom', String(1 / camera.zoom));
    Object.assign(this.root.style, backgroundCss(background, camera));
  }

  destroy(): void {
    this.container.removeChild(this.root);
  }

  private layer(style: Partial<CSSStyleDeclaration>): HTMLElement {
    const element = document.createElement('div');
    fill(element);
    Object.assign(element.style, style);
    this.root.appendChild(element);
    return element;
  }
}
