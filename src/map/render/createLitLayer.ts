import { BlurFilter, Container, Graphics } from 'pixi.js';
import { cutAt } from '../../core/scene/curves.js';
import type { EdgeDraw } from '../../core/scene/types.js';
import { createSlotMap } from './createSlotMap.js';
import { litSignature } from './edgeSignatures.js';
import { strokeLine } from './strokes.js';
import { DRAW_MS, easeOut, GLOW_MS, now } from './timing.js';

const GLOW_BLUR = 5;
const GLOW_EXTRA_WIDTH = 6;
const GLOW_BASE_ALPHA = 0.7;
const GLOW_BREATH = 0.3;

type LitSlot = { g: Graphics; glow: Graphics; born: number; signature: string; edge: EdgeDraw; drawing: boolean };

export type LitLayer = {
  /** The walked parts of the lines. */
  lit: Container;
  /** The soft light under them. */
  glow: Container;
  /** Off: lit lines appear at once and the glow does not breathe. */
  setAnimate(animate: boolean): void;
  /** Blur works in screen pixels, the look is defined in world units. */
  setZoom(zoom: number): void;
  /** True while there are lit lines that may draw themselves in or glow. */
  isAnimated(): boolean;
  /** Takes the edges that have a lit part; others are ignored. */
  sync(edges: EdgeDraw[]): void;
  /** Advances the animations. Returns true while a line is still drawing itself in. */
  tick(time: number): boolean;
};

/** Draws the walked part of a line, as far as it has drawn itself in, and its glow. */
function drawLit(slot: LitSlot): void {
  const lit = slot.edge.lit;
  if (!lit) return;
  const progress = easeOut(Math.min(1, (now() - slot.born) / DRAW_MS));
  slot.drawing = progress < 1;
  const points = progress < 1 ? cutAt(lit.points, progress) : lit.points;
  slot.g.clear();
  slot.glow.clear();
  strokeLine(slot.g, points, lit.width, lit.color, 1);
  // A glow only appears from a certain strength tier, stronger the stronger the path
  slot.glow.alpha = slot.edge.glow;
  if (slot.edge.glow > 0) strokeLine(slot.glow, points, lit.width + GLOW_EXTRA_WIDTH, lit.color, 1);
}

/** Draws the walked parts of the lines on top of the plain lines, with a breathing glow underneath. */
export function createLitLayer(): LitLayer {
  const lit = new Container();
  const glow = new Container();
  const blur = new BlurFilter({ strength: GLOW_BLUR });
  glow.filters = [blur];
  let animate = true;

  const slots = createSlotMap<EdgeDraw, LitSlot>({
    create(edge) {
      const slot = {
        g: new Graphics(),
        glow: new Graphics(),
        born: animate ? now() : now() - DRAW_MS,
        signature: '',
        edge,
        drawing: animate,
      };
      lit.addChild(slot.g);
      glow.addChild(slot.glow);
      return slot;
    },
    destroy(slot) {
      slot.g.destroy();
      slot.glow.destroy();
    },
  });

  const update = (slot: LitSlot, edge: EdgeDraw) => {
    slot.edge = edge;
    const signature = litSignature(edge);
    if (signature === slot.signature && !slot.drawing) return;
    slot.signature = signature;
    drawLit(slot);
  };

  return {
    lit,
    glow,
    setAnimate: (on) => {
      animate = on;
    },
    setZoom: (zoom) => {
      blur.strength = GLOW_BLUR * zoom;
    },
    isAnimated: () => animate && slots.values().length > 0,

    sync(edges) {
      slots.sync(
        edges.filter((edge) => edge.lit),
        update,
      );
      if (!animate) glow.alpha = GLOW_BASE_ALPHA + GLOW_BREATH / 2;
    },

    tick(time) {
      glow.alpha = GLOW_BASE_ALPHA + GLOW_BREATH * (0.5 - 0.5 * Math.cos((2 * Math.PI * time) / (GLOW_MS * 2)));
      const drawing = slots.values().filter((slot) => slot.drawing);
      drawing.forEach(drawLit);
      return drawing.length > 0;
    },
  };
}
