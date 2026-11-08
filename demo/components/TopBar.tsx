import { type Orientation, periodLabel, type ViewLevel } from 'world-of-evolving-paths';
import { ControlBar, type DockSlot, ViewBar } from 'world-of-evolving-paths/react';
import type { DemoMode } from '../app-logic/menuGroups';
import type { ViewNavigation } from '../hooks/useViewNavigation';
import { MainMenu } from './MainMenu';
import { UndoRedo, type UndoRedoProps } from './UndoRedo';

type Props = {
  dock: DockSlot;
  onDockChange: (dock: DockSlot) => void;
  navigation: ViewNavigation;
  /** The page shown and how many there are, from the view that was built. */
  paging: { page: number; pages: number };
  locale: string;
  /** The levels the view bar offers. */
  levels: readonly { level: ViewLevel; label: string }[];
  onReroll: () => void;
  onOrientationChange: (orientation: Orientation) => void;
  mode: DemoMode;
  onModeChange: (mode: DemoMode) => void;
  settingsOpen: boolean;
  onSettingsToggle: () => void;
  /** The undo and redo buttons. Left out where nothing can be changed. */
  undoRedo?: UndoRedoProps;
};

/** The main bar: where in time the map is, and the menu with everything else. */
export function TopBar({
  dock,
  onDockChange,
  navigation,
  paging,
  locale,
  levels,
  onReroll,
  onOrientationChange,
  mode,
  onModeChange,
  settingsOpen,
  onSettingsToggle,
  undoRedo,
}: Props) {
  return (
    <ControlBar dock={dock} onDockChange={onDockChange}>
      <ViewBar
        periodOnly
        level={navigation.level}
        onLevelChange={navigation.chooseLevel}
        periodLabel={periodLabel(navigation.period, locale)}
        onPrevious={() => navigation.move(-1)}
        onNext={() => navigation.move(1)}
        onToday={navigation.goToToday}
        page={paging.page}
        pages={navigation.level === null ? 0 : paging.pages}
        onPageChange={navigation.setPage}
      />
      {undoRedo && <UndoRedo {...undoRedo} />}
      <MainMenu
        levels={levels}
        level={navigation.level}
        onLevelChange={navigation.chooseLevel}
        onReroll={onReroll}
        onOrientationChange={onOrientationChange}
        mode={mode}
        onModeChange={onModeChange}
        settingsOpen={settingsOpen}
        onSettingsToggle={onSettingsToggle}
      />
    </ControlBar>
  );
}
