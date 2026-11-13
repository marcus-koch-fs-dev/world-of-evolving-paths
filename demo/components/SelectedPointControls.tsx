import type { Dispatch } from 'react';
import type { StorePath, StorePoint } from 'world-of-evolving-paths';
import { type MenuPlacement, PointMenu, type PointPatch, type SubPlacement } from 'world-of-evolving-paths/react';
import { checkInMessage } from '../app-logic/checkIn';
import { canComplete } from '../app-logic/rules';
import type { DemoAction, DemoState } from '../app-logic/state';

type Props = {
  point: StorePoint;
  path: StorePath;
  /** Does a branch of another line leave from this point? */
  isFork: boolean;
  checkedInToday: boolean;
  state: DemoState;
  today: string;
  dispatch: Dispatch<DemoAction>;
  customColors: readonly string[];
  onCustomColor: (color: string) => void;
  onNotice: (text: string | null) => void;
  /** Runs after a change in the menu, for example to say where a point that dropped out of the view shows now. */
  onChanged: (patch: PointPatch) => void;
  onAddNext: Parameters<typeof PointMenu>[0]['onAddNext'];
  onDeleted: () => void;
  /** The point menu wants to close: deselect the point. */
  onClose: () => void;
  closeAfterAction: boolean;
  /** Where the menu sits next to its point, and where the panel of a tile opens (by itself when not given). */
  placement: MenuPlacement;
  onPlacementChange: (placement: MenuPlacement) => void;
  subPlacement?: SubPlacement;
};

/** What the demo offers for the selected point: the point menu, with the check-in of its path as a key. */
export function SelectedPointControls({
  point,
  path,
  isFork,
  checkedInToday,
  state,
  today,
  dispatch,
  customColors,
  onCustomColor,
  onNotice,
  onChanged,
  onAddNext,
  onDeleted,
  onClose,
  closeAfterAction,
  placement,
  onPlacementChange,
  subPlacement,
}: Props) {
  return (
    <PointMenu
      point={point}
      path={path}
      isFork={isFork}
      canComplete={canComplete(state.store, point.id)}
      checkInCount={path.checkIns?.length ?? 0}
      onCheckIn={() => {
        onNotice(checkInMessage(path, today));
        dispatch({ type: 'checkIn', pathId: path.id, date: today });
      }}
      checkedIn={checkedInToday}
      customColors={customColors}
      onCustomColor={onCustomColor}
      onUpdate={(patch) => {
        dispatch({ type: 'update', id: point.id, patch });
        onChanged(patch);
      }}
      onAddNext={onAddNext}
      onClose={onClose}
      closeAfterAction={closeAfterAction}
      placement={placement}
      onPlacementChange={onPlacementChange}
      subPlacement={subPlacement}
      onPathColor={(color) => dispatch({ type: 'pathColor', pathId: path.id, color })}
      onDelete={() => {
        dispatch({ type: 'delete', id: point.id });
        onDeleted();
      }}
    />
  );
}
