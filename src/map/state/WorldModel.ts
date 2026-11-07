import { placePeriod } from '../../core/layout';
import type { PeriodData, PeriodMap, PlacedWorld, Position } from '../../core/types';
import { validatePeriodData } from '../../core/validate';

type Config = { periods: PeriodMap; view: string; seed: number; today: string };

/**
 * The world to draw, derived from the options. Recomputes only when the period object, the view, the seed or
 * today changed. Positions set while dragging live in `overrides` until the app passes a new period object.
 */
export class WorldModel {
  private rawData: PeriodData | undefined;
  private data: PeriodData | null = null;
  private view: string | null = null;
  private seed = Number.NaN;
  private today = '';
  private base: PlacedWorld | null = null;
  private composed: PlacedWorld | null = null;
  private readonly overrides = new Map<string, Position>();

  constructor(private readonly onError: (errors: string[]) => void) {}

  /** Applies the options. Returns what changed. */
  configure({ periods, view, seed, today }: Config): { changed: boolean; viewChanged: boolean } {
    const raw = periods[view];
    const dataChanged = raw !== this.rawData;
    const viewChanged = view !== this.view;
    if (!dataChanged && !viewChanged && seed === this.seed && today === this.today) {
      return { changed: false, viewChanged: false };
    }
    if (dataChanged) this.validate(raw);
    this.overrides.clear();
    this.rawData = raw;
    this.view = view;
    this.seed = seed;
    this.today = today;
    this.base = this.data ? placePeriod(this.data, view, today, seed) : null;
    this.composed = null;
    return { changed: true, viewChanged };
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
