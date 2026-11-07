import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makePeriodData } from '../../../tests/fixtures';
import { periodOf } from '../../core/calendar';
import { layoutOf, nearestFree } from '../../core/collision';
import { createWorldModel, type WorldModel } from '../state/createWorldModel';
import { createPointDragger } from './createPointDragger';

const view = periodOf('week', '2026-11-04').key;
const FRAME_MS = 16;

function setup() {
  const model = createWorldModel(vi.fn());
  model.configure({ periods: { [view]: makePeriodData() }, view, seed: 1, today: '2026-11-07' });
  const onChange = vi.fn();
  const onMoved = vi.fn();
  const dragger = createPointDragger({ model, onChange, onMoved });
  return { model, dragger, onChange, onMoved };
}

/** A spot well away from the point where it may rest: free of other points and of the lines it would draw. */
function freeSpotFor(model: WorldModel, id: string) {
  const points = model.world()?.points ?? [];
  const start = model.positionOf(id);
  return nearestFree(layoutOf(points), { id, kind: 'milestone' }, { x: start.x, y: start.y + 150 });
}

describe('Point dragger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) =>
      setTimeout(() => callback(performance.now()), FRAME_MS),
    );
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => clearTimeout(handle));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('when a point is only clicked', () => {
    it('leaves it where it was and reports nothing', () => {
      const { model, dragger, onMoved } = setup();
      const before = model.positionOf('c2');

      dragger.start('c2');
      dragger.move('c2', { x: before.x + 1, y: before.y });
      dragger.end('c2');

      expect(model.positionOf('c2')).toEqual(before);
      expect(onMoved).not.toHaveBeenCalled();
    });
  });

  describe('when a point is dropped on a free spot', () => {
    it('reports the move once', () => {
      const { model, dragger, onMoved } = setup();

      const spot = freeSpotFor(model, 'c2');
      dragger.start('c2');
      dragger.move('c2', spot);
      dragger.end('c2');

      expect(onMoved).toHaveBeenCalledOnce();
      expect(onMoved).toHaveBeenCalledWith('c2', spot);
    });

    it('stays there when the app answers with new data', () => {
      const { model, dragger } = setup();
      const spot = freeSpotFor(model, 'c2');
      dragger.start('c2');
      dragger.move('c2', spot);
      dragger.end('c2');

      dragger.acknowledge();
      vi.advanceTimersByTime(1000);

      expect(model.positionOf('c2')).toEqual(spot);
    });

    it('goes back when the app ignores the move', () => {
      const { model, dragger } = setup();
      const before = model.positionOf('c2');
      dragger.start('c2');
      dragger.move('c2', freeSpotFor(model, 'c2'));
      dragger.end('c2');

      vi.advanceTimersByTime(1000);

      expect(model.positionOf('c2')).toEqual(before);
    });
  });

  describe('when a point is dropped on a taken spot', () => {
    it('springs to a free spot and reports that spot', () => {
      const { model, dragger, onMoved } = setup();
      const taken = model.positionOf('c3');
      dragger.start('c2');
      dragger.move('c2', taken);

      dragger.end('c2');
      vi.advanceTimersByTime(300);

      const [, rest] = onMoved.mock.calls[0];
      expect(rest).not.toEqual(taken);
      expect(model.positionOf('c2')).toEqual(rest);
    });

    it('reports nothing when the view changes during the spring', () => {
      const { model, dragger, onMoved } = setup();
      dragger.start('c2');
      dragger.move('c2', model.positionOf('c3'));
      dragger.end('c2');

      dragger.cancel();
      vi.advanceTimersByTime(500);

      expect(onMoved).not.toHaveBeenCalled();
    });

    it('finishes the spring and reports it when another point is grabbed', () => {
      const { model, dragger, onMoved } = setup();
      dragger.start('c2');
      dragger.move('c2', model.positionOf('c3'));
      dragger.end('c2');

      dragger.start('m1');

      expect(onMoved).toHaveBeenCalledOnce();
      expect(onMoved.mock.calls[0][0]).toBe('c2');
    });
  });

  describe('when the point is not in the view any more', () => {
    it('ignores the release', () => {
      const { dragger, onMoved } = setup();
      dragger.start('c2');

      dragger.end('gone');

      expect(onMoved).not.toHaveBeenCalled();
    });
  });
});
