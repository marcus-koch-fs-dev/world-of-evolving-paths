import { periodFromKey } from '../calendar.js';
import { laneOffsets } from '../lanes.js';
import { buildLevel, type LevelPath } from '../store/buildLevel.js';
import { type CacheView, pathSpan, type StoreCache } from '../store/cache.js';
import { createFreeReader } from '../store/free.js';
import type { Store } from '../store/types.js';
import { type Span, tileWidth, xOfBorder, xOfDate } from '../timeAxis.js';
import type { PathInfo, PlacedArrow, PlacedPoint, PlacedSpan, PlacedWorld } from '../types.js';
import { type BranchParts, branchParts } from './branchParts.js';

const NO_TIME: Span = { start: 0, end: 0 };

/** The first and the last day of every point, or one day when there are none. */
function allTime(store: Store, cached?: CacheView): Span {
  const spans = store.paths.flatMap((path) => {
    const span = cached ? cached.spanOf(path) : pathSpan(path);
    return span ? [span] : [];
  });
  if (spans.length === 0) return NO_TIME;
  return {
    start: spans.reduce((lowest, span) => Math.min(lowest, span.first), Number.POSITIVE_INFINITY),
    end: spans.reduce((highest, span) => Math.max(highest, span.last), Number.NEGATIVE_INFINITY),
  };
}

/** The paths of a view that have something in it, with their branches. The overview shows every path. */
function levelPathsOf(store: Store, view: string, cached?: CacheView, pathIds?: readonly string[]): LevelPath[] {
  const period = periodFromKey(view);
  return buildLevel(store, period?.level ?? 'week', period ?? allTime(store, cached), { view: cached, pathIds });
}

/**
 * The ids of the paths that have something in a view, in the order of the store. The app may page through them.
 * With a cache (see `createStoreCache`) paths that did not change are not worked out again.
 */
export const pathsInView = (store: Store, view: string, cache?: StoreCache): string[] =>
  levelPathsOf(store, view, cache?.view(store.paths)).map((path) => path.id);

const infoOf = ({ id, name, color, lane }: LevelPath): PathInfo => ({ id, name, color, lane });

/** The `next` lists with the connections that come from other branches: the point a fork leaves from. */
function joined(points: PlacedPoint[], parts: BranchParts[]): PlacedPoint[] {
  const present = new Set(points.map((point) => point.id));
  const links = parts
    .flatMap((part) => part.links)
    .filter(([from, to]) => present.has(from) && present.has(to))
    .reduce((all, [from, to]) => all.set(from, [...(all.get(from) ?? []), to]), new Map<string, string[]>());
  return points.map((point) => ({ ...point, next: [...point.next, ...(links.get(point.id) ?? [])] }));
}

/**
 * The world of a view: every point with its place, and where the lines cross the borders of the view. The place along
 * the time axis comes from the date, the height from the lane of the path and the height kept in the store. The
 * overview (a view that is not a period) uses the free positions instead and has no borders.
 * `pathIds` limits the paths shown, for an app that pages through them: only these paths are worked out. With a
 * cache (see `createStoreCache`) paths that did not change are not worked out again.
 */
export function placeLevel(
  store: Store,
  view: string,
  today: string,
  pathIds?: readonly string[],
  cache?: StoreCache,
): PlacedWorld {
  const period = periodFromKey(view);
  const cached = cache?.view(store.paths);
  const shown = levelPathsOf(store, view, cached, pathIds);
  const paths = shown.map(infoOf);
  const lanes = laneOffsets(paths);
  const laneOf = (pathId: string) => lanes.get(pathId) ?? 0;
  const parts = shown.flatMap((path) => path.branches.map((branch) => branchParts(path.id, branch)));
  const allParts = parts.flatMap((part) => part.points);
  const width = tileWidth(allParts);
  const free = createFreeReader(store, cached?.lookup);
  const points: PlacedPoint[] = allParts.map(({ height, ...point }) => ({
    ...point,
    ...(period ? { x: xOfDate(point.date, period, width), y: laneOf(point.pathId) + height } : free(point.id)),
  }));
  const world = { today, period: period && { start: period.start, end: period.end }, paths };
  if (!period) return { ...world, points: joined(points, parts), arrows: [], spans: [] };
  const [left, right] = [xOfBorder(period.start, period, width), xOfBorder(period.end + 1, period, width)];
  const present = new Set(points.map((point) => point.id));
  const arrows: PlacedArrow[] = parts.flatMap(({ pathId, arrows: own }) =>
    own
      .filter((arrow) => present.has(arrow.pointId))
      .map(({ height, ...arrow }) => ({
        ...arrow,
        pathId,
        x: arrow.side === 'before' ? left : right,
        y: laneOf(pathId) + height,
      })),
  );
  const spans: PlacedSpan[] = parts.flatMap(({ pathId, span }) =>
    span
      ? [
          {
            pathId,
            branchId: span.branchId,
            before: { key: span.before.key, x: left, y: laneOf(pathId) + span.before.height },
            after: { key: span.after.key, x: right, y: laneOf(pathId) + span.after.height },
            from: span.from,
            to: span.to,
            strength: span.strength,
          },
        ]
      : [],
  );
  return { ...world, points: joined(points, parts), arrows, spans };
}
