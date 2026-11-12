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
  settingsOpen: boolean;
  /** The zoom of the map, 1 is 100 %. */
  zoom: number;
  /** In the free view, points and paths can be moved in every direction. */
  freeMove: boolean;
};

export type MenuActions = {
  changeLevel: (level: ViewLevel | null) => void;
  reroll: () => void;
  toggleFreeMove: () => void;
  changeMode: (mode: DemoMode) => void;
  toggleSettings: () => void;
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
    { id: 'free', label: 'Free', glyph: '∞', active: level === null, onClick: () => actions.changeLevel(null) },
    ...levels.map((option) => ({
      id: option.level,
      label: option.label,
      glyph: LEVEL_GLYPHS[option.level],
      active: level === option.level,
      onClick: () => actions.changeLevel(option.level),
    })),
  ],
});

const mapGroup = ({ zoom }: MenuState, actions: MenuActions): PanelGroup => ({
  id: 'map',
  label: `Map · ${Math.round(zoom * 100)} %`,
  tiles: [
    { id: 'zoom-in', label: 'Zoom in', glyph: '+', onClick: () => actions.zoomBy(ZOOM_STEP) },
    { id: 'zoom-out', label: 'Zoom out', glyph: '−', onClick: () => actions.zoomBy(1 / ZOOM_STEP) },
    { id: 'fit', label: 'Fit', title: 'Show everything (key E)', glyph: '⤢', onClick: actions.fit },
    {
      id: 'center',
      label: 'Center',
      title: 'Put the content in the middle (key M)',
      glyph: '◎',
      onClick: actions.center,
    },
    {
      id: 'rotate-left',
      label: 'Turn left',
      title: 'Turn the direction of time a quarter to the left',
      glyph: '↺',
      onClick: () => actions.rotate('left'),
    },
    {
      id: 'rotate-right',
      label: 'Turn right',
      title: 'Turn the direction of time a quarter to the right',
      glyph: '↻',
      onClick: () => actions.rotate('right'),
    },
  ],
});

const layoutGroup = ({ mode, level, freeMove }: MenuState, actions: MenuActions): PanelGroup => ({
  id: 'work',
  label: 'Layout',
  tiles:
    mode === 'edit'
      ? [
          {
            id: 'reroll',
            label: 'Reset',
            title: 'Forget the heights you set in this view',
            glyph: '⟳',
            disabled: level === null,
            onClick: actions.reroll,
          },
          {
            id: 'free-move',
            label: 'Move',
            title: 'Move points and paths freely in the free view, without the time axis',
            glyph: '✥',
            active: freeMove,
            disabled: level !== null,
            onClick: actions.toggleFreeMove,
          },
        ]
      : [],
});

const modeGroup = ({ mode, settingsOpen }: MenuState, actions: MenuActions): PanelGroup => ({
  id: 'mode',
  label: 'Mode',
  tiles: [
    { id: 'editor', label: 'Editor', glyph: '✎', active: mode === 'edit', onClick: () => actions.changeMode('edit') },
    { id: 'map-mode', label: 'Map', glyph: '◉', active: mode === 'map', onClick: () => actions.changeMode('map') },
    ...(mode === 'edit'
      ? [{ id: 'settings', label: 'Settings', glyph: '⚙', active: settingsOpen, onClick: actions.toggleSettings }]
      : []),
  ],
});

/** The groups of tiles in the demo's menu. Groups without tiles are left out. */
export function menuGroups(state: MenuState, actions: MenuActions): PanelGroup[] {
  return [viewGroup, mapGroup, layoutGroup, modeGroup]
    .map((build) => build(state, actions))
    .filter((group) => group.tiles.length > 0);
}
