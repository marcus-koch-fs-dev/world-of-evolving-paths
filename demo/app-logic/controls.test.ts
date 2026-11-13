import { describe, expect, it } from 'vitest';
import {
  BAR_PRESETS,
  barItemsFor,
  barItemsFrom,
  closesMenu,
  layoutOf,
  movedBarItem,
  presetOf,
  toggledBarItems,
  withHiddenKept,
} from './controls';

describe('Controls in the bar', () => {
  describe('closesMenu', () => {
    it('closes on a touch screen only when set to auto', () => {
      expect(closesMenu('auto', true)).toBe(true);
      expect(closesMenu('auto', false)).toBe(false);
    });

    it('follows the choice when it is not auto', () => {
      expect(closesMenu('always', false)).toBe(true);
      expect(closesMenu('never', true)).toBe(false);
    });
  });

  describe('toggledBarItems', () => {
    it('adds an item at the end and leaves the others where they are', () => {
      expect(toggledBarItems(['back', 'levels'], 'paths', true)).toEqual(['back', 'levels', 'paths']);
    });

    it('removes an item and ignores one that is not there', () => {
      expect(toggledBarItems(['levels', 'back'], 'back', false)).toEqual(['levels']);
      expect(toggledBarItems(['levels'], 'back', false)).toEqual(['levels']);
    });
  });

  describe('what only the editor uses', () => {
    it('is left out of the bar items in map mode and kept in the editor', () => {
      expect(barItemsFor(['levels', 'history', 'back'], false)).toEqual(['levels', 'back']);
      expect(barItemsFor(['levels', 'history', 'back'], true)).toEqual(['levels', 'history', 'back']);
    });

    it('stays behind the shown items when they are put in a new order', () => {
      expect(withHiddenKept(['back', 'levels'], ['levels', 'history', 'back'])).toEqual(['back', 'levels', 'history']);
    });
  });

  describe('barItemsFrom', () => {
    it('drops names that do not exist any more and doubles, and keeps the order', () => {
      expect(barItemsFrom(['back', 'zoom', 'levels', 'back'])).toEqual(['back', 'levels']);
    });
  });

  describe('movedBarItem', () => {
    it('swaps an item with its neighbour', () => {
      expect(movedBarItem(['levels', 'paths', 'back'], 'paths', -1)).toEqual(['paths', 'levels', 'back']);
      expect(movedBarItem(['levels', 'paths', 'back'], 'paths', 1)).toEqual(['levels', 'back', 'paths']);
    });

    it('changes nothing at the edge or for an item that is not in the bar', () => {
      expect(movedBarItem(['levels', 'paths'], 'levels', -1)).toEqual(['levels', 'paths']);
      expect(movedBarItem(['levels', 'paths'], 'paths', 1)).toEqual(['levels', 'paths']);
      expect(movedBarItem(['levels'], 'back', 1)).toEqual(['levels']);
    });
  });

  describe('layoutOf', () => {
    it('is a ready-made layout while the bar matches it and both other bars are shown', () => {
      expect(layoutOf([...BAR_PRESETS.bar], true, true)).toBe('bar');
      expect(layoutOf([], true, true)).toBe('tiles');
    });

    it('is customized when the bar is arranged differently', () => {
      expect(layoutOf(['back', 'levels'], true, true)).toBe('customized');
    });

    it('is customized when the time bar or the info is hidden', () => {
      expect(layoutOf([...BAR_PRESETS.bar], false, true)).toBe('customized');
      expect(layoutOf([], true, false)).toBe('customized');
    });
  });

  describe('presetOf', () => {
    it('knows the presets and says null for another order or a mix', () => {
      expect(presetOf([...BAR_PRESETS.bar])).toBe('bar');
      expect(presetOf([])).toBe('tiles');
      expect(presetOf([...BAR_PRESETS.bar].reverse())).toBeNull();
      expect(presetOf(['levels'])).toBeNull();
    });
  });
});
