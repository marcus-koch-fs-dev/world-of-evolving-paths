import { pick } from '../random.js';
import { arrowKey } from './boundaries.js';
import { type Chain, createLookup, type Lookup } from './chains.js';
import type { PointInfo } from './order.js';
import type { Level, Store, StorePoint } from './types.js';

const BRANCH_GAP = 120;
const WOBBLE = 70;
// Half a day: a border lies between the last day of a period and the first of the next one
const HALF_DAY = 0.5;

/** Where a point sits when nobody put it anywhere: beside its branch, a little off by a fixed number from its id. */
export function defaultHeight({ point, branchIndex }: PointInfo): number {
  const side = branchIndex % 2 === 1 ? 1 : -1;
  const offset = branchIndex === 0 ? 0 : side * Math.ceil(branchIndex / 2) * BRANCH_GAP;
  return offset + Math.round((pick(`${point.id}|y`) - 0.5) * 2 * WOBBLE);
}

/** The height of an arrow: kept by the user (`stored`), or on the straight line between the two items around it. */
export type ArrowReading = { key: string; y: number; stored: boolean; from: StorePoint; to: StorePoint };

/**
 * Reads the heights of a level. A point has the height kept on this level, else the one kept on the week, else its
 * default. An arrow has the height kept for its border, else the straight line between its two neighbours. Both only
 * depend on the points of the level, never on the period shown, so two periods agree on a shared border.
 */
export function createLevelReader(store: Store, level: Level, lookup: Lookup = createLookup(store.paths)) {
  const kept = store.heights[level];
  const pointY = (id: string): number => {
    const info = lookup.point(id)?.info;
    return kept.points[id] ?? store.heights.week.points[id] ?? (info ? defaultHeight(info) : 0);
  };

  /** The arrow where a chain crosses the border starting on `borderDay`, or null when the line does not reach it. */
  const arrowAt = (chain: Chain, borderDay: number): ArrowReading | null => {
    const nextIndex = chain.items.findIndex((item) => item.day >= borderDay);
    const before = nextIndex > 0 ? chain.items[nextIndex - 1] : undefined;
    const after = nextIndex > 0 ? chain.items[nextIndex] : undefined;
    if (!before || !after) return null;
    const key = arrowKey(chain.pathId, chain.branchId, borderDay);
    const stored = kept.arrows[key];
    const ends = { from: before.point, to: after.point };
    if (stored !== undefined) return { key, y: stored, stored: true, ...ends };
    const [from, to] = [before.day, after.day];
    const share = (borderDay - HALF_DAY - from) / (to - from);
    const [a, b] = [pointY(before.point.id), pointY(after.point.id)];
    return { key, y: Math.round(a + (b - a) * share), stored: false, ...ends };
  };

  return { pointY, arrowAt };
}

export type LevelReader = ReturnType<typeof createLevelReader>;
