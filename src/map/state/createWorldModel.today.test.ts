import { describe, expect, it, vi } from 'vitest';
import { makePeriodData } from '../../../tests/fixtures.js';
import { periodOf } from '../../core/calendar.js';
import { createWorldModel } from './createWorldModel.js';

const view = periodOf('week', '2026-11-04').key;

describe('World model and today', () => {
  describe('when only today changes', () => {
    it('keeps the positions and reports no new layout', () => {
      const model = createWorldModel(vi.fn());
      const periods = { [view]: makePeriodData() };
      model.configure({ periods, view, seed: 1, today: '2026-11-03' });
      const before = model.positionOf('c2');

      const result = model.configure({ periods, view, seed: 1, today: '2026-11-06' });

      expect(result).toEqual({ changed: true, viewChanged: false, dataChanged: false, layoutChanged: false });
      expect(model.positionOf('c2')).toEqual(before);
      expect(model.world()?.today).toBe('2026-11-06');
    });
  });
});
