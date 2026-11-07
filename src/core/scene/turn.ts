import type { Turn } from '../orientation.js';
import type { Scene } from './types.js';

/**
 * The scene with every position turned, so time runs the way the screen needs. The layout and the lines are made
 * as usual, with time along x, and only the finished coordinates are turned.
 */
export function turnScene(scene: Scene, turn: Turn): Scene {
  return {
    edges: scene.edges.map((edge) => ({
      ...edge,
      points: edge.points.map(turn),
      lit: edge.lit ? { ...edge.lit, points: edge.lit.points.map(turn) } : null,
    })),
    nodes: scene.nodes.map(turn),
    heres: scene.heres.map(turn),
    rings: scene.rings.map(turn),
  };
}
