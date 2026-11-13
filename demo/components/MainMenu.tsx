import { type Orientation, rotateDirection, type ViewLevel } from 'world-of-evolving-paths';
import { TilePanel, useCameraZoom, usePathWorldHandle } from 'world-of-evolving-paths/react';
import { type DemoMode, menuGroups } from '../app-logic/menuGroups';
import type { ViewNavigation } from '../hooks/useViewNavigation';
import type { UndoRedoProps } from './UndoRedo';

type Props = {
  levels: readonly { level: ViewLevel; label: string }[];
  navigation: ViewNavigation;
  pathsPerPage: number;
  pathCount: number;
  onPathsPerPageChange: (count: number) => void;
  undoRedo: UndoRedoProps;
  onReroll: () => void;
  onOrientationChange: (orientation: Orientation) => void;
  mode: DemoMode;
  onOpenSettings: () => void;
  /** The tiles show their names under the symbols. */
  tileLabels: boolean;
  closeOnSelect: boolean;
};

/** The demo's menu: every control of the map as a tile, one step away behind one button. */
export function MainMenu(props: Props) {
  const handle = usePathWorldHandle();
  const zoom = useCameraZoom(handle);
  const { navigation, undoRedo } = props;

  const groups = menuGroups(
    {
      levels: props.levels,
      level: navigation.level,
      mode: props.mode,
      zoom,
      canGoBack: navigation.canGoBack,
      canUndo: undoRedo.canUndo,
      canRedo: undoRedo.canRedo,
      pathsPerPage: props.pathsPerPage,
      pathCount: props.pathCount,
    },
    {
      changeLevel: navigation.chooseLevel,
      previous: () => navigation.move(-1),
      next: () => navigation.move(1),
      today: navigation.goToToday,
      back: navigation.back,
      undo: undoRedo.onUndo,
      redo: undoRedo.onRedo,
      changePathsPerPage: props.onPathsPerPageChange,
      reroll: props.onReroll,
      openSettings: props.onOpenSettings,
      zoomBy: handle.zoomBy,
      fit: handle.fit,
      center: handle.center,
      rotate: (turn) => props.onOrientationChange(rotateDirection(handle.getDirection(), turn)),
    },
  );

  return <TilePanel groups={groups} label="Menu" labels={props.tileLabels} closeOnSelect={props.closeOnSelect} />;
}
