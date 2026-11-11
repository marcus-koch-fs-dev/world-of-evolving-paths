import {
  type Lead,
  type PathInfo,
  type PathPoint,
  type Period,
  type PeriodData,
  tierAt,
  toDay,
} from 'world-of-evolving-paths';
import { connectionKey } from './connection';
import { type HeightAt, heightBetween } from './edgeHeight';
import { groupBy } from './groupBy';
import { createLeadFinder } from './leads';
import { LEVEL_SETTINGS, minImportanceOf } from './levels';
import { throughConnections } from './throughPaths';
import type { CheckIn, DemoPoint } from './types';

const MIN_IMPORTANCE_OF_ENDS = 3;

/** Start and goal count as at least 3 so they stay visible when zoomed out. */
export function importanceOf(point: Pick<PathPoint, 'kind' | 'importance'>): number {
  const base = point.importance ?? 1;
  return point.kind === 'start' || point.kind === 'goal' ? Math.max(MIN_IMPORTANCE_OF_ENDS, base) : base;
}

/** Splits path ids into pages. A whole path always stays on one page. */
export function pagesOf(pathIds: string[], pageSize: number): string[][] {
  const size = Math.max(1, Math.floor(pageSize));
  return Array.from({ length: Math.ceil(pathIds.length / size) }, (_, page) =>
    pathIds.slice(page * size, (page + 1) * size),
  );
}

/**
 * The points of a view: inside the period and important enough. A connection runs across hidden points
 * to the next visible one, and only points the view shows are linked. A point whose path continues outside the
 * period gets `incoming` and `outgoing`, so the map can show where the path comes from and where it goes.
 */
export function visiblePoints(all: DemoPoint[], period: Period | null, minImportance: number): DemoPoint[] {
  const byId = new Map(all.map((point) => [point.id, point]));
  const isInPeriod = (point: DemoPoint) => {
    const day = toDay(point.date);
    return period === null || (day >= period.start && day <= period.end);
  };
  const isShown = (point: DemoPoint) => isInPeriod(point) && importanceOf(point) >= minImportance;
  const shown = new Set(all.filter(isShown).map((point) => point.id));
  const leadsOf = createLeadFinder(all, shown, isInPeriod);

  const reach = (id: string, seen: Set<string>, found: Set<string>) => {
    (byId.get(id)?.next ?? []).forEach((nextId) => {
      if (seen.has(nextId)) return;
      seen.add(nextId);
      if (shown.has(nextId)) found.add(nextId);
      else reach(nextId, seen, found);
    });
  };

  return all
    .filter((point) => shown.has(point.id))
    .map((point) => {
      const found = new Set<string>();
      reach(point.id, new Set([point.id]), found);
      return { ...point, next: [...found], ...leadsOf(point) };
    });
}

/** The days of the check-ins of every path. */
function checkInDays(checkIns: CheckIn[]): Map<string, number[]> {
  return checkIns.reduce((groups, checkIn) => {
    const days = groups.get(checkIn.pathId);
    if (days) days.push(toDay(checkIn.date));
    else groups.set(checkIn.pathId, [toDay(checkIn.date)]);
    return groups;
  }, new Map<string, number[]>());
}

/**
 * Strength tier of every reached point, counted over all check-ins of its path, also those the view hides.
 * With `asOf` the point still being walked to counts on that day, so its line grows stronger while time plays.
 */
export function withStrength(visible: DemoPoint[], checkIns: CheckIn[], asOf?: string): DemoPoint[] {
  const daysByPath = checkInDays(checkIns);
  const countedDay = (point: DemoPoint) => (asOf && point.status === 'current' ? toDay(asOf) : toDay(point.date));
  return visible.map((point) =>
    point.status === 'done' || point.status === 'current'
      ? { ...point, strength: tierAt(daysByPath.get(point.pathId) ?? [], countedDay(point)) }
      : point,
  );
}

/**
 * The status of every point as of a day, for moving through time: earlier points are done, the first one still
 * ahead on its path is current, the rest is open. Abandoned points stay abandoned.
 */
export function withStatusAsOf(points: DemoPoint[], asOf: string): DemoPoint[] {
  const day = toDay(asOf);
  // One pass: per path the earliest point that is not abandoned and not before the day
  const nextByPath = points
    .filter((point) => point.status !== 'abandoned' && toDay(point.date) >= day)
    .reduce((earliest, point) => {
      const best = earliest.get(point.pathId);
      if (!best || toDay(point.date) < toDay(best.date)) earliest.set(point.pathId, point);
      return earliest;
    }, new Map<string, DemoPoint>());
  const currentIds = new Set([...nextByPath.values()].map((point) => point.id));
  return points.map((point) => {
    if (point.status === 'abandoned') return point;
    if (toDay(point.date) < day) return { ...point, status: 'done' as const };
    return { ...point, status: currentIds.has(point.id) ? ('current' as const) : ('open' as const) };
  });
}
export type ViewRequest = {
  paths: PathInfo[];
  points: DemoPoint[];
  checkIns: CheckIn[];
  /** Moves the statuses to this day. Without it the statuses are used as they are stored. */
  asOf?: string;
  /** The period to show, or null for the free view with everything. */
  period: Period | null;
  page: number;
  /** The height of each point, as a distance from the lane of its path. It holds in every view. */
  heights?: Record<string, number>;
  /** Where the paths enter and leave this period, per connection (`connectionKey`), dragged by the user. */
  edgeHeights?: Record<string, number>;
};

/**
 * The height where a connection crosses the edge of the period: the one the user dragged it to in this period, or the
 * one on the straight line between its two points.
 */
function createEdgeHeights(heights: Record<string, number>, edgeHeights: Record<string, number>) {
  const end = (id: string | undefined, date: string): HeightAt => ({
    day: toDay(date),
    height: id === undefined ? undefined : heights[id],
  });
  return (from: Lead, to: Lead, day: number): number | undefined => {
    const kept = from.id && to.id ? edgeHeights[connectionKey(from.id, to.id)] : undefined;
    return kept ?? heightBetween(end(from.id, from.date), end(to.id, to.date), day);
  };
}

/** A lead with a height, or as it is when there is none. */
const withHeight = (lead: Lead, y: number | undefined): Lead => (y === undefined ? lead : { ...lead, y });

export type ViewResult = { data: PeriodData; pages: number; page: number };

/** Everything the library needs for one view, plus how many pages there are. */
export function buildPeriodData({
  paths,
  points,
  checkIns,
  asOf,
  period,
  page,
  heights = {},
  edgeHeights = {},
}: ViewRequest): ViewResult {
  const edgeHeightOf = createEdgeHeights(heights, edgeHeights);
  const minImportance = minImportanceOf(period);
  const pageSize = period ? LEVEL_SETTINGS[period.level].graphsPerPage : Number.MAX_SAFE_INTEGER;
  const dated = asOf ? withStatusAsOf(points, asOf) : points;
  const shown = withStrength(visiblePoints(dated, period, minImportance), checkIns, asOf);
  const shownByPath = groupBy(shown, (point) => point.pathId);
  // A connection from a point before the period to one after it spans the view, also when its path has other
  // points in it: a fork has one for each branch
  const through = throughConnections(points, period, (point) => importanceOf(point) >= minImportance);
  const checkInDaysByPath = checkInDays(checkIns);
  const usedPaths = paths.filter((path) => shownByPath.has(path.id) || through.has(path.id));
  const pages = pagesOf(
    usedPaths.map((path) => path.id),
    pageSize,
  );
  const current = Math.min(Math.max(0, page), Math.max(0, pages.length - 1));
  const onPage = new Set(pages[current] ?? []);
  const ids = new Set(shown.filter((point) => onPage.has(point.pathId)).map((point) => point.id));
  const throughOf = (path: PathInfo) => {
    const found = through.get(path.id);
    if (!found) return {};
    // Like any connection: its strength is the one the path had when it reached the point at its end
    const days = checkInDaysByPath.get(path.id) ?? [];
    // A line across the period is level: its height in the middle of the period
    const middle = period ? Math.round((period.start + period.end) / 2) : 0;
    return {
      through: found.map((connection) => {
        const y = edgeHeightOf(connection.from, connection.to, middle);
        return {
          ...connection,
          strength: tierAt(days, toDay(connection.to.date)),
          ...(y === undefined ? {} : { y }),
        };
      }),
    };
  };
  // A line that leaves a point meets the edge on the first or the last day of the period
  const leadsOf = (point: Pick<DemoPoint, 'id' | 'date' | 'incoming' | 'outgoing'>) => {
    const self: Lead = { id: point.id, title: '', date: point.date };
    return {
      incoming: point.incoming?.map((lead) => withHeight(lead, edgeHeightOf(lead, self, period?.start ?? 0))),
      outgoing: point.outgoing?.map((lead) => withHeight(lead, edgeHeightOf(self, lead, period?.end ?? 0))),
    };
  };
  const nest = (path: PathInfo) => ({
    ...path,
    ...throughOf(path),
    points: (shownByPath.get(path.id) ?? []).map(({ pathId: _pathId, ...point }) => ({
      ...point,
      next: point.next.filter((id) => ids.has(id)),
      ...(point.incoming || point.outgoing ? leadsOf(point) : {}),
      // A height the user chose holds in every view, and the place on the time axis follows the date
      ...(heights[point.id] === undefined ? {} : { y: heights[point.id] }),
    })),
  });
  return {
    data: { paths: usedPaths.filter((path) => onPage.has(path.id)).map(nest) },
    pages: Math.max(1, pages.length),
    page: current,
  };
}
