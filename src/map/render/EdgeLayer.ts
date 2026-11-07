import { BlurFilter, Container, Graphics } from 'pixi.js';
import { cutAt } from '../../core/scene/curves';
import type { EdgeDraw } from '../../core/scene/types';
import { strokeDashes, strokeLine } from './strokes';
import { DRAW_MS, easeOut, flowShift, GLOW_MS, now } from './timing';

const GLOW_BLUR = 5;
const GLOW_EXTRA_WIDTH = 6;
const GLOW_BASE_ALPHA = 0.7;
const GLOW_BREATH = 0.3;

type LineSlot = { g: Graphics; signature: string; edge: EdgeDraw };
type LitSlot = { g: Graphics; glow: Graphics; born: number; signature: string; edge: EdgeDraw; drawing: boolean };

/** A signature that changes whenever a line looks different. The wave only changes the course, not the ends. */
function lineSignature(edge: EdgeDraw): string {
  const first = edge.points[0];
  const last = edge.points[edge.points.length - 1];
  const quarter = edge.points[Math.floor(edge.points.length / 4)];
  return `${first.x},${first.y},${quarter.x},${quarter.y},${last.x},${last.y}|${edge.color}|${edge.width}|${edge.alpha}|${edge.dash ?? ''}`;
}

function litSignature(edge: EdgeDraw): string {
  const lit = edge.lit;
  return `${lineSignature(edge)}|${lit?.points.length}|${lit?.color}|${lit?.width}|${edge.glow}`;
}

function drawLine(g: Graphics, edge: EdgeDraw, shift: number): void {
  g.clear();
  if (edge.dash) strokeDashes(g, edge.points, edge.dash, edge.flow ? shift : 0, edge.width, edge.color, edge.alpha);
  else strokeLine(g, edge.points, edge.width, edge.color, edge.alpha);
}

/** Draws the lines: the plain line, the walked part on top and its glow underneath. Only changed lines are redrawn. */
export class EdgeLayer {
  readonly lines = new Container();
  readonly glow = new Container();
  readonly lit = new Container();
  private readonly blur = new BlurFilter({ strength: GLOW_BLUR });
  private readonly lineSlots = new Map<string, LineSlot>();
  private readonly litSlots = new Map<string, LitSlot>();

  /** Off: dashes stand still, lit lines appear at once and the glow does not breathe. */
  animate = true;

  constructor() {
    this.glow.filters = [this.blur];
  }

  /** Blur works in screen pixels, the look is defined in world units. */
  setZoom(zoom: number): void {
    this.blur.strength = GLOW_BLUR * zoom;
  }

  /** True while something moves on its own: flowing dashes or a line drawing itself. */
  get animated(): boolean {
    return this.animate && (this.litSlots.size > 0 || [...this.lineSlots.values()].some((slot) => slot.edge.flow));
  }

  sync(edges: EdgeDraw[]): void {
    const seen = new Set<string>();
    const walked = new Set<string>();
    for (const edge of edges) {
      seen.add(edge.id);
      this.syncLine(edge);
      if (!edge.lit) continue;
      walked.add(edge.id);
      this.syncLit(edge);
    }
    this.dropMissing(seen, walked);
    if (!this.animate) this.glow.alpha = GLOW_BASE_ALPHA + GLOW_BREATH / 2;
  }

  /** Advances the animations. Returns true while a line is still drawing itself in. */
  tick(time: number): boolean {
    this.glow.alpha = GLOW_BASE_ALPHA + GLOW_BREATH * (0.5 - 0.5 * Math.cos((2 * Math.PI * time) / (GLOW_MS * 2)));
    const shift = flowShift(time);
    for (const slot of this.lineSlots.values()) if (slot.edge.flow) drawLine(slot.g, slot.edge, shift);
    let busy = false;
    for (const slot of this.litSlots.values()) {
      if (!slot.drawing) continue;
      this.drawLit(slot);
      busy = true;
    }
    return busy;
  }

  private syncLine(edge: EdgeDraw): void {
    let slot = this.lineSlots.get(edge.id);
    if (!slot) {
      slot = { g: new Graphics(), signature: '', edge };
      this.lines.addChild(slot.g);
      this.lineSlots.set(edge.id, slot);
    }
    slot.edge = edge;
    const signature = lineSignature(edge);
    const moving = edge.flow && this.animate;
    if (!moving && signature === slot.signature) return;
    drawLine(slot.g, edge, this.animate ? flowShift(now()) : 0);
    slot.signature = moving ? '' : signature;
  }

  private syncLit(edge: EdgeDraw): void {
    let slot = this.litSlots.get(edge.id);
    if (!slot) {
      slot = {
        g: new Graphics(),
        glow: new Graphics(),
        born: this.animate ? now() : now() - DRAW_MS,
        signature: '',
        edge,
        drawing: this.animate,
      };
      this.lit.addChild(slot.g);
      this.glow.addChild(slot.glow);
      this.litSlots.set(edge.id, slot);
    }
    slot.edge = edge;
    const signature = litSignature(edge);
    if (signature === slot.signature && !slot.drawing) return;
    slot.signature = signature;
    this.drawLit(slot);
  }

  private drawLit(slot: LitSlot): void {
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

  private dropMissing(seen: Set<string>, walked: Set<string>): void {
    for (const [id, slot] of this.lineSlots) {
      if (seen.has(id)) continue;
      slot.g.destroy();
      this.lineSlots.delete(id);
    }
    for (const [id, slot] of this.litSlots) {
      if (walked.has(id)) continue;
      slot.g.destroy();
      slot.glow.destroy();
      this.litSlots.delete(id);
    }
  }
}
