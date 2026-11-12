import type { PlacedWorld } from '../types.js';
import { buildArrows } from './arrows.js';
import { buildEdges } from './edges.js';
import { buildHeres } from './heres.js';
import { buildNodes } from './nodes.js';
import type { Scene, SceneState } from './types.js';

/** Everything the renderer draws, as plain data without any drawing library. */
export function buildScene(world: PlacedWorld, state: SceneState): Scene {
  const edges = buildEdges(world, state);
  const arrows = buildArrows(world, state);
  return {
    edges: [...edges, ...arrows.edges],
    nodes: buildNodes(world, state),
    // The marker for today also follows the lines that leave the view, come in from outside it or run through it
    heres: buildHeres(world, edges, arrows.labels, state.lineOverrides),
    leads: arrows.labels,
  };
}
