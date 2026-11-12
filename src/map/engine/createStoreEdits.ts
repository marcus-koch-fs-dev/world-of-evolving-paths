import { lanesOf } from '../../core/lanes.js';
import { moveArrow, moveFreePath, moveFreePoint, movePath, movePoint, storeChanges } from '../../core/store/index.js';
import type { Store } from '../../core/store/types.js';
import type { Position } from '../../core/types.js';
import type { PathWorldOptions } from '../options.js';
import type { WorldModel } from '../state/createWorldModel.js';

type Dependencies = { options(): PathWorldOptions; model: WorldModel };

export type StoreEdits = {
  /** Can the user move points, arrows and whole paths now? In a period of a level, or in the overview when `freeMove` is on. */
  canMove(): boolean;
  /** A point came to rest at a position (in the layout, before it was turned for the screen). */
  movePoint(id: string, position: Position): void;
  /** An arrow was dragged to a world y. */
  moveArrow(key: string, y: number): void;
  /** A whole path was dragged by a distance. */
  movePath(pathId: string, shift: Position): void;
};

/**
 * Turns what the user did on the map into a change of the store and hands the new store to the app. A height is kept
 * on the level of the shown period, a free place in the overview. Both leave each other alone.
 */
export function createStoreEdits({ options, model }: Dependencies): StoreEdits {
  const canMove = () => {
    const current = options();
    const allowed = current.editable !== false && current.onStoreChange !== undefined && model.store() !== null;
    return allowed && (model.level() !== null || current.freeMove === true);
  };
  const lanes = () => {
    const world = model.world();
    return world ? lanesOf(world) : {};
  };
  // The app gets the new store and the paths it touched, so it saves those and nothing else
  const publish = (before: Store, next: Store) => options().onStoreChange?.(next, storeChanges(before, next));

  return {
    canMove: () => canMove() && options().pointsLocked !== true,

    movePoint(id, position) {
      const [store, level, point] = [model.store(), model.level(), model.world()?.points.find((p) => p.id === id)];
      if (!store || !point) return;
      if (level === null) return publish(store, moveFreePoint(store, id, position));
      publish(store, movePoint(store, level, id, position.y - (lanes()[point.pathId] ?? 0)));
    },

    moveArrow(key, y) {
      const [store, level, world] = [model.store(), model.level(), model.world()];
      const pathId =
        world?.arrows.find((arrow) => arrow.key === key)?.pathId ??
        world?.spans.find((span) => span.before.key === key || span.after.key === key)?.pathId;
      if (!store || level === null || pathId === undefined) return;
      publish(store, moveArrow(store, level, key, y - (lanes()[pathId] ?? 0)));
    },

    movePath(pathId, shift) {
      const [store, level] = [model.store(), model.level()];
      if (!store) return;
      publish(store, level === null ? moveFreePath(store, pathId, shift) : movePath(store, level, pathId, shift.y));
    },
  };
}
