import type { Position } from '../types';
import type { NodeDraw } from './types';

/** The node under a world position. Later drawn nodes lie on top and are hit first. */
export function hitNode(nodes: NodeDraw[], at: Position): NodeDraw | null {
  return nodes.findLast((node) => Math.hypot(at.x - node.x, at.y - node.y) <= node.size / 2) ?? null;
}
