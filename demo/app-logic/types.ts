import type { PathPoint } from 'world-of-evolving-paths';

/** The demo app stores its points flat, each with the id of its path, and nests them when it builds a view. */
export type DemoPoint = PathPoint & { pathId: string };
