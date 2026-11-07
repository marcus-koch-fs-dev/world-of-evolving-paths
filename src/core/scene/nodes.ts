import { formatMonthYear } from '../dates';
import { shapeOf } from '../shapes';
import { symbolSize } from '../symbol';
import type { PlacedPoint, PlacedWorld } from '../types';
import { pathColorOf } from './paths';
import type { Dash, NodeDraw, SceneState } from './types';

const SHAPE_RADIUS = 26;
const DONE_FILL = '#23270f';
const OPEN_FILL = '#1b1d17';
const OPEN_DASH: Dash = [4, 3];
const ABANDONED_DASH: Dash = [1.5, 3];
const ABANDONED_SHAPE_ALPHA = 0.5;
const ABANDONED_ALPHA = 0.4;
const DRAG_SCALE = 1.15;
const HOVER_SCALE = 1.12;

function nodeOf(world: PlacedWorld, point: PlacedPoint, state: SceneState): NodeDraw {
  const abandoned = point.status === 'abandoned';
  return {
    id: point.id,
    x: point.x,
    y: point.y,
    shape: shapeOf(point),
    size: symbolSize(point),
    radius: SHAPE_RADIUS,
    stroke: pathColorOf(world, point),
    fill: point.status === 'done' ? DONE_FILL : OPEN_FILL,
    dash: point.status === 'open' ? OPEN_DASH : abandoned ? ABANDONED_DASH : null,
    shapeAlpha: abandoned ? ABANDONED_SHAPE_ALPHA : 1,
    alpha: abandoned ? ABANDONED_ALPHA : 1,
    scale: state.dragging === point.id ? DRAG_SCALE : state.hovered === point.id ? HOVER_SCALE : 1,
    pulse: point.status === 'current',
    arrow: point.status === 'current',
    glyph: point.kind === 'goal' && point.status === 'done' ? '✓' : null,
    title: point.title,
    date: formatMonthYear(point.date),
  };
}

/** The symbols of the world: shape, colors and animation flags per point. */
export function buildNodes(world: PlacedWorld, state: SceneState): NodeDraw[] {
  return world.points.map((point) => nodeOf(world, point, state));
}
