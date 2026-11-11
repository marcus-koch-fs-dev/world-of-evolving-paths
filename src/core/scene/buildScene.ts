import type { PlacedWorld } from '../types.js';
import { buildEdges } from './edges.js';
import { buildHeres } from './heres.js';
import { buildLeads } from './leads.js';
import { buildNodes } from './nodes.js';
import { buildRings } from './rings.js';
import { buildThrough } from './through.js';
import { lineTracks } from './tracks.js';
import type { Scene, SceneState } from './types.js';

/** Everything the renderer draws, as plain data without any drawing library. */
export function buildScene(world: PlacedWorld, state: SceneState): Scene {
  const edges = buildEdges(world, state);
  // The lines that run along the time axis keep their distance from each other
  const tracks = lineTracks(world, state.lineOverrides);
  const leads = buildLeads(world, state, tracks);
  const through = buildThrough(world, state, tracks);
  return {
    edges: [...edges, ...leads.edges, ...through.edges],
    nodes: buildNodes(world, state),
    // The marker for today also follows the lines that leave the view, come in from outside it or run through it
    heres: buildHeres(world, edges, leads.labels, tracks),
    rings: buildRings(world, state.dragging),
    leads: [...leads.labels, ...through.labels],
  };
}
