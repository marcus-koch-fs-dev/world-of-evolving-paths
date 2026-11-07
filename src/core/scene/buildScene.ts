import type { PlacedWorld } from '../types.js';
import { buildEdges } from './edges.js';
import { buildHeres } from './heres.js';
import { buildNodes } from './nodes.js';
import { buildRings } from './rings.js';
import type { Scene, SceneState } from './types.js';

/** Everything the renderer draws, as plain data without any drawing library. */
export function buildScene(world: PlacedWorld, state: SceneState): Scene {
  const edges = buildEdges(world, state);
  return {
    edges,
    nodes: buildNodes(world, state),
    heres: buildHeres(world, edges),
    rings: buildRings(world, state.dragging),
  };
}
