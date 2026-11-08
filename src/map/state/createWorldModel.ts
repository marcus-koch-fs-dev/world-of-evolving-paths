import { layoutPeriod, type PeriodLayout, placeWorld } from '../../core/layout.js';
import { layoutSignature, reuseLayout } from '../../core/layoutCache.js';
import type { PeriodData, PeriodMap, PlacedWorld, Position } from '../../core/types.js';
import { validatePeriodData } from '../../core/validate.js';
import { anyChange, type ConfigSnapshot, configDelta, EMPTY_SNAPSHOT, needsLayout } from './configDelta.js';
import { createOverrides, positionIn } from './createOverrides.js';

type Config = { periods: PeriodMap; view: string; seed: number; today: string };

type Changes = {
  /** Anything changed: data, view, seed or today. */
  changed: boolean;
  viewChanged: boolean;
  /** The app passed new data. */
  dataChanged: boolean;
  /** The points have to be laid out again. */
  layoutChanged: boolean;
};

export type WorldModel = {
  /** Applies the options and says what changed. */
  configure(config: Config): Changes;
  /** The valid data of the current view, or null. */
  periodData(): PeriodData | null;
  /** The world to draw, with the positions of points that are being dragged. */
  world(): PlacedWorld | null;
  positionOf(id: string): Position;
  setOverride(id: string, position: Position): void;
  clearOverride(id: string): void;
};

const NOTHING: Changes = { changed: false, viewChanged: false, dataChanged: false, layoutChanged: false };

/**
 * The world to draw, derived from the options. The points are laid out again only when something the layout depends
 * on changed (see `layoutSignature`), the view or the seed. New titles, statuses or strengths, or a new `today`,
 * reuse the layout, so moving through time is cheap even when the app builds new objects for every step.
 * Positions set while dragging live in the overrides until the app passes new data.
 */
export function createWorldModel(onError: (errors: string[]) => void): WorldModel {
  const overrides = createOverrides();
  let snapshot: ConfigSnapshot = EMPTY_SNAPSHOT;
  let data: PeriodData | null = null;
  let layout: PeriodLayout | null = null;
  let base: PlacedWorld | null = null;

  const validate = (raw: PeriodData | undefined): PeriodData | null => {
    if (raw === undefined) return null;
    const result = validatePeriodData(raw);
    if (result.ok) return result.data;
    onError(result.errors);
    return null;
  };

  const world = () => overrides.apply(base);

  return {
    configure(config) {
      const raw = config.periods[config.view];
      const delta = configDelta(snapshot, { ...config, raw });
      if (!anyChange(delta)) return NOTHING;

      if (delta.dataChanged) data = validate(raw);
      if (delta.dataChanged || delta.viewChanged || delta.seedChanged) overrides.clearAll();
      const signature = data ? layoutSignature(data) : '';
      const layoutChanged = needsLayout(delta, signature !== snapshot.signature);
      snapshot = { raw, view: config.view, seed: config.seed, today: config.today, signature };
      if (layoutChanged) layout = data ? layoutPeriod(data, config.view, config.seed) : null;
      else if (delta.dataChanged && data && layout) layout = reuseLayout(data, layout);
      base = layout ? placeWorld(layout, config.today) : null;
      return { changed: true, viewChanged: delta.viewChanged, dataChanged: delta.dataChanged, layoutChanged };
    },

    periodData: () => data,
    world,
    positionOf: (id) => positionIn(world(), id),
    setOverride: overrides.set,
    clearOverride: overrides.clear,
  };
}
