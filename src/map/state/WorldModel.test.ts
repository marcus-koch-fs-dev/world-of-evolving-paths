import { describe, expect, it, vi } from 'vitest';
import { editPoint, makePeriodData } from '../../../tests/fixtures';
import { periodOf } from '../../core/calendar';
import { WorldModel } from './WorldModel';

const view = periodOf('week', '2026-11-04').key;
const config = (periods: Record<string, unknown>, overrides: { seed?: number } = {}) => ({
  periods: periods as Parameters<WorldModel['configure']>[0]['periods'],
  view,
  seed: overrides.seed ?? 1,
  today: '2026-11-07',
});

describe('World model', () => {
  describe('when configured with valid data', () => {
    it('places every point', () => {
      const model = new WorldModel(vi.fn());

      model.configure(config({ [view]: makePeriodData() }));

      expect(model.world()?.points).toHaveLength(5);
    });

    it('reports a change only the first time', () => {
      const model = new WorldModel(vi.fn());
      const periods = { [view]: makePeriodData() };

      const first = model.configure(config(periods));
      const second = model.configure(config(periods));

      expect(first.changed).toBe(true);
      expect(second.changed).toBe(false);
    });

    it('recomputes when the seed changes', () => {
      const model = new WorldModel(vi.fn());
      const periods = { [view]: makePeriodData() };
      model.configure(config(periods, { seed: 1 }));
      const before = model.world();

      model.configure(config(periods, { seed: 2 }));

      expect(model.world()).not.toBe(before);
    });
  });

  describe('when the data is invalid', () => {
    it('reports the errors and shows nothing', () => {
      const onError = vi.fn();
      const model = new WorldModel(onError);
      const broken = editPoint(makePeriodData(), 'c1', { date: 'yesterday' });

      model.configure(config({ [view]: broken }));

      expect(onError).toHaveBeenCalledOnce();
      expect(model.world()).toBeNull();
    });
  });

  describe('when there is no data for the view', () => {
    it('shows an empty map without an error', () => {
      const onError = vi.fn();
      const model = new WorldModel(onError);

      model.configure(config({}));

      expect(model.world()).toBeNull();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when a point is moved', () => {
    it('shows it at the new position while the data stays', () => {
      const model = new WorldModel(vi.fn());
      model.configure(config({ [view]: makePeriodData() }));

      model.setOverride('c1', { x: 10, y: 20 });

      expect(model.positionOf('c1')).toEqual({ x: 10, y: 20 });
    });

    it('forgets the move once the app passes new data', () => {
      const model = new WorldModel(vi.fn());
      model.configure(config({ [view]: makePeriodData() }));
      const original = model.positionOf('c1');
      model.setOverride('c1', { x: 10, y: 20 });

      model.configure(config({ [view]: makePeriodData() }));

      expect(model.positionOf('c1')).toEqual(original);
    });
  });
});
