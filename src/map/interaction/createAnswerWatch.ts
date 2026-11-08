import type { Position } from '../../core/types.js';

/** A move that was reported to the app and waits for its answer. */
export type PendingMove = { id: string; original: Position; rest: Position };

export type AnswerWatch = {
  /** Starts waiting. A move still waiting is dropped, not reported as ignored. */
  expect(pending: PendingMove): void;
  /** The app answered, or the wait is over for another reason. */
  acknowledge(): void;
};

/** Waits a short time for the app to answer a reported move with new data. If it does not, `onIgnored` is called. */
export function createAnswerWatch(timeoutMs: number, onIgnored: (pending: PendingMove) => void): AnswerWatch {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const acknowledge = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return {
    acknowledge,
    expect(pending) {
      acknowledge();
      timer = setTimeout(() => {
        timer = null;
        onIgnored(pending);
      }, timeoutMs);
    },
  };
}
