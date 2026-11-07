import { edgeProgress, getEdges } from '../geometry.js';
import { TIERS } from '../strength.js';
import type { PlacedWorld } from '../types.js';
import { cutAt, sampleEdge } from './curves.js';
import { pathColorOf } from './paths.js';
import type { EdgeDraw, SceneState } from './types.js';

const INK = '#edefe6';
const HIGHLIGHT = '#ffffff';
const OPEN_WIDTH = 3;
const DONE_WIDTH = 4;
const OTHER_WIDTH = 2;
const HIGHLIGHT_MIN_WIDTH = 4;
const OPEN_DASH: [number, number] = [2, 10];
const ABANDONED_DASH: [number, number] = [6, 8];
const OPEN_ALPHA = 0.45;
const ABANDONED_ALPHA = 0.3;
const ABANDONED_FADE = 0.6;
const DEFAULT_GLOW = 0.3;

/**
 * The lines of the world. A reached connection takes the look of its strength tier:
 * the more often a path is walked, the wider and brighter it is. Open lines stay thin and dotted.
 */
export function buildEdges(world: PlacedWorld, state: SceneState): EdgeDraw[] {
  return getEdges(world.points).map((edge) => {
    const { from, to } = edge;
    const color = pathColorOf(world, to);
    const points = sampleEdge(from, to, state.wave ? edge.id : undefined);
    const progress = edgeProgress(from, to, world.today);
    const highlighted = state.hovered !== null && (state.hovered === from.id || state.hovered === to.id);
    const reached = to.status === 'done' || to.status === 'current';
    const open = to.status === 'open' || to.status === 'current';
    const abandoned = to.status === 'abandoned';
    const tier =
      reached && to.strength !== undefined ? TIERS[Math.min(TIERS.length - 1, Math.max(0, to.strength))] : undefined;
    const baseWidth = open ? OPEN_WIDTH : to.status === 'done' ? (tier?.width ?? DONE_WIDTH) : OTHER_WIDTH;
    const baseAlpha = highlighted ? 1 : abandoned ? ABANDONED_ALPHA : open ? OPEN_ALPHA : 1;
    const lit = !abandoned && progress > 0;
    return {
      id: edge.id,
      from: from.id,
      to: to.id,
      points,
      color: highlighted ? HIGHLIGHT : to.status === 'done' ? color : INK,
      width: highlighted ? Math.max(HIGHLIGHT_MIN_WIDTH, baseWidth) : baseWidth,
      alpha: baseAlpha * (abandoned && !highlighted ? ABANDONED_FADE : 1),
      dash: open ? OPEN_DASH : abandoned ? ABANDONED_DASH : null,
      flow: open,
      lit: lit ? { points: cutAt(points, progress), color, width: tier?.width ?? DONE_WIDTH } : null,
      glow: lit ? (tier?.glow ?? DEFAULT_GLOW) : 0,
    };
  });
}
