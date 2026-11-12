import { type PointStatus, type Store, tierAt, toDay } from 'world-of-evolving-paths';
import type { CheckIn } from './types';

/** What the look of a point needs to know about it. */
export type Timed = { id: string; pathId: string; date: string; status: PointStatus };

/** The days of the check-ins of every path. */
export function checkInDays(checkIns: readonly CheckIn[]): Map<string, number[]> {
  return checkIns.reduce((groups, checkIn) => {
    const days = groups.get(checkIn.pathId);
    if (days) days.push(toDay(checkIn.date));
    else groups.set(checkIn.pathId, [toDay(checkIn.date)]);
    return groups;
  }, new Map<string, number[]>());
}

/**
 * The status of every point as of a day, for moving through time: earlier points are done, the first one still
 * ahead on its path is current, the rest is open. Abandoned points stay abandoned.
 */
export function statusesAsOf(points: readonly Timed[], asOf: string): Map<string, PointStatus> {
  const day = toDay(asOf);
  // One pass: per path the earliest point that is not abandoned and not before the day
  const nextByPath = points
    .filter((point) => point.status !== 'abandoned' && toDay(point.date) >= day)
    .reduce((earliest, point) => {
      const best = earliest.get(point.pathId);
      if (!best || toDay(point.date) < toDay(best.date)) earliest.set(point.pathId, point);
      return earliest;
    }, new Map<string, Timed>());
  const currentIds = new Set([...nextByPath.values()].map((point) => point.id));
  return new Map(
    points.map((point): [string, PointStatus] => {
      if (point.status === 'abandoned') return [point.id, point.status];
      if (toDay(point.date) < day) return [point.id, 'done'];
      return [point.id, currentIds.has(point.id) ? 'current' : 'open'];
    }),
  );
}

/**
 * Strength tier of a reached point, counted over all check-ins of its path, also those the view hides. With `asOf`
 * the point still being walked to counts on that day, so its line grows stronger while time plays.
 */
export function strengthOf(
  point: Timed,
  status: PointStatus,
  daysByPath: ReadonlyMap<string, number[]>,
  asOf?: string,
): number | undefined {
  if (status !== 'done' && status !== 'current') return undefined;
  const counted = asOf && status === 'current' ? toDay(asOf) : toDay(point.date);
  return tierAt(daysByPath.get(point.pathId) ?? [], counted);
}

/** The same array when no item changed, else the changed one. So untouched parts of the data stay the same objects. */
function keptIfSame<T>(items: readonly T[], changed: readonly T[]): readonly T[] {
  return changed.every((item, index) => item === items[index]) ? items : changed;
}

/**
 * The store as the map should show it on a day: statuses moved to that day (time travel) and the strength of every
 * reached point counted from the check-ins. The heights and everything else stay as they are. A path whose points look
 * the same as before stays the same object, so the map does not work it out again.
 */
export function withLook(store: Store, checkIns: readonly CheckIn[], asOf?: string): Store {
  const timed = store.paths.flatMap((path) =>
    path.branches.flatMap((branch) => branch.points.map((point) => ({ ...point, pathId: path.id }))),
  );
  const statuses = asOf ? statusesAsOf(timed, asOf) : new Map(timed.map((point) => [point.id, point.status]));
  const daysByPath = checkInDays(checkIns);
  const lookOf = (point: Timed) => {
    const status = statuses.get(point.id) ?? point.status;
    return { status, strength: strengthOf(point, status, daysByPath, asOf) };
  };
  const paths = store.paths.map((path) => {
    const branches = path.branches.map((branch) => {
      const points = branch.points.map((point) => {
        const look = lookOf({ ...point, pathId: path.id });
        return look.status === point.status && look.strength === point.strength ? point : { ...point, ...look };
      });
      return keptIfSame(branch.points, points) === branch.points ? branch : { ...branch, points };
    });
    return keptIfSame(path.branches, branches) === path.branches ? path : { ...path, branches };
  });
  return keptIfSame(store.paths, paths) === store.paths ? store : { ...store, paths };
}
