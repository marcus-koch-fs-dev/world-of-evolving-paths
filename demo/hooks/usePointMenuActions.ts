import type { Dispatch } from 'react';
import { type Period, type StorePoint, toDay, type ViewLevel } from 'world-of-evolving-paths';
import type { NextPointInput, PointPatch } from 'world-of-evolving-paths/react';
import { levelThatShows } from '../app-logic/levels';
import { nextPointProblem } from '../app-logic/pointActions';
import type { DemoAction } from '../app-logic/state';
import type { useNotice } from './useNotice';
import type { ViewNavigation } from './useViewNavigation';

type Options = {
  dispatch: Dispatch<DemoAction>;
  notice: Pick<ReturnType<typeof useNotice>, 'set' | 'show'>;
  navigation: ViewNavigation;
  period: Period | null;
  /** The levels the view bar offers. */
  offeredLevels: readonly ViewLevel[];
  /** The point whose menu is open. */
  selected: StorePoint | undefined;
};

/** What the demo does when the user changes something in the point menu, apart from changing the data. */
export function usePointMenuActions({ dispatch, notice, navigation, period, offeredLevels, selected }: Options) {
  /** A point that was made less important may drop out of this view. Say where it shows now, and offer to go there. */
  const hintIfHidden = (patch: PointPatch) => {
    if (!selected || patch.prio === undefined) return;
    const target = levelThatShows(patch.prio, navigation.level, offeredLevels);
    if (!target) return;
    notice.show(`This point is hidden here. It shows from the ${target.label.toLowerCase()} view on.`, {
      label: `Go to ${target.label.toLowerCase()}`,
      onClick: () => navigation.zoomInto(target.level, selected.date),
    });
  };

  /** The point after another one. Gives the problem to show when it cannot be made, else null. */
  const addNext = (fromId: string, input: NextPointInput) => {
    const problem = nextPointProblem(input);
    if (problem) return problem;
    dispatch({ type: 'addNext', fromId, input });
    const day = toDay(input.date);
    const outside = period !== null && (day < period.start || day > period.end);
    notice.set(outside ? `"${input.title}" was created, but its date is outside this ${navigation.level}.` : null);
    return null;
  };

  return { hintIfHidden, addNext };
}
