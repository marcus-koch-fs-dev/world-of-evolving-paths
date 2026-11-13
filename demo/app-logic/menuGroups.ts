import type { ViewLevel } from 'world-of-evolving-paths';
import type { PanelGroup } from 'world-of-evolving-paths/react';

export type DemoMode = 'edit' | 'map';

export const ZOOM_STEP = 1.25;
// A short sign for each level on its tile
const LEVEL_GLYPHS: Record<ViewLevel, string> = { week: 'W', month: 'M', year: 'Y' };

export type MenuState = {
  /** The levels the menu offers. */
  levels: readonly { level: ViewLevel; label: string }[];
  /** The level shown, or null for the free view. */
  level: ViewLevel | null;
  mode: DemoMode;
  /** The zoom of the map, 1 is 100 %. */
  zoom: number;
  canGoBack: boolean;
  canUndo: boolean;
  canRedo: boolean;
  pathsPerPage: number;
  pathCount: number;
};

export type MenuActions = {
  changeLevel: (level: ViewLevel | null) => void;
  previous: () => void;
  next: () => void;
  today: () => void;
  back: () => void;
  undo: () => void;
  redo: () => void;
  changePathsPerPage: (count: number) => void;
  reroll: () => void;
  openSettings: () => void;
  zoomBy: (factor: number) => void;
  fit: () => void;
  center: () => void;
  /** Turns the direction of time a quarter to the left or to the right. */
  rotate: (turn: 'left' | 'right') => void;
};

const viewGroup = ({ levels, level }: MenuState, actions: MenuActions): PanelGroup => ({
  id: 'view',
  label: 'View',
  tiles: [
    { id: 'free', label: 'All', icon: 'free', active: level === null, onClick: () => actions.changeLevel(null) },
    ...levels.map((option) => ({
      id: option.level,
      label: option.label,
      glyph: LEVEL_GLYPHS[option.level],
      active: level === option.level,
      onClick: () => actions.changeLevel(option.level),
    })),
  ],
});

const timeGroup = ({ level, canGoBack }: MenuState, actions: MenuActions): PanelGroup => ({
  id: 'time',
  label: 'Time',
  tiles: [
    { id: 'previous', label: 'Previous', icon: 'previous', disabled: level === null, onClick: actions.previous },
    { id: 'next', label: 'Next', icon: 'next', disabled: level === null, onClick: actions.next },
    { id: 'today', label: 'Today', icon: 'today', disabled: level === null, onClick: actions.today },
    {
      id: 'back',
      label: 'Back',
      title: 'Back to the view before the last double-click',
      icon: 'back',
      disabled: !canGoBack,
      onClick: actions.back,
    },
  ],
});

const pathsGroup = ({ pathsPerPage, pathCount }: MenuState, actions: MenuActions): PanelGroup => ({
  id: 'paths',
  label: `Paths per page · ${pathsPerPage}`,
  tiles: [
    {
      id: 'fewer-paths',
      label: 'Fewer',
      icon: 'minus',
      disabled: pathsPerPage <= 1,
      onClick: () => actions.changePathsPerPage(pathsPerPage - 1),
    },
    {
      id: 'more-paths',
      label: 'More',
      icon: 'plus',
      disabled: pathsPerPage >= pathCount,
      onClick: () => actions.changePathsPerPage(pathsPerPage + 1),
    },
  ],
});

const mapGroup = ({ zoom }: MenuState, actions: MenuActions): PanelGroup => ({
  id: 'map',
  label: `Map · ${Math.round(zoom * 100)} %`,
  tiles: [
    { id: 'zoom-in', label: 'Zoom in', icon: 'zoomIn', onClick: () => actions.zoomBy(ZOOM_STEP) },
    { id: 'zoom-out', label: 'Zoom out', icon: 'zoomOut', onClick: () => actions.zoomBy(1 / ZOOM_STEP) },
    { id: 'fit', label: 'Fit', title: 'Show everything (key E)', icon: 'fit', onClick: actions.fit },
    {
      id: 'center',
      label: 'Center',
      title: 'Put the content in the middle (key M)',
      icon: 'center',
      onClick: actions.center,
    },
    {
      id: 'rotate-left',
      label: 'Left',
      title: 'Turn the direction of time a quarter to the left',
      icon: 'turnLeft',
      onClick: () => actions.rotate('left'),
    },
    {
      id: 'rotate-right',
      label: 'Right',
      title: 'Turn the direction of time a quarter to the right',
      icon: 'turnRight',
      onClick: () => actions.rotate('right'),
    },
  ],
});

/** What only the editor does: undo and redo, and forgetting the heights of a view. */
const editGroup = ({ mode, level, canUndo, canRedo }: MenuState, actions: MenuActions): PanelGroup => ({
  id: 'edit',
  label: 'Edit',
  tiles:
    mode === 'edit'
      ? [
          {
            id: 'undo',
            label: 'Undo',
            title: 'Undo (Ctrl+Z)',
            icon: 'undo',
            disabled: !canUndo,
            onClick: actions.undo,
          },
          {
            id: 'redo',
            label: 'Redo',
            title: 'Redo (Ctrl+Y)',
            icon: 'redo',
            disabled: !canRedo,
            onClick: actions.redo,
          },
          {
            id: 'reroll',
            label: 'Reset',
            title: 'Forget the heights you set in this view',
            icon: 'reset',
            disabled: level === null,
            onClick: actions.reroll,
          },
        ]
      : [],
});

/** One tile opens the settings window. What belongs to the editor is a section in that window. */
const settingsGroup = (_state: MenuState, actions: MenuActions): PanelGroup => ({
  id: 'settings',
  label: 'Settings',
  tiles: [
    {
      id: 'settings',
      label: 'Settings',
      title: 'Settings: size, bar, map, background',
      icon: 'settings',
      closesPanel: true,
      onClick: actions.openSettings,
    },
  ],
});

// A hint of color per group, so the keys can be told apart at a glance
const GROUP_TINTS: Record<string, string> = {
  view: '#6f9bff',
  time: '#3fd0c0',
  paths: '#b38cf0',
  map: '#8ccf4a',
  edit: '#f0b050',
  settings: '#ff7aa8',
};

/** The groups of tiles in the demo's menu. Groups without tiles are left out. */
export function menuGroups(state: MenuState, actions: MenuActions): PanelGroup[] {
  return [viewGroup, timeGroup, pathsGroup, mapGroup, editGroup, settingsGroup]
    .map((build) => build(state, actions))
    .filter((group) => group.tiles.length > 0)
    .map((group) => ({ ...group, tint: GROUP_TINTS[group.id] }));
}
