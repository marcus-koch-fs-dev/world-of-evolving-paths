import { Container, Graphics } from 'pixi.js';
import type { EdgeDraw } from '../../core/scene/types.js';
import { createSlotMap } from './createSlotMap.js';
import { lineSignature } from './edgeSignatures.js';
import { strokeDashes, strokeLine } from './strokes.js';
import { flowShift, now } from './timing.js';

type LineSlot = { g: Graphics; signature: string; edge: EdgeDraw };

export type LineLayer = {
  container: Container;
  /** Off: dashes stand still. */
  setAnimate(animate: boolean): void;
  /** True while dashes flow. */
  isAnimated(): boolean;
  sync(edges: EdgeDraw[]): void;
  /** Moves the flowing dashes. */
  tick(time: number): void;
};

function drawLine(g: Graphics, edge: EdgeDraw, shift: number): void {
  g.clear();
  if (edge.dash) strokeDashes(g, edge.points, edge.dash, edge.flow ? shift : 0, edge.width, edge.color, edge.alpha);
  else strokeLine(g, edge.points, edge.width, edge.color, edge.alpha);
}

/** Draws the plain lines. Only changed lines are redrawn; dashes may flow. */
export function createLineLayer(): LineLayer {
  const container = new Container();
  let animate = true;

  const slots = createSlotMap<EdgeDraw, LineSlot>({
    create(edge) {
      const slot = { g: new Graphics(), signature: '', edge };
      container.addChild(slot.g);
      return slot;
    },
    destroy: (slot) => slot.g.destroy(),
  });

  const update = (slot: LineSlot, edge: EdgeDraw) => {
    slot.edge = edge;
    const signature = lineSignature(edge);
    const moving = edge.flow && animate;
    if (!moving && signature === slot.signature) return;
    drawLine(slot.g, edge, animate ? flowShift(now()) : 0);
    slot.signature = moving ? '' : signature;
  };

  return {
    container,
    setAnimate: (on) => {
      animate = on;
    },
    isAnimated: () => animate && slots.values().some((slot) => slot.edge.flow),
    sync: (edges) => slots.sync(edges, update),

    tick(time) {
      const shift = flowShift(time);
      slots
        .values()
        .filter((slot) => slot.edge.flow)
        .forEach((slot) => {
          drawLine(slot.g, slot.edge, shift);
        });
    },
  };
}
