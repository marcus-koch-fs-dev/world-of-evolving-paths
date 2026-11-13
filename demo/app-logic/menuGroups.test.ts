import { describe, expect, it, vi } from 'vitest';
import { type MenuActions, type MenuState, menuGroups, ZOOM_STEP } from './menuGroups';

const state: MenuState = {
  levels: [
    { level: 'week', label: 'Week' },
    { level: 'month', label: 'Month' },
  ],
  level: 'week',
  mode: 'edit',
  panel: null,
  zoom: 0.5,
  canGoBack: false,
  canUndo: true,
  canRedo: false,
  pathsPerPage: 2,
  pathCount: 4,
};

const createActions = (): MenuActions => ({
  changeLevel: vi.fn(),
  previous: vi.fn(),
  next: vi.fn(),
  today: vi.fn(),
  back: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  changePathsPerPage: vi.fn(),
  reroll: vi.fn(),
  togglePanel: vi.fn(),
  zoomBy: vi.fn(),
  fit: vi.fn(),
  center: vi.fn(),
  rotate: vi.fn(),
});

const tilesOf = (groupId: string, current: MenuState, actions = createActions()) =>
  menuGroups(current, actions).find((group) => group.id === groupId)?.tiles;

const tileIds = (groupId: string, current: MenuState) => tilesOf(groupId, current)?.map((tile) => tile.id);

describe('Menu groups', () => {
  describe('when editing', () => {
    it('offers undo, redo and reset, and both settings', () => {
      expect(tileIds('edit', state)).toEqual(['undo', 'redo', 'reroll']);
      expect(tileIds('settings', state)).toEqual(['view-settings', 'editor-settings']);
    });
  });

  describe('when in map mode', () => {
    it('leaves out the edit group and the editor settings, but keeps the view settings', () => {
      const mapMode = { ...state, mode: 'map' as const };

      expect(tileIds('edit', mapMode)).toBeUndefined();
      expect(tileIds('settings', mapMode)).toEqual(['view-settings']);
    });
  });

  describe('when the free view is shown', () => {
    it('marks All active and disables what needs a period', () => {
      const free = { ...state, level: null };

      expect(tilesOf('view', free)?.find((tile) => tile.id === 'free')?.active).toBe(true);
      expect(tilesOf('edit', free)?.find((tile) => tile.id === 'reroll')?.disabled).toBe(true);
      expect(
        tilesOf('time', free)
          ?.filter((tile) => tile.disabled)
          .map((tile) => tile.id),
      ).toEqual(['previous', 'next', 'today', 'back']);
    });
  });

  describe('when a tile is clicked', () => {
    it('shows the zoom in percent and calls the matching action', () => {
      const actions = createActions();
      const groups = menuGroups(state, actions);

      groups.find((group) => group.id === 'map')?.tiles[0].onClick();
      groups[0].tiles[2].onClick();

      expect(groups.find((group) => group.id === 'map')?.label).toBe('Map · 50 %');
      expect(actions.zoomBy).toHaveBeenCalledWith(ZOOM_STEP);
      expect(actions.changeLevel).toHaveBeenCalledWith('month');
    });

    it('changes the paths per page by one, within the number of paths', () => {
      const actions = createActions();
      const tiles = tilesOf('paths', state, actions) ?? [];

      tiles.find((tile) => tile.id === 'more-paths')?.onClick();
      tiles.find((tile) => tile.id === 'fewer-paths')?.onClick();

      expect(actions.changePathsPerPage).toHaveBeenNthCalledWith(1, 3);
      expect(actions.changePathsPerPage).toHaveBeenNthCalledWith(2, 1);
      expect(tilesOf('paths', { ...state, pathsPerPage: 4 })?.find((tile) => tile.id === 'more-paths')?.disabled).toBe(
        true,
      );
      expect(tilesOf('paths', { ...state, pathsPerPage: 1 })?.find((tile) => tile.id === 'fewer-paths')?.disabled).toBe(
        true,
      );
    });

    it('opens the settings panel of its tile', () => {
      const actions = createActions();
      const tiles = tilesOf('settings', state, actions) ?? [];

      tiles.find((tile) => tile.id === 'view-settings')?.onClick();
      tiles.find((tile) => tile.id === 'editor-settings')?.onClick();

      expect(actions.togglePanel).toHaveBeenNthCalledWith(1, 'view');
      expect(actions.togglePanel).toHaveBeenNthCalledWith(2, 'editor');
    });
  });
});

describe('Rotate tiles', () => {
  describe('when a rotate tile is clicked', () => {
    it('turns the direction to its side', () => {
      const actions = createActions();
      const mapTiles = tilesOf('map', state, actions) ?? [];

      mapTiles.find((tile) => tile.id === 'rotate-left')?.onClick();
      mapTiles.find((tile) => tile.id === 'rotate-right')?.onClick();

      expect(actions.rotate).toHaveBeenNthCalledWith(1, 'left');
      expect(actions.rotate).toHaveBeenNthCalledWith(2, 'right');
    });
  });
});
