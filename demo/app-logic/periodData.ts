import {
  type PathInfo,
  type PathPoint,
  type Period,
  type PeriodData,
  type Position,
  tierAt,
  toDay,
} from 'world-of-evolving-paths';
import { groupBy } from './groupBy';
import { LEVEL_SETTINGS, minImportanceOf } from './levels';
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
 * to the next visible one, and only points the view shows are linked.
 */
export function visiblePoints(all: DemoPoint[], period: Period | null, minImportance: number): DemoPoint[] {
  const byId = new Map(all.map((point) => [point.id, point]));
  const isShown = (point: DemoPoint) => {
    const day = toDay(point.date);
    const inPeriod = period === null || (day >= period.start && day <= period.end);
    return inPeriod && importanceOf(point) >= minImportance;
  };
  const shown = new Set(all.filter(isShown).map((point) => point.id));

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
      return { ...point, next: [...found] };
    });
}

/**
 * Strength tier of every reached point, counted over all check-ins of its path, also those the view hides.
 * With `asOf` the point still being walked to counts on that day, so its line grows stronger while time plays.
 */
export function withStrength(visible: DemoPoint[], checkIns: CheckIn[], asOf?: string): DemoPoint[] {
  const daysByPath = checkIns.reduce((groups, checkIn) => {
    const days = groups.get(checkIn.pathId);
    if (days) days.push(toDay(checkIn.date));
    else groups.set(checkIn.pathId, [toDay(checkIn.date)]);
    return groups;
  }, new Map<string, number[]>());
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
  /** Positions the user has pinned in this view. */
  pins: Record<string, Position>;
};

export type ViewResult = { data: PeriodData; pages: number; page: number };

/** Everything the library needs for one view, plus how many pages there are. */
export function buildPeriodData({ paths, points, checkIns, asOf, period, page, pins }: ViewRequest): ViewResult {
  const minImportance = minImportanceOf(period);
  const pageSize = period ? LEVEL_SETTINGS[period.level].graphsPerPage : Number.MAX_SAFE_INTEGER;
  const dated = asOf ? withStatusAsOf(points, asOf) : points;
  const shown = withStrength(visiblePoints(dated, period, minImportance), checkIns, asOf);
  const shownByPath = groupBy(shown, (point) => point.pathId);
  const usedPaths = paths.filter((path) => shownByPath.has(path.id));
  const pages = pagesOf(
    usedPaths.map((path) => path.id),
    pageSize,
  );
  const current = Math.min(Math.max(0, page), Math.max(0, pages.length - 1));
  const onPage = new Set(pages[current] ?? []);
  const ids = new Set(shown.filter((point) => onPage.has(point.pathId)).map((point) => point.id));
  const nest = (path: PathInfo) => ({
    ...path,
    points: (shownByPath.get(path.id) ?? []).map(({ pathId: _pathId, ...point }) => ({
      ...point,
      next: point.next.filter((id) => ids.has(id)),
      ...pins[point.id],
    })),
  });
  return {
    data: { paths: usedPaths.filter((path) => onPage.has(path.id)).map(nest) },
    pages: Math.max(1, pages.length),
    page: current,
  };
}
