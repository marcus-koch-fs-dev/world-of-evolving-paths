import type { PlacedWorld } from '../types';
import { buildEdges } from './edges';
import { buildHeres } from './heres';
import { buildNodes } from './nodes';
import { buildRings } from './rings';
import type { Scene, SceneState } from './types';

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
