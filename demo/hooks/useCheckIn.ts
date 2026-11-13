import type { Dispatch } from 'react';
import { hasCheckedIn, type StorePath } from 'world-of-evolving-paths';
import { checkInMessage } from '../app-logic/checkIn';
import type { DemoAction } from '../app-logic/state';

/**
 * The check-in list: all paths, and what a tap does. A path that is not checked in today is checked in, and the
 * message says what that did. A tap on one that is takes the check-in back, so a tap by mistake can be undone
 * everywhere, also where there is no undo button.
 */
export function useCheckIn(
  paths: readonly StorePath[],
  today: string,
  dispatch: Dispatch<DemoAction>,
  onNotice: (text: string) => void,
) {
  return {
    paths,
    today,
    onCheckIn: (pathId: string) => {
      const path = paths.find((candidate) => candidate.id === pathId);
      if (!path) return;
      if (hasCheckedIn(path, today)) {
        onNotice(`${path.name}: check-in taken back.`);
        dispatch({ type: 'undoCheckIn', pathId, date: today });
        return;
      }
      onNotice(checkInMessage(path, today));
      dispatch({ type: 'checkIn', pathId, date: today });
    },
  };
}
