import type { Orientation, ViewLevel } from 'world-of-evolving-paths';
import { ControlBar, type DockSlot } from 'world-of-evolving-paths/react';
import type { BarItem } from '../app-logic/controls';
import type { DemoMode } from '../app-logic/menuGroups';
import type { ViewNavigation } from '../hooks/useViewNavigation';
import { BarContent } from './BarContent';
import { MainMenu } from './MainMenu';
import type { UndoRedoProps } from './UndoRedo';

type Props = {
  dock: DockSlot;
  onDockChange: (dock: DockSlot) => void;
  navigation: ViewNavigation;
  /** The page shown and how many there are, from the view that was built. */
  paging: { page: number; pages: number };
  /** How many paths one page shows, in every view, and how many paths there are. */
  pathsPerPage: number;
  pathCount: number;
  onPathsPerPageChange: (count: number) => void;
  locale: string;
  /** The levels the view bar offers. */
  levels: readonly { level: ViewLevel; label: string }[];
  /** The controls that also sit in the bar. All of them are tiles in the menu. */
  barItems: readonly BarItem[];
  closeMenuOnSelect: boolean;
  /** The overview is arranged by hand when this is false. */
  locked: boolean;
  onLockToggle: () => void;
  onReroll: () => void;
  onOrientationChange: (orientation: Orientation) => void;
  mode: DemoMode;
  onOpenSettings: () => void;
  tileLabels: boolean;
  undoRedo: UndoRedoProps;
};

/** The main bar: where in time the map is, and the menu with everything else. */
export function TopBar({
  dock,
  onDockChange,
  navigation,
  paging,
  pathsPerPage,
  pathCount,
  onPathsPerPageChange,
  locale,
  levels,
  barItems,
  closeMenuOnSelect,
  locked,
  onLockToggle,
  onReroll,
  onOrientationChange,
  mode,
  onOpenSettings,
  tileLabels,
  undoRedo,
}: Props) {
  return (
    <ControlBar dock={dock} onDockChange={onDockChange}>
      <BarContent
        navigation={navigation}
        paging={paging}
        pathsPerPage={pathsPerPage}
        pathCount={pathCount}
        onPathsPerPageChange={onPathsPerPageChange}
        locale={locale}
        levels={levels}
        barItems={barItems}
        locked={locked}
        onLockToggle={onLockToggle}
        mode={mode}
        undoRedo={undoRedo}
      />
      <MainMenu
        levels={levels}
        navigation={navigation}
        pathsPerPage={pathsPerPage}
        pathCount={pathCount}
        onPathsPerPageChange={onPathsPerPageChange}
        undoRedo={undoRedo}
        onReroll={onReroll}
        onOrientationChange={onOrientationChange}
        mode={mode}
        onOpenSettings={onOpenSettings}
        tileLabels={tileLabels}
        closeOnSelect={closeMenuOnSelect}
      />
    </ControlBar>
  );
}
