import type { PathPoint } from 'world-of-evolving-paths';

/** The demo app stores its points flat, each with the id of its path, and nests them when it builds a view. */
export type DemoPoint = PathPoint & { pathId: string };

/** One day on which a path was walked. It makes the path stronger, but it is not a point on the map. */
export type CheckIn = { pathId: string; date: string };
