import { toDay } from '../../dates.js';
import { bordersBetween } from '../boundaries.js';
import { type Chain, levelChains } from '../chains.js';
import { withArrowHeights } from '../layout.js';
import type { LevelReader } from '../reader.js';
import { createLevelReader } from '../reader.js';
import type { Level, Store } from '../types.js';

/**
 * The arrows of a chain between two of its items that have no kept height yet, with the height they have right now.
 * Writing these down keeps them where they are while a point next to them moves.
 */
export function unkeptArrows(
  chain: Chain,
  level: Level,
  reader: LevelReader,
  range: { from: number; to: number },
): Record<string, number> {
  const last = chain.items.length - 1;
  const dayAt = (index: number) => toDay(chain.items[Math.min(last, Math.max(0, index))].point.date);
  const readings = bordersBetween(level, dayAt(range.from), dayAt(range.to)).flatMap((border) => {
    const reading = reader.arrowAt(chain, border);
    return reading ? [reading] : [];
  });
  return Object.fromEntries(readings.filter((reading) => !reading.stored).map((reading) => [reading.key, reading.y]));
}

/** Keeps the arrows next to a point where they are, on a level: the ones of every line that runs through the point. */
export function freezeArrowsAround(store: Store, level: Level, pointId: string): Store {
  const reader = createLevelReader(store, level);
  const frozen = levelChains(store.paths, level).flatMap((chain) => {
    const index = chain.items.findIndex((item) => item.point.id === pointId);
    return index === -1 ? [] : [unkeptArrows(chain, level, reader, { from: index - 1, to: index + 1 })];
  });
  return withArrowHeights(store, level, Object.assign({}, ...frozen));
}
