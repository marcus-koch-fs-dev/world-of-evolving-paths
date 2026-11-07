import { distanceToSegment } from '../geometry';
import type { Position } from '../types';
import type { EdgeDraw, NodeDraw } from './types';

const EDGE_REACH = 8; // half the grab width of a line

/** The node under a world position. Later drawn nodes lie on top and are hit first. */
export function hitNode(nodes: NodeDraw[], at: Position): NodeDraw | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (Math.hypot(at.x - node.x, at.y - node.y) <= node.size / 2) return node;
  }
  return null;
}

/** The line closest to a world position, if it is within reach. */
export function hitEdge(edges: EdgeDraw[], at: Position): EdgeDraw | null {
  let best: EdgeDraw | null = null;
  let bestDistance = EDGE_REACH;
  for (const edge of edges) {
    for (let i = 0; i < edge.points.length - 1; i++) {
      const distance = distanceToSegment(at, edge.points[i], edge.points[i + 1]);
      if (distance <= bestDistance) {
        best = edge;
        bestDistance = distance;
      }
    }
  }
  return best;
}
