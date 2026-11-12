import type { Dispatch } from 'react';
import type {
  Level,
  LineSelectEvent,
  PathWorldEvents,
  Period,
  PointInfo,
  Store,
  ViewLevel,
} from 'world-of-evolving-paths';
import { heightOnPath } from '../app-logic/heightOnPath';
import { minPrioOf } from '../app-logic/levels';
import { customPointId } from '../app-logic/pointActions';
import type { DemoAction } from '../app-logic/state';
import { finerLevel } from '../app-logic/zoom';
import type { ViewNavigation } from './useViewNavigation';

type Options = {
  store: Store;
  /** Every point by id, with its path and branch. */
  infos: ReadonlyMap<string, PointInfo>;
  nextId: number;
  dispatch: Dispatch<DemoAction>;
  level: Level | null;
  period: Period | null;
  /** The paths on the page that is shown. */
  pathIds: readonly string[];
  navigation: ViewNavigation;
  offeredLevels: readonly ViewLevel[];
  /** The point whose menu is open, if it is in the current view. */
  selectedId: string | null;
  select: (id: string | null) => void;
};

type Position = { y: number; date: string; lanes: Record<string, number> };

/**
 * What the demo does when the user clicks on the map: new points are added, and a double-click goes to a finer view.
 * Moving things needs no code here: the map hands over the new store (`onStoreChange`). Returns the events for
 * `PathWorld` and the action for a new point in a line.
 */
export function useMapEvents({
  store,
  infos,
  nextId,
  dispatch,
  level,
  period,
  pathIds,
  navigation,
  offeredLevels,
  selectedId,
  select,
}: Options): Pick<PathWorldEvents, 'onPointAdd' | 'onPointDoubleClick' | 'onLeadDoubleClick'> & {
  insertIntoLine: (line: LineSelectEvent) => boolean;
} {
  const prio = minPrioOf(period);

  /** A new point in a branch. Its height is kept on the level it was added on. */
  const addTo = (branchId: string, position: Position, pathId: string) => {
    const height = heightOnPath(position.y, position.lanes, pathId);
    if (height === null) return false;
    dispatch({ type: 'add', level, branchId, height, date: position.date, prio });
    select(customPointId(nextId));
    return true;
  };

  return {
    onPointAdd: (position) => {
      // A path that is not on this page has no lane here, so the point goes to the selected path or the first one shown
      const selectedInfo = selectedId === null ? undefined : infos.get(selectedId);
      const pathId = selectedInfo?.pathId ?? pathIds[0];
      const branchId = selectedInfo?.branchId ?? store.paths.find((path) => path.id === pathId)?.branches[0]?.id;
      if (pathId !== undefined && branchId !== undefined) addTo(branchId, position, pathId);
    },
    onPointDoubleClick: ({ date }) => {
      // A double-click on a point goes one level finer, to the period of its date
      const finer = finerLevel(navigation.level, offeredLevels);
      if (finer) navigation.zoomInto(finer, date);
    },
    onLeadDoubleClick: ({ id, date }) => {
      // A double-click on a line that leaves the view goes to the period of the point out there, in the same level
      if (navigation.level === null) return;
      navigation.zoomInto(navigation.level, date);
      if (id) select(id);
    },
    /** A new point goes into the line that was clicked, where it was clicked. The branch of the point after it owns the line. */
    insertIntoLine: (line) => {
      const owner = infos.get(line.to.id ?? '') ?? infos.get(line.from.id ?? '');
      return owner !== undefined && addTo(owner.branchId, line, owner.pathId);
    },
  };
}
