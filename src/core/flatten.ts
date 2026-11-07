import type { FlatPoint, PathInfo, PeriodData } from './types.js';

/** Splits the nested period data into path styles and one flat list of points that remember their path. */
export function flattenPeriod(data: PeriodData): { paths: PathInfo[]; points: FlatPoint[] } {
  const paths = data.paths.map(({ points: _points, ...info }) => info);
  const points = data.paths.flatMap((path) => path.points.map((point) => ({ ...point, pathId: path.id })));
  return { paths, points };
}
