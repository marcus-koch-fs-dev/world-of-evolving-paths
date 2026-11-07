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

const NOTHING: Changes = { changed: false, viewChanged: false, dataChanged: false, layoutChanged: false };

/**
 * The world to draw, derived from the options. The points are laid out again only when something the layout depends
 * on changed (see `layoutSignature`), the view or the seed. New titles, statuses or strengths, or a new `today`,
 * reuse the layout, so moving through time is cheap even when the app builds new objects for every step.
 * Positions set while dragging live in `overrides` until the app passes new data.
 */
export class WorldModel {
  private rawData: PeriodData | undefined;
  private data: PeriodData | null = null;
  private view: string | null = null;
  private seed = Number.NaN;
  private today = '';
  private signature = '';
  private layout: PeriodLayout | null = null;
  private base: PlacedWorld | null = null;
  private composed: PlacedWorld | null = null;
  private readonly overrides = new Map<string, Position>();

  constructor(private readonly onError: (errors: string[]) => void) {}

  /** Applies the options and says what changed. */
  configure({ periods, view, seed, today }: Config): Changes {
    const raw = periods[view];
    const dataChanged = raw !== this.rawData;
    const viewChanged = view !== this.view;
    const seedChanged = seed !== this.seed;
    if (!dataChanged && !viewChanged && !seedChanged && today === this.today) return NOTHING;

    if (dataChanged) this.validate(raw);
    if (dataChanged || viewChanged || seedChanged) this.overrides.clear();
    const signature = this.data ? layoutSignature(this.data) : '';
    const layoutChanged = viewChanged || seedChanged || signature !== this.signature;
    this.rawData = raw;
    this.view = view;
    this.seed = seed;
    this.today = today;
    this.signature = signature;
    if (layoutChanged) this.layout = this.data ? layoutPeriod(this.data, view, seed) : null;
    else if (dataChanged && this.data && this.layout) this.layout = reuseLayout(this.data, this.layout);
    this.base = this.layout ? placeWorld(this.layout, today) : null;
    this.composed = null;
    return { changed: true, viewChanged, dataChanged, layoutChanged };
  }
  /** The valid data of the current view, or null. */
  periodData(): PeriodData | null {
    return this.data;
  }

  world(): PlacedWorld | null {
    if (!this.base || this.overrides.size === 0) return this.base;
    this.composed ??= {
      ...this.base,
      points: this.base.points.map((point) => ({ ...point, ...this.overrides.get(point.id) })),
    };
    return this.composed;
  }

  positionOf(id: string): Position {
    const point = this.world()?.points.find((candidate) => candidate.id === id);
    return point ? { x: point.x, y: point.y } : { x: 0, y: 0 };
  }

  setOverride(id: string, position: Position): void {
    this.overrides.set(id, position);
    this.composed = null;
  }

  clearOverride(id: string): void {
    this.overrides.delete(id);
    this.composed = null;
  }

  private validate(raw: PeriodData | undefined): void {
    this.data = null;
    if (raw === undefined) return;
    const result = validatePeriodData(raw);
    if (result.ok) this.data = result.data;
    else this.onError(result.errors);
  }
}
