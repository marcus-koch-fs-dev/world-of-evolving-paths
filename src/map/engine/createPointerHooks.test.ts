import { describe, expect, it, vi } from 'vitest';
import type { PathWorldOptions } from '../options.js';
import { createInteractionState } from './createInteractionState.js';
import { createPointerHooks } from './createPointerHooks.js';

const LEAD = { end: { x: 100, y: 50 }, trackKey: 'lead:after:a:0' };

/** The hooks with just enough around them for the line ends: a scene with one lead and the options a test gives. */
function setup(options: Partial<PathWorldOptions>) {
  const interaction = createInteractionState();
  const rebuild = vi.fn();
  const hooks = createPointerHooks({
    options: () => ({ periods: {}, view: 'v', ...options }),
    model: { world: () => null, periodData: () => undefined },
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
});
