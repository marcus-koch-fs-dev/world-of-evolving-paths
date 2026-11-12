import { isIsoDate } from '../dates.js';
import { indexPoints } from './order.js';
import type { StorePath } from './types.js';

/** The ids that appear more than once, each one once. */
function duplicates(ids: readonly string[]): string[] {
  const counts = ids.reduce((all, id) => all.set(id, (all.get(id) ?? 0) + 1), new Map<string, number>());
  return [...counts].filter(([, count]) => count > 1).map(([id]) => id);
}

/** Does following `splitsAt` from this branch lead back to it? */
function splitsInCircle(start: string, splitOf: ReadonlyMap<string, string | undefined>): boolean {
  const walk = (id: string | undefined, seen: ReadonlySet<string>): boolean => {
    if (id === undefined) return false;
    if (seen.has(id)) return true;
    return walk(splitOf.get(id), new Set([...seen, id]));
  };
  return walk(splitOf.get(start), new Set([start]));
}

/**
 * Checks the paths the app passes in and says what is wrong, in plain words. An empty list means the data is fine.
 */
export function validateStore(paths: readonly StorePath[]): string[] {
  const branches = paths.flatMap((path) => path.branches);
  const points = branches.flatMap((branch) => branch.points);
  const infos = indexPoints(paths);
  const branchOfPoint = new Map([...infos].map(([id, info]) => [id, info.branchId]));
  const splitOf = new Map(
    branches.map((branch) => [branch.id, branch.splitsAt ? branchOfPoint.get(branch.splitsAt) : undefined]),
  );
  return [
    ...duplicates(paths.map((path) => path.id)).map((id) => `Path id "${id}" is used twice.`),
    ...paths.filter((path) => path.id.includes('/')).map((path) => `Path id "${path.id}" must not contain a slash.`),
    ...duplicates(branches.map((branch) => branch.id)).map((id) => `Branch id "${id}" is used twice.`),
    ...duplicates(points.map((point) => point.id)).map((id) => `Point id "${id}" is used twice.`),
    ...points
      .filter((point) => !isIsoDate(point.date))
      .map((point) => `Point "${point.id}" has no valid date (YYYY-MM-DD): "${point.date}".`),
    ...points
      .filter((point) => !Number.isInteger(point.prio) || point.prio < 1 || point.prio > 5)
      .map((point) => `Point "${point.id}" needs a prio from 1 to 5, got ${point.prio}.`),
    ...branches
      .filter((branch) => branch.splitsAt !== undefined && !infos.has(branch.splitsAt))
      .map((branch) => `Branch "${branch.id}" splits at "${branch.splitsAt}", which does not exist.`),
    ...branches
      .filter((branch) => branch.splitsAt !== undefined && branchOfPoint.get(branch.splitsAt) === branch.id)
      .map((branch) => `Branch "${branch.id}" cannot split at a point of its own.`),
    ...branches
      .filter((branch) => splitsInCircle(branch.id, splitOf))
      .map((branch) => `Branch "${branch.id}" splits in a circle.`),
  ];
}
