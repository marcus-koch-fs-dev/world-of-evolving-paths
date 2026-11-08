import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAnswerWatch } from './createAnswerWatch.js';

const pending = { id: 'a', original: { x: 0, y: 0 }, rest: { x: 5, y: 5 } };

describe('Answer watch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when nobody answers in time', () => {
    it('reports the move as ignored, once', () => {
      const onIgnored = vi.fn();
      const watch = createAnswerWatch(80, onIgnored);

      watch.expect(pending);
      vi.advanceTimersByTime(200);

      expect(onIgnored).toHaveBeenCalledTimes(1);
      expect(onIgnored).toHaveBeenCalledWith(pending);
    });
  });

  describe('when the app answers in time', () => {
    it('does not report anything', () => {
      const onIgnored = vi.fn();
      const watch = createAnswerWatch(80, onIgnored);

      watch.expect(pending);
      watch.acknowledge();
      vi.advanceTimersByTime(200);

      expect(onIgnored).not.toHaveBeenCalled();
    });
  });

  describe('when a second move is expected before the first timed out', () => {
    it('only the second one can be reported', () => {
      const onIgnored = vi.fn();
      const watch = createAnswerWatch(80, onIgnored);
      const second = { ...pending, id: 'b' };

      watch.expect(pending);
      watch.expect(second);
      vi.advanceTimersByTime(200);

      expect(onIgnored).toHaveBeenCalledTimes(1);
      expect(onIgnored).toHaveBeenCalledWith(second);
    });
  });
});
