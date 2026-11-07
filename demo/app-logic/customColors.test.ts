import { describe, expect, it } from 'vitest';
import { rememberColor } from './customColors';

describe('Custom colors', () => {
  describe('when a color is chosen', () => {
    it('puts it first', () => {
      expect(rememberColor(['#111111'], '#222222')).toEqual(['#222222', '#111111']);
    });

    it('moves a color that is already known to the front instead of repeating it', () => {
      expect(rememberColor(['#111111', '#222222'], '#222222')).toEqual(['#222222', '#111111']);
    });

    it('drops the oldest when the slots are full', () => {
      expect(rememberColor(['#111111', '#222222'], '#333333', 2)).toEqual(['#333333', '#111111']);
    });
  });
});
