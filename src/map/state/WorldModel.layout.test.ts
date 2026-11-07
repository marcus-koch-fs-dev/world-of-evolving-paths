import { describe, expect, it, vi } from 'vitest';
import { editPoint, makePeriodData } from '../../../tests/fixtures';
import { periodOf } from '../../core/calendar';
import { WorldModel } from './WorldModel';

const view = periodOf('week', '2026-11-04').key;
const configure = (model: WorldModel, data: ReturnType<typeof makePeriodData>) =>
  model.configure({ periods: { [view]: data }, view, seed: 1, today: '2026-11-07' });

describe('World model and the layout', () => {
  describe('when the app passes new data that looks the same to the layout', () => {
    it('reuses the layout but shows the new details', () => {
      const model = new WorldModel(vi.fn());
      configure(model, makePeriodData());
      const before = model.positionOf('c2');

      const result = configure(model, editPoint(makePeriodData(), 'c2', { title: 'Renamed', status: 'open' }));

      expect(result).toMatchObject({ dataChanged: true, layoutChanged: false });
      expect(model.positionOf('c2')).toEqual(before);
      expect(model.world()?.points.find((point) => point.id === 'c2')).toMatchObject({
        title: 'Renamed',
        status: 'open',
      });
    });
  });

  describe('when something the layout depends on changes', () => {
    it.each([
      ['date', { date: '2026-11-08' }],
      ['importance', { importance: 5 }],
      ['links', { next: [] }],
      ['pin', { x: 100, y: 100 }],
    ])('lays the points out again for a new %s', (_name, patch) => {
      const model = new WorldModel(vi.fn());
      configure(model, makePeriodData());

      const result = configure(model, editPoint(makePeriodData(), 'c2', patch));

      expect(result.layoutChanged).toBe(true);
    });
  });

  describe('when the app answers a drag with new data', () => {
    it('forgets the dragged position', () => {
      const model = new WorldModel(vi.fn());
      configure(model, makePeriodData());
      const original = model.positionOf('c1');
      model.setOverride('c1', { x: 5, y: 5 });

      configure(model, editPoint(makePeriodData(), 'c1', { title: 'Same layout' }));

      expect(model.positionOf('c1')).toEqual(original);
    });
  });
});
