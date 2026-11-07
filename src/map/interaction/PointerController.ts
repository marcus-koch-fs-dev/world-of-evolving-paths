import { pinchStep, screenToWorld } from '../../core/camera';
import type { Position } from '../../core/types';
import type { CameraController } from '../camera/CameraController';

const CLICK_TOLERANCE = 4; // pixels a press may move and still count as a click
const WHEEL_SENSITIVITY = 0.0015;
const UI_SELECTOR = '[data-pw-ui]';

export type PointerHooks = {
  /** The id of the point at a world position, if any. */
  pointAt(world: Position): string | null;
  onHover(id: string | null): void;
  /** A point was pressed. Return true to start dragging it. */
  onPointPress(id: string): boolean;
  /** Called while dragging with the position the point should have. */
  onDragMove(id: string, position: Position): void;
  onDragEnd(id: string): void;
  onBackgroundClick(): void;
  onBackgroundDoubleClick(world: Position): void;
};

type Drag = { id: string; offset: Position };
type Pan = { startX: number; startY: number };

/**
 * Turns pointer events on the viewport into camera movement and hooks: wheel zoom, drag to pan,
 * two fingers to pinch, press a point to drag it. Elements marked `data-pw-ui` are left alone.
 */
export class PointerController {
  private readonly fingers = new Map<number, Position>();
  private pan: Pan | null = null;
  private drag: Drag | null = null;
  private moved = false;
  private readonly cleanup: (() => void)[] = [];

  constructor(
    private readonly element: HTMLElement,
    private readonly camera: CameraController,
    private readonly hooks: PointerHooks,
    private readonly nodePosition: (id: string) => Position,
  ) {
    this.listen('wheel', this.onWheel, { passive: false });
    this.listen('pointerdown', this.onDown);
    this.listen('pointermove', this.onMove);
    this.listen('pointerup', this.onUp);
    this.listen('pointercancel', this.onUp);
    this.listen('pointerleave', () => hooks.onHover(null));
    this.listen('dblclick', this.onDoubleClick);
  }

  destroy(): void {
    for (const remove of this.cleanup) remove();
  }

  private listen<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    this.element.addEventListener(type, handler, options);
    this.cleanup.push(() => this.element.removeEventListener(type, handler, options));
  }

  private screen(event: { clientX: number; clientY: number }): Position {
    const rect = this.element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private world(event: { clientX: number; clientY: number }): Position {
    const screen = this.screen(event);
    return screenToWorld(this.camera.get(), screen.x, screen.y);
  }

  private isUi(event: Event): boolean {
    return event.target instanceof Element && event.target.closest(UI_SELECTOR) !== null;
  }

  private readonly onWheel = (event: WheelEvent) => {
    if (this.isUi(event)) return;
    event.preventDefault();
    const screen = this.screen(event);
    this.camera.zoomAtPoint(screen.x, screen.y, Math.exp(-event.deltaY * WHEEL_SENSITIVITY));
  };

  private readonly onDown = (event: PointerEvent) => {
    if (this.isUi(event)) return;
    this.moved = false;
    this.element.setPointerCapture(event.pointerId);
    this.fingers.set(event.pointerId, this.screen(event));
    if (this.fingers.size >= 2) {
      this.pan = null;
      this.drag = null;
      return;
    }
    const world = this.world(event);
    const id = this.hooks.pointAt(world);
    if (id !== null && this.hooks.onPointPress(id)) {
      const position = this.nodePosition(id);
      this.drag = { id, offset: { x: world.x - position.x, y: world.y - position.y } };
      return;
    }
    if (id === null) this.pan = { startX: event.clientX, startY: event.clientY };
  };

  private readonly onMove = (event: PointerEvent) => {
    if (this.pinch(event)) return;
    if (this.drag) return this.dragTo(event, this.drag);
    if (this.pan) return this.panTo(event, this.pan);
    if (event.buttons === 0) this.hooks.onHover(this.hooks.pointAt(this.world(event)));
  };

  /** Follows the fingers on screen. With exactly two, zooms and moves like a pinch and returns true. */
  private pinch(event: PointerEvent): boolean {
    const before = [...this.fingers.values()];
    if (this.fingers.has(event.pointerId)) this.fingers.set(event.pointerId, this.screen(event));
    if (before.length !== 2) return false;
    const step = pinchStep(before as [Position, Position], [...this.fingers.values()] as [Position, Position]);
    this.moved = true;
    this.camera.zoomAtPoint(step.px, step.py, step.factor);
    this.camera.moveBy(step.dx, step.dy);
    return true;
  }

  private dragTo(event: PointerEvent, drag: Drag): void {
    this.moved = true;
    const world = this.world(event);
    this.hooks.onDragMove(drag.id, { x: world.x - drag.offset.x, y: world.y - drag.offset.y });
  }

  private panTo(event: PointerEvent, pan: Pan): void {
    const dx = event.clientX - pan.startX;
    const dy = event.clientY - pan.startY;
    if (Math.abs(dx) + Math.abs(dy) > CLICK_TOLERANCE) this.moved = true;
    if (!this.moved) return;
    this.camera.moveBy(dx, dy);
    pan.startX = event.clientX;
    pan.startY = event.clientY;
  }

  private readonly onUp = (event: PointerEvent) => {
    this.fingers.delete(event.pointerId);
    const drag = this.drag;
    this.drag = null;
    // A finger that is left continues to pan from where it is, without a jump
    const rest = [...this.fingers.values()];
    this.pan = rest.length === 1 ? { startX: rest[0].x, startY: rest[0].y } : null;
    if (drag) {
      if (this.moved) this.hooks.onDragEnd(drag.id);
      return;
    }
    if (!this.moved && !this.isUi(event) && this.hooks.pointAt(this.world(event)) === null) {
      this.hooks.onBackgroundClick();
    }
  };

  private readonly onDoubleClick = (event: MouseEvent) => {
    if (this.isUi(event) || this.moved) return;
    const world = this.world(event);
    if (this.hooks.pointAt(world) === null) this.hooks.onBackgroundDoubleClick(world);
  };
}
