import { layoutPeriod, layoutSignature, type PeriodLayout, placeWorld, reuseLayout } from '../../core/layout';
import type { PeriodData, PeriodMap, PlacedWorld, Position } from '../../core/types';
import { validatePeriodData } from '../../core/validate';

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

/** The world with some points moved to other positions. */
export function withOverrides(world: PlacedWorld, overrides: ReadonlyMap<string, Position>): PlacedWorld {
  if (overrides.size === 0) return world;
  return { ...world, points: world.points.map((point) => ({ ...point, ...overrides.get(point.id) })) };
}

/** Where a point is in a world. A point that is not there is at the origin. */
export function positionIn(world: PlacedWorld | null, id: string): Position {
  const point = world?.points.find((candidate) => candidate.id === id);
  return point ? { x: point.x, y: point.y } : { x: 0, y: 0 };
}

/**
 * The world to draw, derived from the options. The points are laid out again only when something the layout depends
 * on changed (see `layoutSignature`), the view or the seed. New titles, statuses or strengths, or a new `today`,
 * reuse the layout, so moving through time is cheap even when the app builds new objects for every step.
 * Positions set while dragging live in `overrides` until the app passes new data.
 */
export function createWorldModel(onError: (errors: string[]) => void): WorldModel {
  let rawData: PeriodData | undefined;
  let data: PeriodData | null = null;
  let view: string | null = null;
  let seed = Number.NaN;
  let today = '';
  let signature = '';
  let layout: PeriodLayout | null = null;
  let base: PlacedWorld | null = null;
  let composed: PlacedWorld | null = null;
  const overrides = new Map<string, Position>();

  const validate = (raw: PeriodData | undefined) => {
    data = null;
    if (raw === undefined) return;
    const result = validatePeriodData(raw);
    if (result.ok) data = result.data;
    else onError(result.errors);
  };

  const world = (): PlacedWorld | null => {
    if (!base || overrides.size === 0) return base;
    composed ??= withOverrides(base, overrides);
    return composed;
  };

  return {
    configure(config) {
      const raw = config.periods[config.view];
      const dataChanged = raw !== rawData;
      const viewChanged = config.view !== view;
      const seedChanged = config.seed !== seed;
      if (!dataChanged && !viewChanged && !seedChanged && config.today === today) return NOTHING;

      if (dataChanged) validate(raw);
      if (dataChanged || viewChanged || seedChanged) overrides.clear();
      const nextSignature = data ? layoutSignature(data) : '';
      const layoutChanged = viewChanged || seedChanged || nextSignature !== signature;
      rawData = raw;
      view = config.view;
      seed = config.seed;
      today = config.today;
      signature = nextSignature;
      if (layoutChanged) layout = data ? layoutPeriod(data, config.view, config.seed) : null;
      else if (dataChanged && data && layout) layout = reuseLayout(data, layout);
      base = layout ? placeWorld(layout, config.today) : null;
      composed = null;
      return { changed: true, viewChanged, dataChanged, layoutChanged };
    },

    periodData: () => data,
    world,
    positionOf: (id) => positionIn(world(), id),

    setOverride(id, position) {
      overrides.set(id, position);
      composed = null;
    },

    clearOverride(id) {
      overrides.delete(id);
      composed = null;
    },
  };
}
