import { describe, expect, it, vi } from 'vitest';
import { CameraController } from '../camera/CameraController';
import { PointerController, type PointerHooks } from './PointerController';

type Listener = (event: unknown) => void;

/** A stand-in for the viewport element: it collects listeners and lets a test fire events at them. */
function fakeElement(offset = { left: 0, top: 0 }) {
  const listeners = new Map<string, Listener[]>();
  const element = {
    addEventListener: (type: string, listener: Listener) =>
      listeners.set(type, [...(listeners.get(type) ?? []), listener]),
    removeEventListener: (type: string, listener: Listener) =>
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((candidate) => candidate !== listener),
      ),
    getBoundingClientRect: () => ({ left: offset.left, top: offset.top }),
    setPointerCapture: () => undefined,
  };
  const fire = (type: string, props: Record<string, unknown> = {}) => {
    const event = {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      clientX: 0,
      clientY: 0,
      target: {},
      preventDefault: () => undefined,
      ...props,
    };
    for (const listener of listeners.get(type) ?? []) listener(event);
  };
  return { element: element as unknown as HTMLElement, fire };
}

function setup(options: { pointAt?: PointerHooks['pointAt']; offset?: { left: number; top: number } } = {}) {
  const { element, fire } = fakeElement(options.offset);
  const camera = new CameraController(() => ({ width: 1000, height: 800 }));
  const hooks = {
    pointAt: vi.fn(options.pointAt ?? (() => null)),
    onHover: vi.fn(),
    onPointPress: vi.fn(() => true),
    onDragMove: vi.fn(),
    onDragEnd: vi.fn(),
    onBackgroundClick: vi.fn(),
    onBackgroundDoubleClick: vi.fn(),
  };
  const controller = new PointerController(element, camera, hooks, () => ({ x: 100, y: 100 }));
  return { fire, camera, hooks, controller };
}

const onPoint = () => 'a';

describe('Pointer controller', () => {
  describe('when a point is pressed and released without moving', () => {
    it('ends the drag so the point does not stay lifted', () => {
      const { fire, hooks } = setup({ pointAt: onPoint });

      fire('pointerdown', { clientX: 100, clientY: 100 });
      fire('pointerup', { clientX: 100, clientY: 100 });

      expect(hooks.onPointPress).toHaveBeenCalledWith('a');
      expect(hooks.onDragEnd).toHaveBeenCalledWith('a');
    });

    it('does not count as a click on the background', () => {
      const { fire, hooks } = setup({ pointAt: onPoint });

      fire('pointerdown');
      fire('pointerup');

      expect(hooks.onBackgroundClick).not.toHaveBeenCalled();
    });
  });

  describe('when the empty area is tapped', () => {
    it('reports a background click', () => {
      const { fire, hooks } = setup();

      fire('pointerdown');
      fire('pointerup');

      expect(hooks.onBackgroundClick).toHaveBeenCalledOnce();
    });

    it('does not report a click after the map was panned', () => {
      const { fire, hooks } = setup();

      fire('pointerdown', { clientX: 0, clientY: 0 });
      fire('pointermove', { clientX: 40, clientY: 0 });
      fire('pointerup', { clientX: 40, clientY: 0 });

      expect(hooks.onBackgroundClick).not.toHaveBeenCalled();
    });
  });

  describe('when dragging a point', () => {
    it('reports the position the point should have, keeping the grab offset', () => {
      const { fire, hooks } = setup({ pointAt: onPoint });

      fire('pointerdown', { clientX: 110, clientY: 105 });
      fire('pointermove', { clientX: 210, clientY: 205 });

      expect(hooks.onDragMove).toHaveBeenLastCalledWith('a', { x: 200, y: 200 });
    });

    it('ends the drag when a second finger touches', () => {
      const { fire, hooks } = setup({ pointAt: onPoint });

      fire('pointerdown', { pointerId: 1 });
      fire('pointerdown', { pointerId: 2, clientX: 300 });

      expect(hooks.onDragEnd).toHaveBeenCalledWith('a');
    });

    it('ends the drag when the gesture is cancelled, without a click', () => {
      const { fire, hooks } = setup({ pointAt: onPoint });

      fire('pointerdown');
      fire('pointercancel');

      expect(hooks.onDragEnd).toHaveBeenCalledWith('a');
      expect(hooks.onBackgroundClick).not.toHaveBeenCalled();
    });
  });

  describe('when other buttons or elements are involved', () => {
    it('ignores the right mouse button', () => {
      const { fire, hooks } = setup({ pointAt: onPoint });

      fire('pointerdown', { button: 2 });

      expect(hooks.onPointPress).not.toHaveBeenCalled();
    });

    it('leaves presses on marked controls alone', () => {
      const { fire, hooks } = setup({ pointAt: onPoint });
      const control = { closest: () => ({}) };

      fire('pointerdown', { target: control });

      expect(hooks.onPointPress).not.toHaveBeenCalled();
    });

    it('ignores a release whose press did not start on the map', () => {
      const { fire, hooks } = setup();

      fire('pointerup');

      expect(hooks.onBackgroundClick).not.toHaveBeenCalled();
    });
  });

  describe('when panning', () => {
    it('moves the camera by the distance the pointer travelled', () => {
      const { fire, camera } = setup();

      fire('pointerdown', { clientX: 0, clientY: 0 });
      fire('pointermove', { clientX: 30, clientY: 20 });

      expect(camera.get()).toMatchObject({ x: 30, y: 20 });
    });

    it('continues without a jump when one finger of a pinch lifts', () => {
      const { fire, camera } = setup({ offset: { left: 0, top: 100 } });
      fire('pointerdown', { pointerId: 1, clientX: 200, clientY: 300 });
      fire('pointerdown', { pointerId: 2, clientX: 400, clientY: 300 });
      fire('pointermove', { pointerId: 2, clientX: 410, clientY: 300 });
      fire('pointerup', { pointerId: 2, clientX: 410, clientY: 300 });
      const before = camera.get();

      fire('pointermove', { pointerId: 1, clientX: 201, clientY: 300 });

      expect(camera.get().x - before.x).toBeCloseTo(1);
      expect(camera.get().y - before.y).toBeCloseTo(0);
    });
  });

  describe('when zooming with two fingers', () => {
    it('zooms by the change of their distance', () => {
      const { fire, camera } = setup();
      fire('pointerdown', { pointerId: 1, clientX: 400, clientY: 300 });
      fire('pointerdown', { pointerId: 2, clientX: 500, clientY: 300 });

      fire('pointermove', { pointerId: 2, clientX: 600, clientY: 300 });

      expect(camera.get().zoom).toBeCloseTo(2);
    });
  });
});
