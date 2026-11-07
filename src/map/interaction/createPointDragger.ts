import { layoutOf, settle } from '../../core/collision.js';
import type { PlacedPoint, PointKind, Position } from '../../core/types.js';
import type { WorldModel } from '../state/createWorldModel.js';
import { springBack } from './springBack.js';

const MOVED_THRESHOLD = 4; // a drag shorter than this counts as a click
const IGNORED_AFTER_MS = 80; // the app has this long to answer a move with new data

type Dependencies = {
  model: WorldModel;
  /** The scene has to be rebuilt because a position changed. */
  onChange: () => void;
  /** The point came to rest at this position. */
  onMoved: (id: string, position: Position) => void;
};

export type PointDragger = {
  start(id: string): void;
  move(id: string, position: Position): void;
  end(id: string): void;
  /** The app answered a move with new data. The point stays where the data says. */
  acknowledge(): void;
  /** Stops everything without reporting, for when the view or the data underneath changed. */
  cancel(): void;
};

type Spring = { stop: () => void; id: string; destination: Position; reportsMove: boolean };
type Reported = { id: string; original: Position; rest: Position; timer: ReturnType<typeof setTimeout> };

/** Where a released point comes to rest: at the target if there is room, otherwise the first free spot on the way back. */
export function destinationFor(points: PlacedPoint[], id: string, start: Position, target: Position): Position {
  const self = points.find((point) => point.id === id);
  const mover = { id, kind: (self?.kind ?? 'milestone') as PointKind, importance: self?.importance };
  return settle(layoutOf(points), mover, start, target);
}

const isClick = (start: Position, end: Position) => Math.hypot(end.x - start.x, end.y - start.y) < MOVED_THRESHOLD;

/**
 * Moves one point while it is dragged and decides where it ends up. A point may only rest where radius + radius
 * are free. Otherwise it springs back along its way to the first free spot, while all others stay.
 * After a move is reported the app owns the data: if it does not answer with new data, the point returns.
 */
export function createPointDragger({ model, onChange, onMoved }: Dependencies): PointDragger {
  let startPosition: Position = { x: 0, y: 0 };
  let spring: Spring | null = null;
  let reported: Reported | null = null;

  const move = (id: string, position: Position) => {
    model.setOverride(id, position);
    onChange();
  };

  const acknowledge = () => {
    if (!reported) return;
    clearTimeout(reported.timer);
    reported = null;
  };

  const animate = (id: string, from: Position, to: Position, reportsMove: boolean) => {
    const stop = springBack(
      from,
      to,
      (position) => move(id, position),
      () => {
        spring = null;
        if (reportsMove) report(id, to);
        else {
          model.clearOverride(id);
          onChange();
        }
      },
    );
    spring = { stop, id, destination: to, reportsMove };
  };

  /** The app ignored the move: the point goes back to where it was. */
  const revert = () => {
    const ignored = reported;
    reported = null;
    if (ignored) animate(ignored.id, ignored.rest, ignored.original, false);
  };

  function report(id: string, position: Position) {
    acknowledge();
    // Armed before the callback runs, so an answer that comes back at once is still noticed
    reported = { id, original: startPosition, rest: position, timer: setTimeout(revert, IGNORED_AFTER_MS) };
    onMoved(id, position);
  }

  /** A running spring ends at once: the point jumps to where it was heading and the move is reported. */
  const finishSpring = () => {
    const running = spring;
    if (!running) return;
    running.stop();
    spring = null;
    move(running.id, running.destination);
    if (running.reportsMove) report(running.id, running.destination);
  };

  return {
    start(id) {
      finishSpring();
      acknowledge();
      startPosition = model.positionOf(id);
    },

    move,

    end(id) {
      const world = model.world();
      if (!world?.points.some((point) => point.id === id)) return;
      const target = model.positionOf(id);
      if (isClick(startPosition, target)) {
        model.clearOverride(id);
        onChange();
        return;
      }
      const destination = destinationFor(world.points, id, startPosition, target);
      if (destination === target) report(id, target);
      else animate(id, target, destination, true);
    },

    acknowledge,

    cancel() {
      spring?.stop();
      spring = null;
      acknowledge();
    },
  };
}
