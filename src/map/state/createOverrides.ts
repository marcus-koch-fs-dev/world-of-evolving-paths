import type { PlacedWorld, Position } from '../../core/types.js';

export type Overrides = {
  set(id: string, position: Position): void;
  clear(id: string): void;
  clearAll(): void;
  /** The world with the overridden points moved. The same object comes back while nothing changed. */
  apply(world: PlacedWorld | null): PlacedWorld | null;
};

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

/** Positions set while points are dragged. They stay until the app passes new data. */
export function createOverrides(): Overrides {
  const positions = new Map<string, Position>();
  let source: PlacedWorld | null = null;
  let composed: PlacedWorld | null = null;

  const forget = () => {
    composed = null;
  };

  return {
    set(id, position) {
      positions.set(id, position);
      forget();
    },
    clear(id) {
      positions.delete(id);
      forget();
    },
    clearAll() {
      positions.clear();
      forget();
    },
    apply(world) {
      if (!world || positions.size === 0) return world;
      if (source !== world || !composed) {
        source = world;
        composed = withOverrides(world, positions);
      }
      return composed;
    },
  };
}
