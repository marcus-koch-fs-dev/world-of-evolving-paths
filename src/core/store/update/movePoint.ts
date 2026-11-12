import { keptPointHeight } from '../layout.js';
import { withArrowHeights, withPointHeights } from '../layoutEdits.js';
import { LEVELS } from '../levels.js';
import type { Level, Store } from '../types.js';
import { freezeArrowsAround } from './freeze.js';

const pathOfPoint = (store: Store, id: string) =>
  store.paths.find((path) => path.branches.some((branch) => branch.points.some((point) => point.id === id)));

/**
 * The levels whose picture of a point changes when it moves on `level`. A point without a height of its own on a
 * coarser level takes the one of the week, so moving it on the week moves it there, too.
 */
const affectedLevels = (store: Store, level: Level, id: string): Level[] => {
  const path = pathOfPoint(store, id);
  return level === 'week'
    ? LEVELS.filter((other) => other === 'week' || !path || keptPointHeight(path, other, id) === undefined)
    : [level];
};

/**
 * Moves one point to a height on a level. Only this point moves: the arrows next to it keep the height they have
 * now, so the lines on both sides of the borders stay where they are.
 */
export function movePoint(store: Store, level: Level, id: string, y: number): Store {
  const frozen = affectedLevels(store, level, id).reduce(
    (current, other) => freezeArrowsAround(current, other, id),
    store,
  );
  return withPointHeights(frozen, level, { [id]: Math.round(y) });
}

/**
 * Moves one arrow to a height on a level. The key belongs to the border, so the period on the other side of it
 * shows the arrow at the same height.
 */
export const moveArrow = (store: Store, level: Level, key: string, y: number): Store =>
  withArrowHeights(store, level, { [key]: Math.round(y) });
