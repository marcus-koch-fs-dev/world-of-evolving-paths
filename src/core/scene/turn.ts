import type { Turn } from '../orientation.js';
import { leadAnchor } from './leads.js';
import type { Scene } from './types.js';

/**
 * The scene with every position turned, so time runs the way the screen needs. The layout and the lines are made
 * as usual, with time along x, and only the finished coordinates are turned.
 */
export function turnScene(scene: Scene, turn: Turn): Scene {
  // Where time points to on the screen, so a label grows away from its point in that direction
  const origin = turn({ x: 0, y: 0 });
  const along = turn({ x: 1, y: 0 });
  const direction = { x: along.x - origin.x, y: along.y - origin.y };
  return {
    edges: scene.edges.map((edge) => ({
      ...edge,
      points: edge.points.map(turn),
      lit: edge.lit ? { ...edge.lit, points: edge.lit.points.map(turn) } : null,
    })),
    nodes: scene.nodes.map(turn),
    heres: scene.heres.map(turn),
    rings: scene.rings.map(turn),
    leads: scene.leads.map((lead) => ({ ...turn(lead), anchor: leadAnchor(lead.side, direction) })),
  };
}
