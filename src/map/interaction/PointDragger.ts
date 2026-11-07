import { layoutOf, settle } from '../../core/collision';
import type { PointKind, Position } from '../../core/types';
import type { WorldModel } from '../state/WorldModel';
import { springBack } from './springBack';

const MOVED_THRESHOLD = 4; // a drag shorter than this counts as a click
const IGNORED_AFTER_MS = 80; // the app has this long to answer a move with new data

type Dependencies = {
  model: WorldModel;
  /** The scene has to be rebuilt because a position changed. */
  onChange: () => void;
  /** The point came to rest at this position. */
  onMoved: (id: string, position: Position) => void;
};

type Spring = { stop: () => void; id: string; destination: Position; reportsMove: boolean };
type Reported = { id: string; original: Position; rest: Position; timer: ReturnType<typeof setTimeout> };

/**
 * Moves one point while it is dragged and decides where it ends up. A point may only rest where radius + radius
 * are free. Otherwise it springs back along its way to the first free spot, while all others stay.
 * After a move is reported the app owns the data: if it does not answer with new data, the point returns.
 */
export class PointDragger {
  private startPosition: Position = { x: 0, y: 0 };
  private spring: Spring | null = null;
  private reported: Reported | null = null;

  constructor(private readonly deps: Dependencies) {}

  start(id: string): void {
    this.finishSpring();
    this.acknowledge();
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
      this.report(id, target);
      return;
    }
    this.animate(id, target, destination, true);
  }

  /** The app answered a move with new data. The point stays where the data says. */
  acknowledge(): void {
    if (!this.reported) return;
    clearTimeout(this.reported.timer);
    this.reported = null;
  }

  /** Stops everything without reporting, for when the view or the data underneath changed. */
  cancel(): void {
    this.spring?.stop();
    this.spring = null;
    this.acknowledge();
  }

  /** A running spring ends at once: the point jumps to where it was heading and the move is reported. */
  private finishSpring(): void {
    const spring = this.spring;
    if (!spring) return;
    spring.stop();
    this.spring = null;
    this.move(spring.id, spring.destination);
    if (spring.reportsMove) this.report(spring.id, spring.destination);
  }

  private animate(id: string, from: Position, to: Position, reportsMove: boolean): void {
    const stop = springBack(
      from,
      to,
      (position) => this.move(id, position),
      () => {
        this.spring = null;
        if (reportsMove) this.report(id, to);
        else {
          this.deps.model.clearOverride(id);
          this.deps.onChange();
        }
      },
    );
    this.spring = { stop, id, destination: to, reportsMove };
  }

  private report(id: string, position: Position): void {
    this.acknowledge();
    // Armed before the callback runs, so an answer that comes back at once is still noticed
    this.reported = {
      id,
      original: this.startPosition,
      rest: position,
      timer: setTimeout(() => this.revert(), IGNORED_AFTER_MS),
    };
    this.deps.onMoved(id, position);
  }

  /** The app ignored the move: the point goes back to where it was. */
  private revert(): void {
    const reported = this.reported;
    this.reported = null;
    if (reported) this.animate(reported.id, reported.rest, reported.original, false);
  }
}
