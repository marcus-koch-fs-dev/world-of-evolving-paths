import { describe, expect, it, vi } from 'vitest';
import type { StorePath } from 'world-of-evolving-paths';
import { useCheckIn } from './useCheckIn';

const TODAY = '2026-11-10';
const gym: StorePath = { id: 'gym', name: 'Gym', color: '#3a86ff', branches: [], checkIns: [] };
const gymToday: StorePath = { ...gym, checkIns: [TODAY] };

describe('useCheckIn', () => {
  describe('when a path is tapped', () => {
    it('checks it in today and says what that did', () => {
      const dispatch = vi.fn();
      const onNotice = vi.fn();

      useCheckIn([gym], TODAY, dispatch, onNotice).onCheckIn('gym');

      expect(dispatch).toHaveBeenCalledWith({ type: 'checkIn', pathId: 'gym', date: TODAY });
      expect(onNotice).toHaveBeenCalledTimes(1);
      expect(onNotice.mock.calls[0][0]).toContain('Gym');
    });
  });

  describe('when the path is already checked in today', () => {
    it('takes the check-in back', () => {
      const dispatch = vi.fn();
      const onNotice = vi.fn();

      useCheckIn([gymToday], TODAY, dispatch, onNotice).onCheckIn('gym');

      expect(dispatch).toHaveBeenCalledWith({ type: 'undoCheckIn', pathId: 'gym', date: TODAY });
      expect(onNotice).toHaveBeenCalledWith('Gym: check-in taken back.');
    });
  });

  describe('when the path is not there', () => {
    it('does nothing', () => {
      const dispatch = vi.fn();
      const onNotice = vi.fn();

      useCheckIn([gym], TODAY, dispatch, onNotice).onCheckIn('missing');

      expect(dispatch).not.toHaveBeenCalled();
      expect(onNotice).not.toHaveBeenCalled();
    });
  });
});
