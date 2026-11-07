import type { ViewLevel } from 'world-of-evolving-paths';
import { type PanelGroup, TilePanel, useCameraZoom, usePathWorldHandle } from 'world-of-evolving-paths/react';

export type DemoMode = 'edit' | 'map';

const ZOOM_STEP = 1.25;
// A short sign for each level on its tile
const LEVEL_GLYPHS: Record<ViewLevel, string> = { day: 'D', week: 'W', month: 'M', halfYear: 'H', year: 'Y' };

type Props = {
  levels: readonly { level: ViewLevel; label: string }[];
  level: ViewLevel | null;
  onLevelChange: (level: ViewLevel | null) => void;
  onReroll: () => void;
  mode: DemoMode;
  onModeChange: (mode: DemoMode) => void;
  settingsOpen: boolean;
  onSettingsToggle: () => void;
};

/** The demo's menu: every control of the map as a tile, one step away behind one button. */
export function MainMenu(props: Props) {
  const handle = usePathWorldHandle();
  const zoom = useCameraZoom(handle);
  const editing = props.mode === 'edit';

  const groups: PanelGroup[] = [
    {
      id: 'view',
      label: 'View',
      tiles: [
        {
          id: 'free',
          label: 'Free',
          glyph: '∞',
          active: props.level === null,
          onClick: () => props.onLevelChange(null),
        },
        ...props.levels.map((option) => ({
          id: option.level,
          label: option.label,
          glyph: LEVEL_GLYPHS[option.level],
          active: props.level === option.level,
          onClick: () => props.onLevelChange(option.level),
        })),
      ],
    },
    {
      id: 'map',
      label: `Map · ${Math.round(zoom * 100)} %`,
      tiles: [
        { id: 'zoom-in', label: 'Zoom in', glyph: '+', onClick: () => handle.zoomBy(ZOOM_STEP) },
        { id: 'zoom-out', label: 'Zoom out', glyph: '−', onClick: () => handle.zoomBy(1 / ZOOM_STEP) },
        { id: 'fit', label: 'Fit', title: 'Show everything (key E)', glyph: '⤢', onClick: () => handle.fit() },
        {
          id: 'center',
          label: 'Center',
          title: 'Put the content in the middle (key M)',
          glyph: '◎',
          onClick: () => handle.center(),
        },
      ],
    },
    {
      id: 'work',
      label: 'Layout',
      tiles: [
        ...(editing
          ? [
              {
                id: 'reroll',
                label: 'Reroll',
                title: 'Generate another layout',
                glyph: '⟳',
                disabled: props.level === null,
                onClick: props.onReroll,
              },
            ]
          : []),
      ],
    },
    {
      id: 'mode',
      label: 'Mode',
      tiles: [
        { id: 'editor', label: 'Editor', glyph: '✎', active: editing, onClick: () => props.onModeChange('edit') },
        { id: 'map-mode', label: 'Map', glyph: '◉', active: !editing, onClick: () => props.onModeChange('map') },
        ...(editing
          ? [
              {
                id: 'settings',
                label: 'Settings',
                glyph: '⚙',
                active: props.settingsOpen,
                onClick: props.onSettingsToggle,
              },
            ]
          : []),
      ],
    },
  ];

  return <TilePanel groups={groups.filter((group) => group.tiles.length > 0)} label="Menu" />;
}
