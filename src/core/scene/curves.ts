import { edgeCurve } from '../geometry';
import { pick } from '../random';
import type { Position } from '../types';
import type { Dash } from './types';

const CURVE_STEPS = 40;
const WAVE_MAX = 12; // largest sideways swing of the wave in world units
const WAVE_CHORD_RATIO = 0.04;
const WAVE_BEND_DAMPING = 0.6;
const EPSILON = 1e-9;

function cubicAt(c: [Position, Position, Position, Position], t: number): Position {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return { x: a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x, y: a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y };
}

/**
 * The curve between two points as a polyline. With a `seed` it gets a slight wave across its direction:
 * never perfectly straight, the ends stay exactly on the points. The more it already bends and the shorter
 * it is, the smaller the wave. The same seed always gives the same shape.
 */
export function sampleEdge(from: Position, to: Position, seed?: string): Position[] {
  const base = Array.from({ length: CURVE_STEPS + 1 }, (_, i) => cubicAt(edgeCurve(from, to), i / CURVE_STEPS));
  if (seed === undefined) return base;
  const chord = Math.hypot(to.x - from.x, to.y - from.y);
  const bend = Math.min(1, Math.abs(to.y - from.y) / (Math.abs(to.x - from.x) + 1));
  const amplitude = Math.min(WAVE_MAX, chord * WAVE_CHORD_RATIO) * (1 - WAVE_BEND_DAMPING * bend);
  const phase = pick(`${seed}|p`) * Math.PI * 2;
  const cycles = 1.2 + pick(`${seed}|f`);
  const sign = pick(`${seed}|s`) < 0.5 ? -1 : 1;
  return base.map((p, i) => {
    if (i === 0 || i === CURVE_STEPS) return p;
    const t = i / CURVE_STEPS;
    const a = base[Math.max(0, i - 1)];
    const b = base[Math.min(CURVE_STEPS, i + 1)];
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const offset = sign * amplitude * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * cycles * t + phase);
    return { x: p.x - ((b.y - a.y) / length) * offset, y: p.y + ((b.x - a.x) / length) * offset };
  });
}

/** Total length of a polyline. */
export function polylineLength(points: Position[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++)
    sum += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return sum;
}

/** The start of a polyline up to the fraction `f` of its length. */
export function cutAt(points: Position[], f: number): Position[] {
  if (f >= 1) return points;
  let left = polylineLength(points) * Math.max(0, f);
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segment = Math.hypot(b.x - a.x, b.y - a.y);
    if (segment >= left) {
      const t = segment === 0 ? 0 : left / segment;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      return out;
    }
    out.push(b);
    left -= segment;
  }
  return out;
}

/** The point at the fraction `f` of the length of a polyline. */
export function pointAt(points: Position[], f: number): Position {
  const part = cutAt(points, f);
  return part[part.length - 1];
}

/** The drawn pieces of a dashed polyline. `shift` moves the pattern forward along the line. */
export function dashSegments(points: Position[], dash: Dash, shift = 0): [Position, Position][] {
  const [on, off] = dash;
  const out: [Position, Position][] = [];
  const period = on + off;
  const position = (((period - shift) % period) + period) % period;
  let drawing = position < on;
  let left = drawing ? on - position : period - position;
  for (let i = 0; i < points.length - 1; i++) {
    let a = points[i];
    const b = points[i + 1];
    let segment = Math.hypot(b.x - a.x, b.y - a.y);
    while (segment > EPSILON) {
      const step = Math.min(left, segment);
      const t = step / segment;
      const next = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (drawing) out.push([a, next]);
      a = next;
      segment -= step;
      left -= step;
      if (left <= EPSILON) {
        drawing = !drawing;
        left = drawing ? on : off;
      }
    }
  }
  return out;
}
