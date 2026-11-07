import { layoutOf, settle } from '../../core/collision';
import type { PointKind, Position } from '../../core/types';
import type { WorldModel } from '../state/WorldModel';
import { springBack } from './springBack';

const MOVED_THRESHOLD = 1; // a drag shorter than this counts as a click

type Dependencies = {
  model: WorldModel;
  /** The scene has to be rebuilt because a position changed. */
  onChange: () => void;
  /** The point came to rest at this position. */
  onMoved: (id: string, position: Position) => void;
};

/**
 * Moves one point while it is dragged and decides where it ends up. A point may only rest where radius + radius
 * are free. Otherwise it springs back along its way to the first free spot, while all others stay.
 */
export class PointDragger {
  private startPosition: Position = { x: 0, y: 0 };
  private stopSpring: (() => void) | null = null;

  constructor(private readonly deps: Dependencies) {}

  start(id: string): void {
    this.cancel();
    this.startPosition = this.deps.model.positionOf(id);
  }

  move(id: string, position: Position): void {
    this.deps.model.setOverride(id, position);
    this.deps.onChange();
  }

  end(id: string): void {
    const { model } = this.deps;
    const target = model.positionOf(id);
    if (Math.hypot(target.x - this.startPosition.x, target.y - this.startPosition.y) < MOVED_THRESHOLD) {
      model.clearOverride(id);
      this.deps.onChange();
      return;
    }
    const points = model.world()?.points ?? [];
    const self = points.find((point) => point.id === id);
    const mover = { id, kind: (self?.kind ?? 'milestone') as PointKind, importance: self?.importance };
    const destination = settle(layoutOf(points), mover, this.startPosition, target);
    if (destination === target) {
      this.deps.onMoved(id, target);
      return;
    }
    this.stopSpring = springBack(
      target,
      destination,
      (position) => this.move(id, position),
      () => {
        this.stopSpring = null;
        this.deps.onMoved(id, destination);
      },
    );
  }

  cancel(): void {
    this.stopSpring?.();
    this.stopSpring = null;
  }
}
