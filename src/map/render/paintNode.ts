import { Container, Graphics, type Text } from 'pixi.js';
import type { NodeDraw } from '../../core/scene/types.js';
import { shapePoints } from '../../core/shapes.js';
import type { TextPool } from './createTextPool.js';
import { flat, strokeDashes } from './strokes.js';

const INK = '#edefe6';
const MUTED = '#8a8f80';
const BELOW_GAP = 8;
const LINE_HEIGHT = 15.6;
export const ARROW_LIFT = 24;
export const ARROW_X = -5;

export type NodeSlot = {
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
  /** The opacity and size now, on their way to the ones of `node`. */
  alpha: number;
  scale: number;
};

/** What makes a node look different. Equal signatures need no repaint. */
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

/** A slot for a node, not yet painted. */
export function createNodeSlot(node: NodeDraw): NodeSlot {
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

/** Removes a slot and gives its texts back to the pool. */
export function destroyNodeSlot(slot: NodeSlot, texts: TextPool): void {
  [slot.arrow, slot.glyph, slot.name, slot.date].forEach((text) => {
    texts.drop(text);
  });
  slot.root.destroy({ children: true });
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
    slot.arrow.position.set(ARROW_X, -node.size / 2 - ARROW_LIFT);
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
export function paintNode(slot: NodeSlot, texts: TextPool): void {
  const signature = signatureOf(slot.node);
  if (signature === slot.signature) return;
  slot.signature = signature;
  paintShape(slot);
  paintRing(slot);
  paintArrow(slot, texts);
  paintGlyph(slot, texts);
  paintLabels(slot, texts);
}
