import { describe, expect, it, vi } from 'vitest';
import { createCameraController } from '../camera/createCameraController.js';
import { createPointerController, type PointerHooks } from './createPointerController.js';

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
    (listeners.get(type) ?? []).forEach((listener) => {
      listener(event);
    });
  };
  return { element: element as unknown as HTMLElement, fire };
}

function setup(
  options: {
    pointAt?: PointerHooks['pointAt'];
    leadAt?: PointerHooks['leadAt'];
    onLineClick?: PointerHooks['onLineClick'];
    lineEndAt?: PointerHooks['lineEndAt'];
    offset?: { left: number; top: number };
  } = {},
) {
  const { element, fire } = fakeElement(options.offset);
  const camera = createCameraController(() => ({ width: 1000, height: 800 }));
  const hooks = {
    pointAt: vi.fn(options.pointAt ?? (() => null)),
    onHover: vi.fn(),
    onPointPress: vi.fn(() => true),
    onDragMove: vi.fn(),
    onDragEnd: vi.fn(),
    onBackgroundClick: vi.fn(),
    onLineClick: vi.fn(options.onLineClick ?? (() => false)),
    lineEndAt: vi.fn(options.lineEndAt ?? (() => null)),
    onLineEndMove: vi.fn(),
    onLineEndRelease: vi.fn(),
    leadAt: vi.fn(options.leadAt ?? (() => null)),
    onPointDoubleClick: vi.fn(),
    onLeadDoubleClick: vi.fn(),
    onBackgroundDoubleClick: vi.fn(),
  };
  const controller = createPointerController(element, camera, hooks, () => ({ x: 100, y: 100 }));
  return { fire, camera, hooks, controller };
}

const onPoint = () => 'a';

describe('Pointer controller', () => {
  describe('when a double-click happens', () => {
    it('on a point tells the hooks which point, and does not add a point', () => {
      const { fire, hooks } = setup({ pointAt: onPoint });

      fire('dblclick', { clientX: 100, clientY: 100 });

      expect(hooks.onPointDoubleClick).toHaveBeenCalledWith('a');
      expect(hooks.onBackgroundDoubleClick).not.toHaveBeenCalled();
    });

    it('on a line that leaves the view tells the hooks which line, and does not add a point', () => {
      const { fire, hooks } = setup({ leadAt: () => 'lead:after:a:0' });

      fire('dblclick', { clientX: 100, clientY: 100 });

      expect(hooks.onLeadDoubleClick).toHaveBeenCalledWith('lead:after:a:0');
      expect(hooks.onBackgroundDoubleClick).not.toHaveBeenCalled();
    });

    it('on a point wins over a line that leaves the view', () => {
      const { fire, hooks } = setup({ pointAt: onPoint, leadAt: () => 'lead:after:a:0' });

      fire('dblclick', { clientX: 100, clientY: 100 });

      expect(hooks.onPointDoubleClick).toHaveBeenCalledWith('a');
      expect(hooks.onLeadDoubleClick).not.toHaveBeenCalled();
    });

    it('on the empty area tells the hooks the position, and no point is reported', () => {
      const { fire, hooks } = setup();

      fire('dblclick', { clientX: 100, clientY: 100 });

      expect(hooks.onBackgroundDoubleClick).toHaveBeenCalled();
      expect(hooks.onPointDoubleClick).not.toHaveBeenCalled();
    });
  });

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

  describe('when a line is tapped', () => {
    it('tells the hooks about the line and does not count it as a click on the background', () => {
      const { fire, hooks } = setup({ onLineClick: () => true });

      fire('pointerdown');
      fire('pointerup');

      expect(hooks.onLineClick).toHaveBeenCalledOnce();
      expect(hooks.onBackgroundClick).not.toHaveBeenCalled();
    });
  });

  describe('when the end of a line is dragged', () => {
    it('moves that line, tells the hooks when it is let go, and does not pan the map', () => {
      const { fire, hooks, camera } = setup({ lineEndAt: () => 'lead:after:a:0' });
      const before = camera.get();

      fire('pointerdown', { clientX: 0, clientY: 0 });
      fire('pointermove', { clientX: 0, clientY: 50, buttons: 1 });
      fire('pointerup', { clientX: 0, clientY: 50 });

      expect(hooks.onLineEndMove).toHaveBeenCalledWith('lead:after:a:0', expect.anything());
      expect(hooks.onLineEndRelease).toHaveBeenCalledWith('lead:after:a:0');
      expect(camera.get()).toEqual(before);
    });

    it('is a click on the line when it did not move', () => {
      const { fire, hooks } = setup({ lineEndAt: () => 'lead:after:a:0', onLineClick: () => true });

      fire('pointerdown');
      fire('pointerup');

      expect(hooks.onLineEndRelease).not.toHaveBeenCalled();
      expect(hooks.onLineClick).toHaveBeenCalledOnce();
    });
  });

  describe('when a line is right-clicked', () => {
    it('opens the menu of the app and keeps the menu of the browser away', () => {
      const prevent = vi.fn();
      const { fire, hooks } = setup({ onLineClick: () => true });

      fire('contextmenu', { preventDefault: prevent });

      expect(hooks.onLineClick).toHaveBeenCalledOnce();
      expect(prevent).toHaveBeenCalledOnce();
    });

    it('leaves the menu of the browser alone where there is no line', () => {
      const prevent = vi.fn();
      const { fire } = setup();

      fire('contextmenu', { preventDefault: prevent });

      expect(prevent).not.toHaveBeenCalled();
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

  describe('when the view is replaced during a drag', () => {
    it('forgets the drag, so releasing reports nothing', () => {
      const { fire, hooks, controller } = setup({ pointAt: onPoint });
      fire('pointerdown', { clientX: 100, clientY: 100 });

      controller.cancel();
      fire('pointerup', { clientX: 100, clientY: 100 });

      expect(hooks.onDragEnd).not.toHaveBeenCalled();
    });
  });
});
