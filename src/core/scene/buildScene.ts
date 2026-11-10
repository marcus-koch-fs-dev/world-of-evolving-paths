import type { PlacedWorld } from '../types.js';
import { buildEdges } from './edges.js';
import { buildHeres } from './heres.js';
import { buildLeads } from './leads.js';
import { buildNodes } from './nodes.js';
import { buildRings } from './rings.js';
import type { Scene, SceneState } from './types.js';

/** Everything the renderer draws, as plain data without any drawing library. */
export function buildScene(world: PlacedWorld, state: SceneState): Scene {
  const edges = buildEdges(world, state);
  const leads = buildLeads(world, state);
  return {
    // The marker for today follows the real connections, not the lines that leave the view
    edges: [...edges, ...leads.edges],
    nodes: buildNodes(world, state),
    heres: buildHeres(world, edges),
    rings: buildRings(world, state.dragging),
    leads: leads.labels,
  };
}
