import { Container, Graphics, type Text } from 'pixi.js';
import type { NodeDraw } from '../../core/scene/types';
import { shapePoints } from '../../core/shapes';
import { flat, strokeDashes } from './strokes';
import type { TextPool } from './TextPool';

const INK = '#edefe6';
const MUTED = '#8a8f80';
const SYMBOL_UNITS = 72; // the shape radius is given in a symbol 72 units wide
const OUTLINE_WIDTH = 2.5;
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

function signatureOf(node: NodeDraw): string {
  return [
    node.shape,
    node.radius,
    node.stroke,
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

/** Draws the point symbols with their names. Size and opacity follow smoothly, only changed points are repainted. */
export class NodeLayer {
  readonly container = new Container();
  private readonly slots = new Map<string, NodeSlot>();

  constructor(private readonly texts: TextPool) {}

  get animated(): boolean {
    return [...this.slots.values()].some((slot) => slot.node.pulse);
  }

  sync(nodes: NodeDraw[]): void {
    const seen = new Set<string>();
    for (const node of nodes) {
      seen.add(node.id);
      const slot = this.slots.get(node.id) ?? this.create(node);
      slot.node = node;
      this.paint(slot);
      this.place(slot);
    }
    for (const [id, slot] of this.slots) {
      if (seen.has(id)) continue;
      for (const text of [slot.arrow, slot.glyph, slot.name, slot.date]) this.texts.drop(text);
      slot.root.destroy({ children: true });
      this.slots.delete(id);
    }
  }

  /** Moves size and opacity toward their targets and pulses the rings (`ringPhase` 0 to 1). Returns true while something still moves. */
  tick(deltaMs: number, ringPhase: number, bob: number): boolean {
    const follow = (tau: number) => 1 - Math.exp(-deltaMs / tau);
    let busy = false;
    for (const slot of this.slots.values()) {
      const { node } = slot;
      if (Math.abs(node.scale - slot.scale) > SCALE_STEP) {
        slot.scale += (node.scale - slot.scale) * follow(SCALE_TAU);
        busy = true;
      } else slot.scale = node.scale;
      if (Math.abs(node.alpha - slot.alpha) > ALPHA_STEP) {
        slot.alpha += (node.alpha - slot.alpha) * follow(ALPHA_TAU);
        busy = true;
      } else slot.alpha = node.alpha;
      this.place(slot);
      if (slot.ring) {
        slot.ring.scale.set(1 + 1.2 * ringPhase);
        slot.ring.alpha = 0.6 * (1 - ringPhase);
      }
      if (slot.arrow) slot.arrow.position.set(-5, -node.size / 2 - ARROW_LIFT - ARROW_BOB * bob);
    }
    return busy;
  }

  private create(node: NodeDraw): NodeSlot {
    const root = new Container();
    const marker = new Container();
    const shape = new Graphics();
    marker.addChild(shape);
    root.addChild(marker);
    this.container.addChild(root);
    const slot: NodeSlot = {
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
    this.slots.set(node.id, slot);
    return slot;
  }

  private paint(slot: NodeSlot): void {
    const { node } = slot;
    const signature = signatureOf(node);
    if (signature === slot.signature) return;
    slot.signature = signature;
    this.paintShape(slot);
    this.paintRing(slot);
    this.paintArrow(slot);
    this.paintGlyph(slot);
    this.paintLabels(slot);
  }

  private paintShape({ shape, node }: NodeSlot): void {
    const points = shapePoints(node.shape, node.radius);
    shape.clear();
    if (node.fill) shape.poly(flat(points)).fill({ color: node.fill });
    if (node.dash)
      strokeDashes(shape, [...points, points[0]], node.dash, 0, OUTLINE_WIDTH, node.stroke, node.shapeAlpha);
    else
      shape
        .poly(flat(points))
        .stroke({ width: OUTLINE_WIDTH, color: node.stroke, alpha: node.shapeAlpha, join: 'round' });
  }

  private paintRing(slot: NodeSlot): void {
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

  private paintArrow(slot: NodeSlot): void {
    const { node } = slot;
    if (node.arrow && !slot.arrow) {
      slot.arrow = this.texts.make('▼', 14, node.stroke);
      slot.arrow.anchor.set(0, 0);
      slot.root.addChild(slot.arrow);
    }
    if (!node.arrow && slot.arrow) {
      this.texts.drop(slot.arrow);
      slot.arrow = null;
    }
    if (slot.arrow) slot.arrow.style.fill = node.stroke;
  }

  private paintGlyph(slot: NodeSlot): void {
    const { node } = slot;
    if (!node.glyph) {
      this.texts.drop(slot.glyph);
      slot.glyph = null;
      return;
    }
    if (!slot.glyph) {
      slot.glyph = this.texts.make(node.glyph, 22, node.stroke);
      slot.glyph.anchor.set(0.5);
      slot.marker.addChild(slot.glyph);
    }
    slot.glyph.text = node.glyph;
    slot.glyph.style.fill = node.stroke;
    slot.glyph.position.set(0, 1);
  }

  private paintLabels(slot: NodeSlot): void {
    const { node } = slot;
    const below = node.size / 2 + BELOW_GAP;
    slot.name = this.label(slot, slot.name, node.title, 12, INK, below);
    slot.date = this.label(slot, slot.date, node.date, 11, MUTED, below + (node.title ? LINE_HEIGHT : 0));
  }

  private label(
    slot: NodeSlot,
    current: Text | null,
    value: string,
    size: number,
    color: string,
    y: number,
  ): Text | null {
    if (!value) {
      this.texts.drop(current);
      return null;
    }
    const text = current ?? this.texts.make(value, size, color);
    if (!current) {
      text.anchor.set(0.5, 0);
      slot.root.addChild(text);
    }
    text.text = value;
    text.position.set(0, y);
    return text;
  }

  private place(slot: NodeSlot): void {
    const { node } = slot;
    slot.root.position.set(node.x, node.y);
    slot.root.alpha = slot.alpha;
    slot.marker.scale.set((node.size / SYMBOL_UNITS) * slot.scale);
  }
}
