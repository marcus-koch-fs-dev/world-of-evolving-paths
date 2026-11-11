import { describe, expect, it, vi } from 'vitest';
import type { PathWorldOptions } from '../options.js';
import { createInteractionState } from './createInteractionState.js';
import { createPointerHooks } from './createPointerHooks.js';

const POINT = { id: 'a', pathId: 'gym', title: 'A', date: '2026-11-10', kind: 'milestone', next: [], x: 0, y: 0 };
/** A line that leaves the point `a`, with its arrow at (100, 50) and the lane of its path at -100. */
const LEAD = {
  id: 'lead:after:a:0',
  pointId: 'a',
  lead: { title: 'Out', date: '2026-12-20' },
  side: 'after',
  end: { x: 100, y: 50 },
  line: [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ],
  x: 116,
  y: 50,
  text: 'Out',
  anchor: { x: 0, y: 0.5 },
  trackKey: 'lead:after:a:0',
  lane: -100,
};

/** The hooks with just enough around them: a scene with one lead, one point and the options a test gives. */
function setup(options: Partial<PathWorldOptions>) {
  const interaction = createInteractionState();
  const rebuild = vi.fn();
  const hooks = createPointerHooks({
    options: () => ({ periods: {}, view: 'v', ...options }),
    model: {
      world: () => ({ today: '2026-11-11', period: null, paths: [], points: [POINT] }),
      periodData: () => null,
    },
    scene: { current: () => ({ leads: [LEAD], edges: [], nodes: [] }), rebuild },
    interaction,
    dragger: {},
    viewport: { setCursor: () => undefined },
    toLayout: (position: { x: number; y: number }) => position,
    zoom: () => 1,
    today: () => '2026-11-11',
  } as unknown as Parameters<typeof createPointerHooks>[0]);
  return { hooks, interaction, rebuild };
}

describe('Pointer hooks', () => {
  describe('when the arrow at the end of a line is under the pointer', () => {
    it('is taken when the app listens for the move', () => {
      const { hooks } = setup({ onLineEndMove: () => undefined });

      expect(hooks.lineEndAt({ x: 100, y: 50 })).toBe('lead:after:a:0');
    });

    it('is left alone when the app does not listen, so the map pans instead', () => {
      const { hooks } = setup({});

      expect(hooks.lineEndAt({ x: 100, y: 50 })).toBeNull();
    });

    it('is left alone when points cannot be dragged', () => {
      const { hooks } = setup({ onLineEndMove: () => undefined, pointsLocked: true });

      expect(hooks.lineEndAt({ x: 100, y: 50 })).toBeNull();
    });
  });

  describe('when the drag of a line end is cancelled', () => {
    it('lets the line go back to where it was', () => {
      const { hooks, interaction, rebuild } = setup({ onLineEndMove: () => undefined });
      hooks.onLineEndMove('lead:after:a:0', { x: 100, y: 120 });

      hooks.onLineEndCancel('lead:after:a:0');

      expect(interaction.lineHeights().size).toBe(0);
      expect(rebuild).toHaveBeenCalled();
    });
  });

  describe('when the end of a line is let go', () => {
    it('reports the height as a distance from the lane of the path of the line', () => {
      const onLineEndMove = vi.fn();
      const { hooks } = setup({ onLineEndMove });
      hooks.onLineEndMove('lead:after:a:0', { x: 100, y: -80 });

      hooks.onLineEndRelease('lead:after:a:0');

      expect(onLineEndMove).toHaveBeenCalledWith(expect.objectContaining({ y: 20 }));
    });

    it('names the two points of the connection', () => {
      const onLineEndMove = vi.fn();
      const { hooks } = setup({ onLineEndMove });
      hooks.onLineEndMove('lead:after:a:0', { x: 100, y: 0 });

      hooks.onLineEndRelease('lead:after:a:0');

      expect(onLineEndMove).toHaveBeenCalledWith(
        expect.objectContaining({
          from: { id: 'a', title: 'A', date: '2026-11-10' },
          to: { id: undefined, title: 'Out', date: '2026-12-20' },
        }),
      );
    });

    it('lets the line go when it was not dragged anywhere', () => {
      const onLineEndMove = vi.fn();
      const { hooks } = setup({ onLineEndMove });

      hooks.onLineEndRelease('lead:after:a:0');

      expect(onLineEndMove).not.toHaveBeenCalled();
    });
  });

  describe('when a line is clicked', () => {
    it('gives the app the lane of every path next to the place', () => {
      const onLineSelect = vi.fn();
      const { hooks } = setup({ onLineSelect });

      const found = hooks.onLineClick({ x: 50, y: 25 });

      expect(found).toBe(true);
      expect(onLineSelect).toHaveBeenCalledWith(expect.objectContaining({ lanes: {} }));
    });
  });

  describe('when the empty area is double-clicked', () => {
    it('gives the app the lane of every path next to the place', () => {
      const onPointAdd = vi.fn();
      const { hooks } = setup({ onPointAdd });

      hooks.onBackgroundDoubleClick({ x: 300, y: 300 });

      expect(onPointAdd).toHaveBeenCalledWith(expect.objectContaining({ lanes: {} }));
    });
  });
});
