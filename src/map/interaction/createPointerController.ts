import { screenToWorld } from '../../core/camera.js';
import type { Position } from '../../core/types.js';
import type { CameraController } from '../camera/createCameraController.js';
import { createFingers } from './gestures/createFingers.js';
import { type ClientPoint, createPan } from './gestures/createPan.js';
import { wheelFactor } from './gestures/wheel.js';

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
 * The gestures themselves live in `gestures/`; this decides which one a press starts.
 */
export function createPointerController(
  element: HTMLElement,
  camera: CameraController,
  hooks: PointerHooks,
  nodePosition: (id: string) => Position,
): PointerController {
  const fingers = createFingers(camera);
  const pan = createPan(camera);
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
    const rest = fingers.onlyOne();
    if (!rest) return pan.stop();
    const rect = element.getBoundingClientRect();
    pan.start({ x: rest.x + rect.left, y: rest.y + rect.top });
  };

  const dragTo = (event: PointerEvent, active: Drag) => {
    moved = true;
    const at = world(event);
    hooks.onDragMove(active.id, { x: at.x - active.offset.x, y: at.y - active.offset.y });
  };

  const onWheel = (event: WheelEvent) => {
    if (isUiEvent(event)) return;
    event.preventDefault();
    const at = screen(event);
    camera.zoomAtPoint(at.x, at.y, wheelFactor(event.deltaY));
  };

  const onDown = (event: PointerEvent) => {
    if (isUiEvent(event) || (event.pointerType === 'mouse' && event.button !== PRIMARY_BUTTON)) return;
    moved = false;
    element.setPointerCapture(event.pointerId);
    fingers.add(event.pointerId, screen(event));
    if (fingers.count() >= 2) {
      pan.stop();
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
    if (id === null) pan.start({ x: event.clientX, y: event.clientY });
  };

  const onMove = (event: PointerEvent) => {
    if (fingers.moveTo(event.pointerId, screen(event))) {
      moved = true;
      return;
    }
    if (drag) return dragTo(event, drag);
    if (pan.isActive()) {
      moved = pan.moveTo(event, moved);
      return;
    }
    if (event.buttons === 0) hooks.onHover(hooks.pointAt(world(event)));
  };

  const onUp = (event: PointerEvent) => {
    // A release whose press did not start on the map (for example in a menu field) is none of our business
    if (!fingers.has(event.pointerId)) return;
    fingers.release(event.pointerId);
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
    fingers.release(event.pointerId);
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
      pan.stop();
      fingers.clear();
    },
  };
}
