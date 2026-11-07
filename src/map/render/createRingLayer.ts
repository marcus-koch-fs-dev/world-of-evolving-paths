import { Container, Graphics } from 'pixi.js';
import type { RingDraw } from '../../core/scene/types';

const RING_COLOR = '#edefe6';
const RING_WIDTH = 1;
const DRAGGED_ALPHA = 0.45;
const NEIGHBOUR_ALPHA = 0.2;

export type RingLayer = { container: Container; sync(rings: RingDraw[]): void };

/** Thin circles that show how much room points keep. They appear only while a point is dragged. */
export function createRingLayer(): RingLayer {
  const container = new Container();
  const graphics = new Graphics();
  container.addChild(graphics);

  return {
    container,
    sync(rings) {
      graphics.clear();
      for (const ring of rings) {
        graphics.circle(ring.x, ring.y, ring.radius).stroke({
          width: RING_WIDTH,
          color: RING_COLOR,
          alpha: ring.dragged ? DRAGGED_ALPHA : NEIGHBOUR_ALPHA,
        });
      }
    },
  };
}
