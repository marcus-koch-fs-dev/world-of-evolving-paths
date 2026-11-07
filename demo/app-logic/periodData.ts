import {
  type PathInfo,
  type PathPoint,
  type Period,
  type PeriodData,
  type Position,
  tierAt,
  toDay,
} from 'world-of-evolving-paths';
import { FREE_VIEW_MIN_IMPORTANCE, LEVEL_SETTINGS } from './levels';
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
  const pages: string[][] = [];
  pathIds.forEach((id, index) => {
    const page = Math.floor(index / size);
    pages[page] = [...(pages[page] ?? []), id];
  });
  return pages;
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
    for (const nextId of byId.get(id)?.next ?? []) {
      if (seen.has(nextId)) continue;
      seen.add(nextId);
      if (shown.has(nextId)) found.add(nextId);
      else reach(nextId, seen, found);
    }
  };

  return all
    .filter((point) => shown.has(point.id))
    .map((point) => {
      const found = new Set<string>();
      reach(point.id, new Set([point.id]), found);
      return { ...point, next: [...found] };
    });
}

/** Strength tier of every reached point, counted over all check-ins of its path, also those the view hides. */
export function withStrength(visible: DemoPoint[], checkIns: CheckIn[]): DemoPoint[] {
  const daysByPath = new Map<string, number[]>();
  for (const checkIn of checkIns) {
    daysByPath.set(checkIn.pathId, [...(daysByPath.get(checkIn.pathId) ?? []), toDay(checkIn.date)]);
  }
  return visible.map((point) =>
    point.status === 'done' || point.status === 'current'
      ? { ...point, strength: tierAt(daysByPath.get(point.pathId) ?? [], toDay(point.date)) }
      : point,
  );
}

/**
 * The status of every point as of a day, for moving through time: earlier points are done, the first one still
 * ahead on its path is current, the rest is open. Abandoned points stay abandoned.
 */
export function withStatusAsOf(points: DemoPoint[], asOf: string): DemoPoint[] {
  const day = toDay(asOf);
  const currentIds = new Set<string>();
  for (const path of new Set(points.map((point) => point.pathId))) {
    const ahead = points
      .filter((point) => point.pathId === path && point.status !== 'abandoned' && toDay(point.date) >= day)
      .sort((a, b) => toDay(a.date) - toDay(b.date));
    if (ahead[0]) currentIds.add(ahead[0].id);
  }
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
  const minImportance = period ? LEVEL_SETTINGS[period.level].minImportance : FREE_VIEW_MIN_IMPORTANCE;
  const pageSize = period ? LEVEL_SETTINGS[period.level].graphsPerPage : Number.MAX_SAFE_INTEGER;
  const dated = asOf ? withStatusAsOf(points, asOf) : points;
  const shown = withStrength(visiblePoints(dated, period, minImportance), checkIns);
  const usedPaths = paths.filter((path) => shown.some((point) => point.pathId === path.id));
  const pages = pagesOf(
    usedPaths.map((path) => path.id),
    pageSize,
  );
  const current = Math.min(Math.max(0, page), Math.max(0, pages.length - 1));
  const onPage = new Set(pages[current] ?? []);
  const onPagePoints = shown.filter((point) => onPage.has(point.pathId));
  const ids = new Set(onPagePoints.map((point) => point.id));
  const nest = (path: PathInfo) => ({
    ...path,
    points: onPagePoints
      .filter((point) => point.pathId === path.id)
      .map(({ pathId: _pathId, ...point }) => ({
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
