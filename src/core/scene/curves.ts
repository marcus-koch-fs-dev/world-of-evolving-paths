import { edgeCurve } from '../geometry.js';
import { pick } from '../random.js';
import type { Position } from '../types.js';
import type { Dash } from './types.js';

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
  return points.reduce(
    (sum, point, i) => (i === 0 ? 0 : sum + Math.hypot(point.x - points[i - 1].x, point.y - points[i - 1].y)),
    0,
  );
}

/** The start of a polyline up to the fraction `f` of its length. */
export function cutAt(points: Position[], f: number): Position[] {
  if (f >= 1) return points;
  const lengths = points.slice(1).map((b, i) => Math.hypot(b.x - points[i].x, b.y - points[i].y));
  const ends: number[] = [];
  lengths.forEach((length) => {
    ends.push((ends.at(-1) ?? 0) + length);
  });
  const target = (ends.at(-1) ?? 0) * Math.max(0, f);
  // The first piece that reaches the target holds the cut
  const index = ends.findIndex((end) => end >= target);
  if (index < 0) return points;
  const [a, b] = [points[index], points[index + 1]];
  const t = lengths[index] === 0 ? 0 : (target - (ends[index] - lengths[index])) / lengths[index];
  return [...points.slice(0, index + 1), { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }];
}

/** The point at the fraction `f` of the length of a polyline. */
export function pointAt(points: Position[], f: number): Position {
  const part = cutAt(points, f);
  return part.at(-1) as Position;
}

type Piece = { from: Position; to: Position; start: number; end: number };

/** The straight pieces of a polyline, each with the distance along the line where it starts and ends. */
function piecesOf(points: Position[]): Piece[] {
  const lengths = points.slice(1).map((b, i) => Math.hypot(b.x - points[i].x, b.y - points[i].y));
  const ends: number[] = [];
  lengths.forEach((length) => {
    ends.push((ends.at(-1) ?? 0) + length);
  });
  return lengths.map((length, i) => ({ from: points[i], to: points[i + 1], start: ends[i] - length, end: ends[i] }));
}

const along = (piece: Piece, distance: number): Position => {
  const t = (distance - piece.start) / (piece.end - piece.start);
  return { x: piece.from.x + (piece.to.x - piece.from.x) * t, y: piece.from.y + (piece.to.y - piece.from.y) * t };
};

/**
 * The drawn pieces of a dashed polyline. `shift` moves the pattern forward along the line.
 * The pattern repeats every `on + off` along the line, so each piece only looks at the dashes that reach it.
 */
export function dashSegments(points: Position[], dash: Dash, shift = 0): [Position, Position][] {
  const [on, off] = dash;
  const period = on + off;
  if (period <= 0 || on <= 0) return [];
  const phase = (((period - shift) % period) + period) % period;
  // Dash k covers the distances from k * period - phase to k * period - phase + on
  return piecesOf(points).flatMap((piece) => {
    const first = Math.max(0, Math.ceil((piece.start + phase - on) / period));
    const last = Math.floor((piece.end + phase) / period);
    return Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => first + i).flatMap((k) => {
      const from = Math.max(k * period - phase, piece.start);
      const to = Math.min(k * period - phase + on, piece.end);
      return to - from > EPSILON ? [[along(piece, from), along(piece, to)] as [Position, Position]] : [];
    });
  });
}
