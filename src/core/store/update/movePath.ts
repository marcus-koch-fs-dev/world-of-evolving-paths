import { bordersBetween } from '../boundaries.js';
import { levelChains } from '../chains.js';
import { withArrowHeights, withPointHeights } from '../layout.js';
import { indexPoints } from '../order.js';
import { createLevelReader } from '../reader.js';
import type { Level, Store } from '../types.js';
import { unkeptArrows } from './freeze.js';

/**
 * Moves a whole path by a distance on a level: all its points and the ends of all its branches at the borders.
 * Forks of other paths that start at one of its points keep the arrows next to that point where they are.
 */
export function movePath(store: Store, level: Level, pathId: string, shift: number): Store {
  const reader = createLevelReader(store, level);
  const infos = indexPoints(store.paths);
  const chains = levelChains(store.paths, level);
  const own = store.paths.find((path) => path.id === pathId);
  if (!own) return store;
  const pointHeights = Object.fromEntries(
    own.branches.flatMap((branch) =>
      branch.points.map((point) => [point.id, Math.round(reader.pointY(point.id) + shift)]),
    ),
  );
  const arrowHeights = chains
    .filter((chain) => chain.pathId === pathId)
    .flatMap((chain) => {
      const days = chain.items.map((item) => item.day);
      return bordersBetween(level, days[0], days.at(-1) ?? days[0]).flatMap((border) => {
        const reading = reader.arrowAt(chain, border);
        return reading ? [[reading.key, Math.round(reading.y + shift)] as const] : [];
      });
    });
  const staying = chains
    .filter((chain) => chain.pathId !== pathId && chain.items[0].role === 'anchor')
    .filter((chain) => infos.get(chain.items[0].point.id)?.pathId === pathId)
    .map((chain) => unkeptArrows(chain, level, reader, { from: 0, to: 1 }));
  const kept = withArrowHeights(store, level, Object.assign({}, ...staying));
  return withArrowHeights(withPointHeights(kept, level, pointHeights), level, Object.fromEntries(arrowHeights));
}
