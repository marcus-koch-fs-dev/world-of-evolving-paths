import { fromDay, type Orientation, periodLabel, VIEW_LEVELS, type ViewLevel } from 'world-of-evolving-paths';
import { ControlBar, type DockSlot, ViewBar } from 'world-of-evolving-paths/react';
import type { DemoMode } from '../app-logic/menuGroups';
import { yearOfDay } from '../app-logic/periodChoices';
import type { ViewNavigation } from '../hooks/useViewNavigation';
import { BackButton } from './BackButton';
import { MainMenu } from './MainMenu';
import { PeriodPicker } from './PeriodPicker';
import { UndoRedo, type UndoRedoProps } from './UndoRedo';
import { YearsStepper } from './YearsStepper';

const CHIP_LETTERS: Record<ViewLevel, string> = { day: 'D', week: 'W', month: 'M', halfYear: 'H', year: 'Y' };

/** The level buttons as short chips with the full name as tooltip. The shown level is always among them. */
function chipsOf(levels: readonly { level: ViewLevel; label: string }[], shown: ViewLevel | null) {
  const wanted = new Set([...levels.map((option) => option.level), ...(shown ? [shown] : [])]);
  return VIEW_LEVELS.filter((option) => wanted.has(option.level)).map((option) => ({
    level: option.level,
    label: CHIP_LETTERS[option.level],
    title: `${option.label} (${CHIP_LETTERS[option.level]})`,
  }));
}

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
        levelChips
        levels={chipsOf(levels, navigation.level)}
        freeLabel="All"
        freeLast
        level={navigation.level}
        onLevelChange={navigation.chooseLevel}
        afterLevels={
          navigation.level === 'year' && <YearsStepper years={navigation.years} onChange={navigation.setYears} />
        }
        periodSlot={
          <PeriodPicker
            label={periodLabel(navigation.period, locale)}
            date={fromDay(navigation.period.start)}
            year={yearOfDay(navigation.period.end)}
            locale={locale}
            onPick={navigation.pick}
          />
        }
        onPrevious={() => navigation.move(-1)}
        onNext={() => navigation.move(1)}
        onToday={navigation.goToToday}
        page={paging.page}
        pages={navigation.level === null ? 0 : paging.pages}
        onPageChange={navigation.setPage}
      />
      <BackButton canGoBack={navigation.canGoBack} onBack={navigation.back} />
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
