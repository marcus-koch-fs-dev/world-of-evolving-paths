import type { Position } from '../../core/types.js';
import type { WorldModel } from '../state/createWorldModel.js';
import { createAnswerWatch } from './createAnswerWatch.js';
import { createSpringRunner } from './createSpringRunner.js';

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

const isClick = (start: Position, end: Position) => Math.hypot(end.x - start.x, end.y - start.y) < MOVED_THRESHOLD;

/**
 * Moves one point while it is dragged and reports where it came to rest.
 * After a move is reported the app owns the data: if it does not answer with a new store, the point returns.
 */
export function createPointDragger({ model, onChange, onMoved }: Dependencies): PointDragger {
  let startPosition: Position = { x: 0, y: 0 };
  const springs = createSpringRunner();
  const watch = createAnswerWatch(IGNORED_AFTER_MS, (ignored) => {
    // The app ignored the move: the point goes back to where it was
    springTo(ignored.id, ignored.rest, ignored.original, false);
  });

  const move = (id: string, position: Position) => {
    model.setOverride(id, position);
    onChange();
  };

  /** Tells the app where the point rests and waits for its answer. */
  const report = (id: string, position: Position) => {
    // Armed before the callback runs, so an answer that comes back at once is still noticed
    watch.expect({ id, original: startPosition, rest: position });
    onMoved(id, position);
  };

  const springTo = (id: string, from: Position, to: Position, reportsMove: boolean) => {
    springs.run({
      id,
      from,
      to,
      reportsMove,
      onFrame: (position) => move(id, position),
      onArrive() {
        if (reportsMove) return report(id, to);
        model.clearOverride(id);
        onChange();
      },
    });
  };

  /** A running spring ends at once: the point jumps to where it was heading and the move is reported. */
  const finishSpring = () => {
    const finished = springs.finish();
    if (!finished) return;
    move(finished.id, finished.destination);
    if (finished.reportsMove) report(finished.id, finished.destination);
  };

  return {
    start(id) {
      finishSpring();
      watch.acknowledge();
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
      report(id, target);
    },

    acknowledge: watch.acknowledge,

    cancel() {
      springs.cancel();
      watch.acknowledge();
    },
  };
}
