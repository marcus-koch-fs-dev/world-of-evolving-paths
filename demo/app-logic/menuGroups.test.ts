import { describe, expect, it, vi } from 'vitest';
import { type MenuActions, type MenuState, menuGroups, ZOOM_STEP } from './menuGroups';

const state: MenuState = {
  levels: [
    { level: 'week', label: 'Week' },
    { level: 'month', label: 'Month' },
  ],
  level: 'week',
  mode: 'edit',
  settingsOpen: false,
  zoom: 0.5,
  freeMove: false,
};

const createActions = (): MenuActions => ({
  changeLevel: vi.fn(),
  reroll: vi.fn(),
  toggleFreeMove: vi.fn(),
  changeMode: vi.fn(),
  toggleSettings: vi.fn(),
  zoomBy: vi.fn(),
  fit: vi.fn(),
  center: vi.fn(),
  rotate: vi.fn(),
});

const tileIds = (groupId: string, current: MenuState) =>
  menuGroups(current, createActions())
    .find((group) => group.id === groupId)
    ?.tiles.map((tile) => tile.id);

describe('Menu groups', () => {
  describe('when editing', () => {
    it('offers reroll and settings', () => {
      expect(tileIds('work', state)).toEqual(['reroll', 'free-move']);
      expect(tileIds('mode', state)).toContain('settings');
    });
  });

  describe('when in map mode', () => {
    it('leaves out the layout group and the settings tile', () => {
      const mapMode = { ...state, mode: 'map' as const };

      expect(tileIds('work', mapMode)).toBeUndefined();
      expect(tileIds('mode', mapMode)).not.toContain('settings');
    });
  });

  describe('when the free view is shown', () => {
    it('marks Free active, disables reroll and offers the free move', () => {
      const groups = menuGroups({ ...state, level: null }, createActions());

      const free = groups[0].tiles.find((tile) => tile.id === 'free');
      const work = groups.find((group) => group.id === 'work')?.tiles;
      const reroll = work?.find((tile) => tile.id === 'reroll');
      const freeMove = work?.find((tile) => tile.id === 'free-move');
      expect(free?.active).toBe(true);
      expect(reroll?.disabled).toBe(true);
      expect(freeMove?.disabled).toBe(false);
    });
  });

  describe('when a tile is clicked', () => {
    it('shows the zoom in percent and calls the matching action', () => {
      const actions = createActions();
      const groups = menuGroups(state, actions);

      groups[1].tiles[0].onClick();
      groups[0].tiles[2].onClick();

      expect(groups[1].label).toBe('Map · 50 %');
      expect(actions.zoomBy).toHaveBeenCalledWith(ZOOM_STEP);
      expect(actions.changeLevel).toHaveBeenCalledWith('month');
    });
  });
});

describe('Rotate tiles', () => {
  describe('when a rotate tile is clicked', () => {
    it('turns the direction to its side', () => {
      const actions = createActions();
      const mapTiles = menuGroups(state, actions).find((group) => group.id === 'map')?.tiles ?? [];

      mapTiles.find((tile) => tile.id === 'rotate-left')?.onClick();
      mapTiles.find((tile) => tile.id === 'rotate-right')?.onClick();

      expect(actions.rotate).toHaveBeenNthCalledWith(1, 'left');
      expect(actions.rotate).toHaveBeenNthCalledWith(2, 'right');
    });
  });
});
