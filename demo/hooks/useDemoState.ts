import { useCallback, useReducer } from 'react';
import { canRedo, canUndo } from '../app-logic/history';
import { initialState } from '../app-logic/state';
import { createStateHistory, historyReduce } from '../app-logic/stateHistory';
import { createHabits } from '../data/habits';

function createInitialState(today: string) {
  const habits = createHabits(today);
  return initialState(habits.store, habits.checkIns);
}

/**
 * The demo's data with undo and redo. `onStep` runs when the user steps through the history: a message describes the
 * change just made, so stepping closes it.
 */
export function useDemoState(today: string, onStep: () => void) {
  const [history, dispatch] = useReducer(historyReduce, today, (day) => createStateHistory(createInitialState(day)));
  const onUndo = useCallback(() => {
    onStep();
    dispatch({ type: 'undo' });
  }, [onStep]);
  const onRedo = useCallback(() => {
    onStep();
    dispatch({ type: 'redo' });
  }, [onStep]);
  return {
    state: history.present,
    dispatch,
    undoRedo: { canUndo: canUndo(history), canRedo: canRedo(history), onUndo, onRedo },
  };
}
