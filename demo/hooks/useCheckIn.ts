import type { Dispatch } from 'react';
import type { StorePath } from 'world-of-evolving-paths';
import { checkInMessage } from '../app-logic/checkIn';
import type { DemoAction } from '../app-logic/state';

/** The check-in list: all paths, and what a tap does: check in today and say what that did. */
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
      onNotice(checkInMessage(path, today));
      dispatch({ type: 'checkIn', pathId, date: today });
    },
  };
}
