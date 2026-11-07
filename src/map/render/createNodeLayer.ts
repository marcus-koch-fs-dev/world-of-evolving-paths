import { Container, Graphics, type Text } from 'pixi.js';
import type { NodeDraw } from '../../core/scene/types.js';
import { shapePoints } from '../../core/shapes.js';
import type { TextPool } from './createTextPool.js';
import { flat, strokeDashes } from './strokes.js';

const INK = '#edefe6';
const MUTED = '#8a8f80';
const SYMBOL_UNITS = 72; // the shape radius is given in a symbol 72 units wide
const SCALE_TAU = 60; // ms, how fast the size follows
const ALPHA_TAU = 250; // ms, how fast the opacity follows
const SCALE_STEP = 0.002;
const ALPHA_STEP = 0.003;
const BELOW_GAP = 8;
const LINE_HEIGHT = 15.6;
const ARROW_LIFT = 24;
const ARROW_BOB = 6;

type NodeSlot = {
  root: Container;
  marker: Container;
  shape: Graphics;
  ring: Graphics | null;
  arrow: Text | null;
  glyph: Text | null;
  name: Text | null;
  date: Text | null;
  node: NodeDraw;
  signature: string;
  alpha: number;
  scale: number;
};

export type NodeLayer = {
  container: Container;
  /** Off: size and opacity change at once, rings and arrows stand still. */
  setAnimate(animate: boolean): void;
  isAnimated(): boolean;
  /** True while a size or opacity is still on its way to its target. */
  isMoving(): boolean;
  sync(nodes: NodeDraw[]): void;
  /** Moves size and opacity toward their targets and pulses the rings (`ringPhase` 0 to 1). Returns true while something still moves. */
  tick(deltaMs: number, ringPhase: number, bob: number): boolean;
};

function signatureOf(node: NodeDraw): string {
  return [
    node.shape,
    node.radius,
    node.stroke,
    node.outlineWidth,
    node.fill,
    node.dash?.join(','),
    node.shapeAlpha,
    node.pulse,
    node.arrow,
    node.glyph,
    node.title,
    node.date,
    node.size,
  ].join('|');
}

function createSlot(node: NodeDraw): NodeSlot {
  const root = new Container();
  const marker = new Container();
  const shape = new Graphics();
  marker.addChild(shape);
  root.addChild(marker);
  return {
    root,
    marker,
    shape,
    ring: null,
    arrow: null,
    glyph: null,
    name: null,
    date: null,
    node,
    signature: '',
    alpha: node.alpha,
    scale: node.scale,
  };
}

function paintShape({ shape, node }: NodeSlot): void {
  const points = shapePoints(node.shape, node.radius);
  shape.clear();
  if (node.fill) shape.poly(flat(points)).fill({ color: node.fill });
  if (node.dash)
    strokeDashes(shape, [...points, points[0]], node.dash, 0, node.outlineWidth, node.stroke, node.shapeAlpha);
  else
    shape
      .poly(flat(points))
      .stroke({ width: node.outlineWidth, color: node.stroke, alpha: node.shapeAlpha, join: 'round' });
}

function paintRing(slot: NodeSlot): void {
  const { node } = slot;
  if (node.pulse && !slot.ring) {
    slot.ring = new Graphics();
    slot.root.addChildAt(slot.ring, 0);
  }
  if (!node.pulse && slot.ring) {
    slot.ring.destroy();
    slot.ring = null;
  }
  if (!slot.ring) return;
  slot.ring.clear();
  slot.ring.circle(0, 0, node.size / 2 + 2).stroke({ width: 2, color: node.stroke });
}

function paintArrow(slot: NodeSlot, texts: TextPool): void {
  const { node } = slot;
  if (node.arrow && !slot.arrow) {
    slot.arrow = texts.make('▼', 14, node.stroke);
    slot.arrow.anchor.set(0, 0);
    slot.arrow.position.set(-5, -node.size / 2 - ARROW_LIFT);
    slot.root.addChild(slot.arrow);
  }
  if (!node.arrow && slot.arrow) {
    texts.drop(slot.arrow);
    slot.arrow = null;
  }
  if (slot.arrow) slot.arrow.style.fill = node.stroke;
}

function paintGlyph(slot: NodeSlot, texts: TextPool): void {
  const { node } = slot;
  if (!node.glyph) {
    texts.drop(slot.glyph);
    slot.glyph = null;
    return;
  }
  if (!slot.glyph) {
    slot.glyph = texts.make(node.glyph, 22, node.stroke);
    slot.glyph.anchor.set(0.5);
    slot.marker.addChild(slot.glyph);
  }
  slot.glyph.text = node.glyph;
  slot.glyph.style.fill = node.stroke;
  slot.glyph.position.set(0, 1);
}

/** One line of text under the symbol. Creates, updates or removes it as the value comes and goes. */
function paintLine(
  slot: NodeSlot,
  texts: TextPool,
  current: Text | null,
  value: string,
  size: number,
  color: string,
  y: number,
): Text | null {
  if (!value) {
    texts.drop(current);
    return null;
  }
  const text = current ?? texts.make(value, size, color);
  if (!current) {
    text.anchor.set(0.5, 0);
    slot.root.addChild(text);
  }
  text.text = value;
  text.position.set(0, y);
  return text;
}

function paintLabels(slot: NodeSlot, texts: TextPool): void {
  const { node } = slot;
  const below = node.size / 2 + BELOW_GAP;
  slot.name = paintLine(slot, texts, slot.name, node.title, 12, INK, below);
  slot.date = paintLine(slot, texts, slot.date, node.date, 11, MUTED, below + (node.title ? LINE_HEIGHT : 0));
}

/** Repaints a slot, but only when something about the node looks different. */
function paint(slot: NodeSlot, texts: TextPool): void {
  const signature = signatureOf(slot.node);
  if (signature === slot.signature) return;
  slot.signature = signature;
  paintShape(slot);
  paintRing(slot);
  paintArrow(slot, texts);
  paintGlyph(slot, texts);
  paintLabels(slot, texts);
}

function place(slot: NodeSlot): void {
  const { node } = slot;
  slot.root.position.set(node.x, node.y);
  slot.root.alpha = slot.alpha;
  slot.marker.scale.set((node.size / SYMBOL_UNITS) * slot.scale);
}

const isFollowing = (slot: NodeSlot) =>
  Math.abs(slot.node.scale - slot.scale) > SCALE_STEP || Math.abs(slot.node.alpha - slot.alpha) > ALPHA_STEP;

/** Moves the size and opacity of a slot toward the node's. Returns true while it is still on its way. */
function follow(slot: NodeSlot, deltaMs: number): boolean {
  const { node } = slot;
  let busy = false;
  if (Math.abs(node.scale - slot.scale) > SCALE_STEP) {
    slot.scale += (node.scale - slot.scale) * (1 - Math.exp(-deltaMs / SCALE_TAU));
    busy = true;
  } else slot.scale = node.scale;
  if (Math.abs(node.alpha - slot.alpha) > ALPHA_STEP) {
    slot.alpha += (node.alpha - slot.alpha) * (1 - Math.exp(-deltaMs / ALPHA_TAU));
    busy = true;
  } else slot.alpha = node.alpha;
  return busy;
}

/** Draws the point symbols with their names. Size and opacity follow smoothly, only changed points are repainted. */
export function createNodeLayer(texts: TextPool): NodeLayer {
  const container = new Container();
  const slots = new Map<string, NodeSlot>();
  let animate = true;

  const slotFor = (node: NodeDraw): NodeSlot => {
    const existing = slots.get(node.id);
    if (existing) return existing;
    const created = createSlot(node);
    container.addChild(created.root);
    slots.set(node.id, created);
    return created;
  };

  return {
    container,
    setAnimate: (on) => {
      animate = on;
    },
    isAnimated: () => animate && [...slots.values()].some((slot) => slot.node.pulse),
    isMoving: () => animate && [...slots.values()].some(isFollowing),

    sync(nodes) {
      const seen = new Set<string>();
      nodes.forEach((node) => {
        seen.add(node.id);
        const slot = slotFor(node);
        slot.node = node;
        if (!animate) {
          slot.alpha = node.alpha;
          slot.scale = node.scale;
        }
        paint(slot, texts);
        place(slot);
      });
      slots.forEach((slot, id) => {
        if (seen.has(id)) return;
        [slot.arrow, slot.glyph, slot.name, slot.date].forEach((text) => {
          texts.drop(text);
        });
        slot.root.destroy({ children: true });
        slots.delete(id);
      });
    },

    tick(deltaMs, ringPhase, bob) {
      // Every slot must follow, so collect the results first and only then ask whether any is still moving
      const moving = [...slots.values()].map((slot) => {
        const busy = follow(slot, deltaMs);
        place(slot);
        if (slot.ring) {
          slot.ring.scale.set(1 + 1.2 * ringPhase);
          slot.ring.alpha = 0.6 * (1 - ringPhase);
        }
        if (slot.arrow) slot.arrow.position.set(-5, -slot.node.size / 2 - ARROW_LIFT - ARROW_BOB * bob);
        return busy;
      });
      return moving.some(Boolean);
    },
  };
}
