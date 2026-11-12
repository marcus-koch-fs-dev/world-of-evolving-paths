import type { PathInfo } from './types.js';

const LANE_GAP = 200; // distance between two lanes

/** The y position of every path's lane. Only the order counts, not the distance: empty lanes cost no room. */
export function laneOffsets(paths: readonly Pick<PathInfo, 'id' | 'lane'>[]): Map<string, number> {
  const lanes = [...paths].sort((a, b) => (a.lane ?? 0) - (b.lane ?? 0));
  return new Map(lanes.map((path, i) => [path.id, (i - (lanes.length - 1) / 2) * LANE_GAP]));
}

/** The y of the lane of every path of a world, by path id. Heights in the data are distances from it. */
export function lanesOf(world: { paths: readonly Pick<PathInfo, 'id' | 'lane'>[] }): Record<string, number> {
  return Object.fromEntries(laneOffsets(world.paths));
}
