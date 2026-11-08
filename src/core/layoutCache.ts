import { flattenPeriod } from './flatten.js';
import type { PeriodLayout } from './layout.js';
import type { PeriodData } from './types.js';

/**
 * Everything the layout depends on, as text: the paths and lanes, and for each point its id, date, kind, links,
 * importance and pin. Two data objects with the same signature get the same layout, whatever else differs
 * (titles, statuses, strengths).
 */
export function layoutSignature(data: PeriodData): string {
  return JSON.stringify(
    data.paths.map((path) => [
      path.id,
      path.lane ?? null,
      path.points.map((point) => [
        point.id,
        point.date,
        point.kind,
        point.next,
        point.importance ?? null,
        point.x ?? null,
        point.y ?? null,
      ]),
    ]),
  );
}

/** The layout of earlier data for new data with the same signature: new details on the points, same positions. */
export function reuseLayout(data: PeriodData, previous: PeriodLayout): PeriodLayout {
  return { ...flattenPeriod(data), positions: previous.positions };
}
