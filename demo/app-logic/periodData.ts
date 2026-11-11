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
  /** Heights the user has pinned in this view. The place along the time axis follows the date. */
  pins: Record<string, { y: number }>;
  /** Heights the user dragged points to in any view. A pin of this view wins over them. */
  heights?: Record<string, number>;
  /** Heights the user dragged the ends of lines to, per connection (`connectionKey`). */
  lineHeights?: Record<string, number>;
};

/** The leads with the height the user gave their lines, found by the connection each belongs to. */
function withLineHeights(
  leads: Lead[] | undefined,
  lineHeights: Record<string, number>,
  keyOf: (lead: Lead) => string | null,
): Lead[] | undefined {
  return leads?.map((lead) => {
    const key = keyOf(lead);
    const y = key === null ? undefined : lineHeights[key];
    return y === undefined ? lead : { ...lead, y };
  });
}

export type ViewResult = { data: PeriodData; pages: number; page: number };

/** Everything the library needs for one view, plus how many pages there are. */
export function buildPeriodData({
  paths,
  points,
  checkIns,
  asOf,
  period,
  page,
  pins,
  heights = {},
  lineHeights = {},
}: ViewRequest): ViewResult {
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
    return {
      through: found.map((connection) => ({
        ...connection,
        strength: tierAt(days, toDay(connection.to.date)),
        y: lineHeights[connectionKey(connection.from.id ?? '', connection.to.id ?? '')],
      })),
    };
  };
  const leadsOf = (point: Pick<DemoPoint, 'id' | 'incoming' | 'outgoing'>) => ({
    incoming: withLineHeights(point.incoming, lineHeights, (lead) =>
      lead.id ? connectionKey(lead.id, point.id) : null,
    ),
    outgoing: withLineHeights(point.outgoing, lineHeights, (lead) =>
      lead.id ? connectionKey(point.id, lead.id) : null,
    ),
  });
  const nest = (path: PathInfo) => ({
    ...path,
    ...throughOf(path),
    points: (shownByPath.get(path.id) ?? []).map(({ pathId: _pathId, ...point }) => ({
      ...point,
      next: point.next.filter((id) => ids.has(id)),
      ...(point.incoming || point.outgoing ? leadsOf(point) : {}),
      // A height the user chose holds in every view; a pin of this view also fixes the place on the time axis
      ...(heights[point.id] === undefined ? {} : { y: heights[point.id] }),
      ...pins[point.id],
    })),
  });
  return {
    data: { paths: usedPaths.filter((path) => onPage.has(path.id)).map(nest) },
    pages: Math.max(1, pages.length),
    page: current,
  };
}
