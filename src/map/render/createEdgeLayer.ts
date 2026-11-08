import type { Container } from 'pixi.js';
import type { EdgeDraw } from '../../core/scene/types.js';
import { createLineLayer } from './createLineLayer.js';
import { createLitLayer } from './createLitLayer.js';

export type EdgeLayer = {
  lines: Container;
  glow: Container;
  lit: Container;
  /** Off: dashes stand still, lit lines appear at once and the glow does not breathe. */
  setAnimate(animate: boolean): void;
  /** Blur works in screen pixels, the look is defined in world units. */
  setZoom(zoom: number): void;
  /** True while something moves on its own: flowing dashes or a line drawing itself. */
  isAnimated(): boolean;
  sync(edges: EdgeDraw[]): void;
  /** Advances the animations. Returns true while a line is still drawing itself in. */
  tick(time: number): boolean;
};

/** Draws the lines: the plain line, the walked part on top and its glow underneath. */
export function createEdgeLayer(): EdgeLayer {
  const lines = createLineLayer();
  const lit = createLitLayer();

  return {
    lines: lines.container,
    glow: lit.glow,
    lit: lit.lit,
    setAnimate(animate) {
      lines.setAnimate(animate);
      lit.setAnimate(animate);
    },
    setZoom: lit.setZoom,
    isAnimated: () => lines.isAnimated() || lit.isAnimated(),
    sync(edges) {
      lines.sync(edges);
      lit.sync(edges);
    },
    tick(time) {
      lines.tick(time);
      return lit.tick(time);
    },
  };
}
