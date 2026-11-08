import { createHistory, type History, record, redo, undo } from './history';
import { type DemoAction, type DemoState, reduce } from './state';

export type HistoryAction = DemoAction | { type: 'undo' } | { type: 'redo' };

/** The history of the demo's state, with the first state as its start. */
export const createStateHistory = (state: DemoState): History<DemoState> => createHistory(state);

/**
 * The demo's reducer with undo and redo. Every action that changes the data is one step. An action that changes
 * nothing, such as connecting two points that cannot be connected, is none.
 */
export function historyReduce(history: History<DemoState>, action: HistoryAction): History<DemoState> {
  if (action.type === 'undo') return undo(history);
  if (action.type === 'redo') return redo(history);
  return record(history, reduce(history.present, action));
}
