import { describe, expect, it, vi } from 'vitest';
import type { PathWorldOptions } from '../options.js';
import { createInteractionState } from './createInteractionState.js';
import { createPointerHooks } from './createPointerHooks.js';

const POINT = {
  id: 'a',
  pathId: 'gym',
  branchId: 'gym-main',
  title: 'A',
  date: '2026-11-10',
  kind: 'milestone',
  status: 'open',
  importance: 3,
  next: [],
  x: 0,
  y: 0,
};

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
  pathId: 'gym',
};

/**
 * The hooks with just enough around them: a scene with one lead, one point, the edits that are recorded, and the
 * options a test gives. `canMove` says whether the map can take moves now.
 */
function setup(options: Partial<PathWorldOptions> = {}, { canMove = true } = {}) {
  const setCursor = vi.fn();
  const interaction = createInteractionState();
  const rebuild = vi.fn();
  const edits = { canMove: () => canMove, movePoint: vi.fn(), moveArrow: vi.fn(), movePath: vi.fn() };
  const hooks = createPointerHooks({
    options: () => ({ view: 'v', ...options }),
    model: {
      world: () => ({
        today: '2026-11-11',
        period: { start: 0, end: 1 },
        paths: [{ id: 'gym', name: 'gym', color: '#fff' }],
        points: [POINT],
        arrows: [],
        spans: [],
      }),
      level: () => 'week',
    },
    scene: {
      current: () => ({ leads: [LEAD], edges: [], nodes: [{ id: 'a', x: 0, y: 0, size: 56 }] }),
      rebuild,
    },
    interaction,
    dragger: {},
    edits,
    viewport: { setCursor },
    toLayout: (position: { x: number; y: number }) => position,
    zoom: () => 1,
    today: () => '2026-11-11',
  } as unknown as Parameters<typeof createPointerHooks>[0]);
  return { hooks, interaction, rebuild, setCursor, edits };
}

describe('Pointer hooks', () => {
  describe('when the arrow at the end of a line is under the pointer', () => {
    it('is taken when the map can move things', () => {
      const { hooks } = setup();

      expect(hooks.lineEndAt({ x: 100, y: 50 })).toBe('lead:after:a:0');
    });

    it('is left alone when the map cannot move things, so it pans instead', () => {
      const { hooks } = setup({}, { canMove: false });

      expect(hooks.lineEndAt({ x: 100, y: 50 })).toBeNull();
    });
  });

  describe('when the pointer moves over the map', () => {
    it('shows a cross over the end of a line that can be moved', () => {
      const { hooks, setCursor } = setup();

      hooks.onCursor({ x: 100, y: 50 });

      expect(setCursor).toHaveBeenLastCalledWith('move');
    });

    it('shows a hand over a point even when the end of a line lies on it', () => {
      const { hooks, setCursor } = setup();

      hooks.onCursor({ x: 10, y: 5 });

      expect(setCursor).toHaveBeenLastCalledWith('pointer');
    });

    it('shows a hand over a line that cannot be moved', () => {
      const { hooks, setCursor } = setup({}, { canMove: false });

      hooks.onCursor({ x: 50, y: 25 });

      expect(setCursor).toHaveBeenLastCalledWith('pointer');
    });

    it('shows a hand over a point', () => {
      const { hooks, setCursor } = setup({}, { canMove: false });

      hooks.onCursor({ x: 0, y: 0 });

      expect(setCursor).toHaveBeenLastCalledWith('pointer');
    });

    it('shows the hand that pans over the empty area', () => {
      const { hooks, setCursor } = setup();

      hooks.onCursor({ x: 500, y: 500 });

      expect(setCursor).toHaveBeenLastCalledWith('grab');
    });
  });

  describe('when the end of a line is dragged', () => {
    it('moves only that end and takes no points along', () => {
      const { hooks, interaction } = setup();

      hooks.onLineEndMove('lead:after:a:0', { x: 100, y: 120 });

      expect(interaction.lineHeights().get('lead:after:a:0')).toBe(120);
      expect(interaction.pathShifts().size).toBe(0);
    });

    it('keeps its place along the time axis', () => {
      const { hooks, interaction } = setup();

      hooks.onLineEndMove('lead:after:a:0', { x: 400, y: 120 });

      expect(interaction.lineDrags().get('lead:after:a:0')).toMatchObject({ x: 100, y: 120 });
    });

    it('ignores a line that is not in the scene', () => {
      const { hooks, interaction } = setup();

      hooks.onLineEndMove('lead:after:zzz:0', { x: 100, y: 120 });

      expect(interaction.lineDrags().size).toBe(0);
    });
  });

  describe('when the line of a path is dragged', () => {
    it('is taken only when the map can move things and the line is on the pointer', () => {
      const listening = setup();
      const deaf = setup({}, { canMove: false });

      expect(listening.hooks.pathLineAt({ x: 50, y: 25 })).toBe('path:gym');
      expect(listening.hooks.pathLineAt({ x: 500, y: 500 })).toBeNull();
      expect(deaf.hooks.pathLineAt({ x: 50, y: 25 })).toBeNull();
    });

    it('moves the whole path along as a preview', () => {
      const { hooks, interaction } = setup();
      hooks.onLineGrab('path:gym', { x: 50, y: 25 });

      hooks.onLineEndMove('path:gym', { x: 50, y: 95 });

      expect(interaction.pathShifts().get('gym')).toEqual({ x: 0, y: 70 });
      expect(interaction.lineHeights().size).toBe(0);
    });

    it('tells the store edits how far the whole path moved', () => {
      const { hooks, edits } = setup();
      hooks.onLineGrab('path:gym', { x: 50, y: 25 });
      hooks.onLineEndMove('path:gym', { x: 50, y: 95 });

      hooks.onLineEndRelease('path:gym');

      expect(edits.movePath).toHaveBeenCalledWith('gym', { x: 0, y: 70 });
      expect(edits.moveArrow).not.toHaveBeenCalled();
    });

    it('tells the store edits that only the arrow moved when the arrow was taken', () => {
      const { hooks, edits } = setup();
      hooks.onLineEndMove('lead:after:a:0', { x: 100, y: 120 });

      hooks.onLineEndRelease('lead:after:a:0');

      expect(edits.moveArrow).toHaveBeenCalledWith('lead:after:a:0', 120);
      expect(edits.movePath).not.toHaveBeenCalled();
    });
  });

  describe('when the drag of a line end is cancelled', () => {
    it('lets the line go back to where it was', () => {
      const { hooks, interaction, rebuild } = setup();
      hooks.onLineEndMove('lead:after:a:0', { x: 100, y: 120 });

      hooks.onLineEndCancel('lead:after:a:0');

      expect(interaction.lineHeights().size).toBe(0);
      expect(rebuild).toHaveBeenCalled();
    });
  });

  describe('when the end of a line is let go', () => {
    it('reports where the end was dragged to, in the world', () => {
      const { hooks, edits } = setup();
      hooks.onLineEndMove('lead:after:a:0', { x: 100, y: -80 });

      hooks.onLineEndRelease('lead:after:a:0');

      expect(edits.moveArrow).toHaveBeenCalledWith('lead:after:a:0', -80);
    });

    it('reports the last place after several moves', () => {
      const { hooks, edits } = setup();
      hooks.onLineEndMove('lead:after:a:0', { x: 100, y: 20 });
      hooks.onLineEndMove('lead:after:a:0', { x: 100, y: -30 });

      hooks.onLineEndRelease('lead:after:a:0');

      expect(edits.moveArrow).toHaveBeenCalledWith('lead:after:a:0', -30);
    });

    it('lets the line go when it was not dragged anywhere', () => {
      const { hooks, edits } = setup();

      hooks.onLineEndRelease('lead:after:a:0');

      expect(edits.moveArrow).not.toHaveBeenCalled();
      expect(edits.movePath).not.toHaveBeenCalled();
    });
  });

  describe('when a line is clicked', () => {
    it('gives the app the lane of every path next to the place', () => {
      const onLineSelect = vi.fn();
      const { hooks } = setup({ onLineSelect });

      const found = hooks.onLineClick({ x: 50, y: 25 });

      expect(found).toBe(true);
      expect(onLineSelect).toHaveBeenCalledWith(expect.objectContaining({ lanes: { gym: 0 } }));
    });
  });

  describe('when the empty area is double-clicked', () => {
    it('gives the app the lane of every path next to the place', () => {
      const onPointAdd = vi.fn();
      const { hooks } = setup({ onPointAdd });

      hooks.onBackgroundDoubleClick({ x: 300, y: 300 });

      expect(onPointAdd).toHaveBeenCalledWith(expect.objectContaining({ lanes: { gym: 0 } }));
    });
  });
});
