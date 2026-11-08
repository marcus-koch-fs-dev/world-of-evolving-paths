import type { ViewLevel } from 'world-of-evolving-paths';
import { TilePanel, useCameraZoom, usePathWorldHandle } from 'world-of-evolving-paths/react';
import { type DemoMode, menuGroups } from '../app-logic/menuGroups';

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

  const groups = menuGroups(
    { levels: props.levels, level: props.level, mode: props.mode, settingsOpen: props.settingsOpen, zoom },
    {
      changeLevel: props.onLevelChange,
      reroll: props.onReroll,
      changeMode: props.onModeChange,
      toggleSettings: props.onSettingsToggle,
      zoomBy: handle.zoomBy,
      fit: handle.fit,
      center: handle.center,
    },
  );

  return <TilePanel groups={groups} label="Menu" />;
}
