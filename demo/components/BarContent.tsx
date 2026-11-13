import type { ReactNode } from 'react';
import { fromDay, periodLabel, type ViewLevel } from 'world-of-evolving-paths';
import { MoveLock, ViewBar } from 'world-of-evolving-paths/react';
import type { BarItem } from '../app-logic/controls';
import { viewsInBar } from '../app-logic/levels';
import type { DemoMode } from '../app-logic/menuGroups';
import { yearOfDay } from '../app-logic/periodChoices';
import type { ViewNavigation } from '../hooks/useViewNavigation';
import { BackButton } from './BackButton';
import { PathsStepper } from './PathsStepper';
import { PeriodPicker } from './PeriodPicker';
import { UndoRedo, type UndoRedoProps } from './UndoRedo';
import { YearsStepper } from './YearsStepper';

const CHIP_LETTERS: Record<ViewLevel, string> = { week: 'W', month: 'M', year: 'Y' };

/** The level buttons as short chips with the full name as tooltip. The shown level is always among them. */
function chipsOf(levels: readonly { level: ViewLevel; label: string }[], shown: ViewLevel | null) {
  return viewsInBar(
    levels.map((option) => option.level),
    shown,
  ).map((option) => ({
    level: option.level,
    label: CHIP_LETTERS[option.level],
    title: `${option.label} (${CHIP_LETTERS[option.level]})`,
  }));
}

type Props = {
  navigation: ViewNavigation;
  /** The page shown and how many there are, from the view that was built. */
  paging: { page: number; pages: number };
  pathsPerPage: number;
  pathCount: number;
  onPathsPerPageChange: (count: number) => void;
  locale: string;
  /** The levels the view bar offers. */
  levels: readonly { level: ViewLevel; label: string }[];
  /** The controls that sit in the bar, in the order the user chose. */
  barItems: readonly BarItem[];
  /** The overview is arranged by hand when this is false. */
  locked: boolean;
  onLockToggle: () => void;
  mode: DemoMode;
  undoRedo: UndoRedoProps;
};

/** The controls in the main bar, one after the other in the order the user chose. */
export function BarContent(props: Props) {
  const { navigation, paging, barItems, levels, locale } = props;

  // What both parts of the view bar need
  const viewProps = {
    periodOnly: true,
    levels: chipsOf(levels, navigation.level),
    freeLabel: 'All',
    freeLast: true,
    level: navigation.level,
    onLevelChange: navigation.chooseLevel,
    periodSlot: (
      <PeriodPicker
        label={periodLabel(navigation.period, locale)}
        date={fromDay(navigation.period.start)}
        year={yearOfDay(navigation.period.end)}
        locale={locale}
        onPick={navigation.pick}
      />
    ),
    onPrevious: () => navigation.move(-1),
    onNext: () => navigation.move(1),
    onToday: navigation.goToToday,
    page: paging.page,
    pages: paging.pages,
    onPageChange: navigation.setPage,
  };

  // Next to the level buttons: the counter of years in the year view, and the lock in the overview
  const extras = (
    <>
      {navigation.level === 'year' && <YearsStepper years={navigation.years} onChange={navigation.setYears} />}
      {navigation.level === null && <MoveLock locked={props.locked} onToggle={props.onLockToggle} />}
    </>
  );

  const items: Record<BarItem, ReactNode> = {
    levels: (
      <>
        <ViewBar {...viewProps} parts={['levels']} levelChips />
        {extras}
      </>
    ),
    navigation: <ViewBar {...viewProps} parts={['period']} />,
    paths: <PathsStepper count={props.pathsPerPage} max={props.pathCount} onChange={props.onPathsPerPageChange} />,
    back: <BackButton canGoBack={navigation.canGoBack} onBack={navigation.back} />,
    history: props.mode === 'edit' ? <UndoRedo {...props.undoRedo} /> : null,
  };

  return (
    <>
      {/* What is not chosen still has to show the period and the lock, at the start */}
      {!barItems.includes('navigation') && <ViewBar {...viewProps} parts={['period']} navigation={false} />}
      {!barItems.includes('levels') && extras}
      {barItems.map((id) => (
        <div key={id} className="demo-bar-item">
          {items[id]}
        </div>
      ))}
    </>
  );
}
