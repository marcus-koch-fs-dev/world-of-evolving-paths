import type { ViewLevel } from 'world-of-evolving-paths';
import { steppedYears, viewsInBar } from '../app-logic/levels';
import { viewAtPosition } from '../app-logic/viewShortcuts';
import type { UndoRedoProps } from '../components/UndoRedo';
import { useUndoShortcuts } from './useUndoShortcuts';
import type { ViewNavigation } from './useViewNavigation';
import { useViewShortcuts } from './useViewShortcuts';

type Options = {
  /** The keys can be switched off. */
  enabled: boolean;
  /** Undo and redo only work in the editor. */
  editing: boolean;
  navigation: ViewNavigation;
  undoRedo: UndoRedoProps;
  /** The levels the bar offers. The digits count the views of the bar, the same ones it shows. */
  offeredLevels: readonly ViewLevel[];
};

/** The keys of the page: digits for the views, T, the arrows and + and − for the time, Ctrl+Z and Ctrl+Y. */
export function useAppShortcuts({ enabled, editing, navigation, undoRedo, offeredLevels }: Options): void {
  useUndoShortcuts({ enabled: editing && enabled, undo: undoRedo.onUndo, redo: undoRedo.onRedo });

  useViewShortcuts((shortcut) => {
    if (shortcut.type === 'view') {
      const views = viewsInBar(offeredLevels, navigation.level).map((option) => option.level);
      const view = viewAtPosition(views, shortcut.position);
      if (view !== undefined) navigation.chooseLevel(view);
    } else if (shortcut.type === 'today') navigation.goToToday();
    else if (shortcut.type === 'years') navigation.setYears(steppedYears(navigation.years, shortcut.step));
    else if (navigation.level !== null) navigation.move(shortcut.count);
  }, enabled);
}
