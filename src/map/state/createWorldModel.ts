import { periodFromKey } from '../../core/calendar.js';
import { placeLevel } from '../../core/place/placeLevel.js';
import { createStoreCache } from '../../core/store/cache.js';
import type { Store } from '../../core/store/types.js';
import { validateStore } from '../../core/store/validate.js';
import type { PlacedWorld, Position } from '../../core/types.js';
import { anyChange, type ConfigSnapshot, configDelta, EMPTY_SNAPSHOT } from './configDelta.js';
import { createOverrides, positionIn } from './createOverrides.js';

type Config = { store: Store; view: string; today: string; pathIds?: readonly string[] };

type Changes = {
  /** Anything changed: data, view, paths or today. */
  changed: boolean;
  /** Another view, or other paths in it: the map frames the world again. */
  viewChanged: boolean;
  /** The app passed a new store. */
  dataChanged: boolean;
};

export type WorldModel = {
  /** Applies the options and says what changed. */
  configure(config: Config): Changes;
  /** The valid store, or null when the data is wrong. */
  store(): Store | null;
  /** The level of the shown period, or null in the overview. */
  level(): 'week' | 'month' | 'year' | null;
  /** The world to draw, with the positions of points that are being dragged. */
  world(): PlacedWorld | null;
  positionOf(id: string): Position;
  setOverride(id: string, position: Position): void;
  clearOverride(id: string): void;
};

const NOTHING: Changes = { changed: false, viewChanged: false, dataChanged: false };

/**
 * The world to draw, derived from the options. It is made again whenever the store, the view, the shown paths or
 * today change. Positions set while dragging live in the overrides until the app passes a new store.
 */
export function createWorldModel(onError: (errors: string[]) => void): WorldModel {
  const overrides = createOverrides();
  // Paths that did not change are not worked out again
  const cache = createStoreCache();
  let snapshot: ConfigSnapshot = EMPTY_SNAPSHOT;
  let valid: Store | null = null;
  let base: PlacedWorld | null = null;
  let level: ReturnType<WorldModel['level']> = null;

  const check = (store: Store): Store | null => {
    const errors = validateStore(store.paths);
    if (errors.length === 0) return store;
    onError(errors);
    return null;
  };

  const world = () => overrides.apply(base);

  return {
    configure(config) {
      const delta = configDelta(snapshot, { ...config, pathIds: config.pathIds });
      if (!anyChange(delta)) return NOTHING;
      if (delta.dataChanged) valid = check(config.store);
      if (delta.dataChanged || delta.viewChanged || delta.pathsChanged) overrides.clearAll();
      snapshot = { store: config.store, view: config.view, today: config.today, pathIds: config.pathIds };
      level = periodFromKey(config.view)?.level ?? null;
      base = valid ? placeLevel(valid, config.view, config.today, config.pathIds, cache) : null;
      // Other paths on the page are another picture of the world: the camera frames it again
      return { changed: true, viewChanged: delta.viewChanged || delta.pathsChanged, dataChanged: delta.dataChanged };
    },

    store: () => valid,
    level: () => level,
    world,
    positionOf: (id) => positionIn(world(), id),
    setOverride: overrides.set,
    clearOverride: overrides.clear,
  };
}
