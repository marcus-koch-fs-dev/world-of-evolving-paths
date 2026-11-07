import { pinchStep, screenToWorld } from '../../core/camera.js';
import type { Position } from '../../core/types.js';
import type { CameraController } from '../camera/createCameraController.js';

const CLICK_TOLERANCE = 4; // pixels a press may move and still count as a click
const WHEEL_SENSITIVITY = 0.0015;
const UI_SELECTOR = '[data-pw-ui]';
const PRIMARY_BUTTON = 0;

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

export type PointerController = {
  destroy(): void;
  /** Forgets a press or drag in progress, without telling the hooks, for when the view underneath was replaced. */
  cancel(): void;
};

type Drag = { id: string; offset: Position };
type Pan = { startX: number; startY: number };
type ClientPoint = { clientX: number; clientY: number };

/** Does the event come from something marked `data-pw-ui`, such as a menu on the map? */
export function isUiEvent(event: Event): boolean {
  const target = event.target as { closest?: (selector: string) => unknown } | null;
  return typeof target?.closest === 'function' && target.closest(UI_SELECTOR) !== null;
}

/** The position of an event inside an element. */
export function positionInElement(element: HTMLElement, event: ClientPoint): Position {
  const rect = element.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

/**
 * Turns pointer events on the viewport into camera movement and hooks: wheel zoom, drag to pan,
 * two fingers to pinch, press a point to drag it. Elements marked `data-pw-ui` are left alone.
 */
export function createPointerController(
  element: HTMLElement,
  camera: CameraController,
  hooks: PointerHooks,
  nodePosition: (id: string) => Position,
): PointerController {
  const fingers = new Map<number, Position>();
  let pan: Pan | null = null;
  let drag: Drag | null = null;
  let moved = false;
  const cleanup: (() => void)[] = [];

  const screen = (event: ClientPoint) => positionInElement(element, event);
  const world = (event: ClientPoint) => {
    const at = screen(event);
    return screenToWorld(camera.get(), at.x, at.y);
  };

  const endDrag = () => {
    const ended = drag;
    drag = null;
    if (ended) hooks.onDragEnd(ended.id);
  };

  /** A finger that is left continues to pan from where it is, without a jump. Pan positions are client coordinates. */
  const continueWithRemainingFinger = () => {
    const rest = [...fingers.values()];
    if (rest.length !== 1) {
      pan = null;
      return;
    }
    const rect = element.getBoundingClientRect();
    pan = { startX: rest[0].x + rect.left, startY: rest[0].y + rect.top };
  };

  /** Follows the fingers on screen. With exactly two, zooms and moves like a pinch and returns true. */
  const pinch = (event: PointerEvent): boolean => {
    const before = [...fingers.values()];
    if (fingers.has(event.pointerId)) fingers.set(event.pointerId, screen(event));
    if (before.length !== 2) return false;
    const step = pinchStep(before as [Position, Position], [...fingers.values()] as [Position, Position]);
    moved = true;
    camera.zoomAtPoint(step.px, step.py, step.factor);
    camera.moveBy(step.dx, step.dy);
    return true;
  };

  const dragTo = (event: PointerEvent, active: Drag) => {
    moved = true;
    const at = world(event);
    hooks.onDragMove(active.id, { x: at.x - active.offset.x, y: at.y - active.offset.y });
  };

  const panTo = (event: PointerEvent, active: Pan) => {
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (Math.abs(dx) + Math.abs(dy) > CLICK_TOLERANCE) moved = true;
    if (!moved) return;
    camera.moveBy(dx, dy);
    active.startX = event.clientX;
    active.startY = event.clientY;
  };

  const onWheel = (event: WheelEvent) => {
    if (isUiEvent(event)) return;
    event.preventDefault();
    const at = screen(event);
    camera.zoomAtPoint(at.x, at.y, Math.exp(-event.deltaY * WHEEL_SENSITIVITY));
  };

  const onDown = (event: PointerEvent) => {
    if (isUiEvent(event) || (event.pointerType === 'mouse' && event.button !== PRIMARY_BUTTON)) return;
    moved = false;
    element.setPointerCapture(event.pointerId);
    fingers.set(event.pointerId, screen(event));
    if (fingers.size >= 2) {
      pan = null;
      endDrag();
      return;
    }
    const at = world(event);
    const id = hooks.pointAt(at);
    if (id !== null && hooks.onPointPress(id)) {
      const position = nodePosition(id);
      drag = { id, offset: { x: at.x - position.x, y: at.y - position.y } };
      return;
    }
    if (id === null) pan = { startX: event.clientX, startY: event.clientY };
  };

  const onMove = (event: PointerEvent) => {
    if (pinch(event)) return;
    if (drag) return dragTo(event, drag);
    if (pan) return panTo(event, pan);
    if (event.buttons === 0) hooks.onHover(hooks.pointAt(world(event)));
  };

  const onUp = (event: PointerEvent) => {
    // A release whose press did not start on the map (for example in a menu field) is none of our business
    if (!fingers.has(event.pointerId)) return;
    fingers.delete(event.pointerId);
    const released = drag;
    drag = null;
    continueWithRemainingFinger();
    if (released) {
      hooks.onDragEnd(released.id);
      return;
    }
    if (!moved && !isUiEvent(event) && hooks.pointAt(world(event)) === null) hooks.onBackgroundClick();
  };

  /** A cancelled gesture ends a drag the normal way but is never a click. */
  const onCancel = (event: PointerEvent) => {
    fingers.delete(event.pointerId);
    endDrag();
    continueWithRemainingFinger();
  };

  const onDoubleClick = (event: MouseEvent) => {
    if (isUiEvent(event) || moved) return;
    const at = world(event);
    if (hooks.pointAt(at) === null) hooks.onBackgroundDoubleClick(at);
  };

  const listen = <K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => {
    element.addEventListener(type, handler, options);
    cleanup.push(() => element.removeEventListener(type, handler, options));
  };

  listen('wheel', onWheel, { passive: false });
  listen('pointerdown', onDown);
  listen('pointermove', onMove);
  listen('pointerup', onUp);
  listen('pointercancel', onCancel);
  listen('pointerleave', () => hooks.onHover(null));
  listen('dblclick', onDoubleClick);

  return {
    destroy() {
      cleanup.forEach((remove) => {
        remove();
      });
    },
    cancel() {
      drag = null;
      pan = null;
      fingers.clear();
    },
  };
}
