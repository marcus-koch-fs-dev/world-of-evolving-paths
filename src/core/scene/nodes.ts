import { formatPointDate } from '../format.js';
import { shapeOf } from '../shapes.js';
import { symbolSize } from '../symbol.js';
import type { PlacedPoint, PlacedWorld } from '../types.js';
import { pathColorOf } from './paths.js';
import type { Dash, NodeDraw, SceneState } from './types.js';

const SHAPE_RADIUS = 26;
const DONE_FILL = '#23270f';
const OPEN_FILL = '#1b1d17';
const OPEN_DASH: Dash = [4, 3];
const ABANDONED_DASH: Dash = [1.5, 3];
const ABANDONED_SHAPE_ALPHA = 0.5;
const ABANDONED_ALPHA = 0.4;
// Outline thickness by the strength tier of the path that arrives at a point. Points not reached yet use the first.
const OUTLINE_BY_TIER = [2.5, 3.5, 4.5, 6, 8];
const DRAG_SCALE = 1.15;
const HOVER_SCALE = 1.12;

function nodeOf(world: PlacedWorld, point: PlacedPoint, state: SceneState): NodeDraw {
  const abandoned = point.status === 'abandoned';
  const reached = point.status === 'done' || point.status === 'current';
  return {
    id: point.id,
    x: point.x,
    y: point.y,
    shape: shapeOf(point),
    size: symbolSize(point),
    radius: SHAPE_RADIUS,
    stroke: pathColorOf(world, point),
    outlineWidth: reached
      ? OUTLINE_BY_TIER[Math.min(OUTLINE_BY_TIER.length - 1, Math.max(0, point.strength ?? 0))]
      : OUTLINE_BY_TIER[0],
    fill: point.status === 'done' ? DONE_FILL : OPEN_FILL,
    dash: point.status === 'open' ? OPEN_DASH : abandoned ? ABANDONED_DASH : null,
    shapeAlpha: abandoned ? ABANDONED_SHAPE_ALPHA : 1,
    alpha: abandoned ? ABANDONED_ALPHA : 1,
    scale: state.dragging === point.id ? DRAG_SCALE : state.hovered === point.id ? HOVER_SCALE : 1,
    pulse: point.status === 'current',
    arrow: point.status === 'current',
    glyph: point.kind === 'goal' && point.status === 'done' ? '✓' : null,
    title: point.title,
    date: state.formatDate ? state.formatDate(point.date) : formatPointDate(point.date, world.today, state.locale),
  };
}

/** The symbols of the world: shape, colors and animation flags per point. */
export function buildNodes(world: PlacedWorld, state: SceneState): NodeDraw[] {
  return world.points.map((point) => nodeOf(world, point, state));
}
