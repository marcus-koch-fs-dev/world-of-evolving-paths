import { toDay } from '../../dates.js';
import { bordersBetween } from '../boundaries.js';
import { type Chain, levelChains } from '../chains.js';
import { withArrowHeights } from '../layout.js';
import { LEVELS } from '../levels.js';
import { createLevelReader } from '../reader.js';
import type { Level, Store } from '../types.js';

const inSameBranch = (a: Chain) => (b: Chain) => a.pathId === b.pathId && a.branchId === b.branchId;
const holdsPoint = (id: string) => (chain: Chain) => chain.items.some((item) => item.point.id === id);

/** The arrows that would change on one level because a point appeared, vanished or moved, with their old heights. */
function arrowsToKeep(before: Store, after: Store, level: Level, pointId: string): Record<string, number> {
  const [oldChains, newChains] = [levelChains(before.paths, level), levelChains(after.paths, level)];
  // The line around the point: from the new picture if the point is shown now, else from the old one
  const around = newChains.find(holdsPoint(pointId)) ?? oldChains.find(holdsPoint(pointId));
  const wasThere = around && oldChains.find(inSameBranch(around));
  if (!around || !wasThere) return {};
  const index = around.items.findIndex((item) => item.point.id === pointId);
  const dayAt = (at: number) => toDay(around.items[Math.min(around.items.length - 1, Math.max(0, at))].point.date);
  const reader = createLevelReader(before, level);
  const readings = bordersBetween(level, dayAt(index - 1), dayAt(index + 1)).flatMap((border) => {
    const reading = reader.arrowAt(wasThere, border);
    return reading ? [reading] : [];
  });
  return Object.fromEntries(readings.filter((reading) => !reading.stored).map((reading) => [reading.key, reading.y]));
}

/**
 * Writes down the arrows around a point that would move on their own because the point appeared, vanished or changed
 * its date or prio. They keep the heights the user saw. `before` and `after` are the store without and with the change.
 */
export function keepArrows(before: Store, after: Store, pointId: string): Store {
  return LEVELS.reduce(
    (store, level) => withArrowHeights(store, level, arrowsToKeep(before, after, level, pointId)),
    after,
  );
}
