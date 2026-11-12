import type { Turn } from '../orientation.js';
import { leadAnchor } from './arrows.js';
import type { Scene } from './types.js';

/**
 * The scene with every position turned, so time runs the way the screen needs. The layout and the lines are made
 * as usual, with time along x, and only the finished coordinates are turned.
 */
export function turnScene(scene: Scene, turn: Turn): Scene {
  // Where time points to on the screen, so a label grows away from its point in that direction
  const origin = turn({ x: 0, y: 0 });
  // A direction is turned like a position, minus the turned origin
  const turnDirection = (vector: { x: number; y: number }) => {
    const turned = turn(vector);
    return { x: turned.x - origin.x, y: turned.y - origin.y };
  };
  const direction = turnDirection({ x: 1, y: 0 });
  return {
    edges: scene.edges.map((edge) => ({
      ...edge,
      points: edge.points.map(turn),
      lit: edge.lit ? { ...edge.lit, points: edge.lit.points.map(turn) } : null,
    })),
    nodes: scene.nodes.map(turn),
    heres: scene.heres.map(turn),
    leads: scene.leads.map((lead) => ({
      ...turn(lead),
      line: lead.line.map(turn),
      end: turn(lead.end),
      outward: turnDirection(lead.outward),
      anchor: leadAnchor(lead.side, direction),
    })),
  };
}
