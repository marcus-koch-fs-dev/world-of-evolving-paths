import type { Position } from '../../core/types.js';
import { springBack } from './springBack.js';

/** A spring that is running, with where it is heading and whether the app is told when it arrives. */
export type RunningSpring = { id: string; destination: Position; reportsMove: boolean };

type Run = RunningSpring & { stop: () => void };

type Movement = {
  id: string;
  from: Position;
  to: Position;
  reportsMove: boolean;
  onFrame: (position: Position) => void;
  onArrive: () => void;
};

export type SpringRunner = {
  /** Moves a point from one position to another. Another spring that is running is stopped without arriving. */
  run(movement: Movement): void;
  /** Stops a running spring at once and says where it was heading, or null when none runs. */
  finish(): RunningSpring | null;
  cancel(): void;
};

/** Runs at most one spring-back animation at a time. */
export function createSpringRunner(): SpringRunner {
  let running: Run | null = null;

  const cancel = () => {
    running?.stop();
    running = null;
  };

  return {
    cancel,

    run({ id, from, to, reportsMove, onFrame, onArrive }) {
      cancel();
      const stop = springBack(from, to, onFrame, () => {
        running = null;
        onArrive();
      });
      running = { stop, id, destination: to, reportsMove };
    },

    finish() {
      const spring = running;
      if (!spring) return null;
      cancel();
      return { id: spring.id, destination: spring.destination, reportsMove: spring.reportsMove };
    },
  };
}
