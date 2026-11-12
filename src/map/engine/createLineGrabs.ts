import type { Turn } from '../../core/orientation.js';
import { hitConnection, hitLeadEnd, hitLeadLine, reachAt } from '../../core/scene/hit.js';
import type { PlacedPoint, PlacedWorld } from '../../core/types.js';
import type { PointerHooks } from '../interaction/createPointerController.js';
import type { WorldModel } from '../state/createWorldModel.js';
import type { InteractionState } from './createInteractionState.js';
import type { SceneHolder } from './createSceneHolder.js';
import type { StoreEdits } from './createStoreEdits.js';

const PATH_PREFIX = 'path:';

/** The key of a drag that moves a whole path, as the pointer controller passes it around. */
export const pathKeyOf = (pathId: string) => `${PATH_PREFIX}${pathId}`;

/**
 * The path id in the key of a path drag, or null for the key of an arrow. An arrow key always holds a slash
 * (`pathId/branchId@date`) and a path id never does, so a path whose id starts with `path:` cannot be mistaken.
 */
export const pathIdOfKey = (key: string) =>
  key.startsWith(PATH_PREFIX) && !key.includes('/') ? key.slice(PATH_PREFIX.length) : null;

type Dependencies = {
  model: WorldModel;
  scene: SceneHolder;
  interaction: InteractionState;
  edits: StoreEdits;
  toLayout: Turn;
  zoom(): number;
};

export type LineGrabs = Pick<
  PointerHooks,
  'lineEndAt' | 'pathLineAt' | 'onLineGrab' | 'onLineEndMove' | 'onLineEndCancel' | 'onLineEndRelease'
>;

type At = { x: number; y: number };

/**
 * Taking a line and dragging it: the arrow at its end moves only that arrow, the line itself moves the whole path of
 * the line. Both are only taken when the app listens (see `onStoreChange`), otherwise the move would be shown but never kept.
 */
export function createLineGrabs({ model, scene, interaction, edits, toLayout, zoom }: Dependencies): LineGrabs {
  // Where a path was taken by its line
  let pathGrab: { key: string; at: At } | null = null;
  // The points of the world by id, made again only when the world is another one: hovering asks on every mouse move
  let indexed: { world: PlacedWorld | null; points: Map<string, PlacedPoint>; ids: Set<string> } | null = null;

  const pointsOfWorld = () => {
    const world = model.world();
    if (indexed?.world === world) return indexed;
    const points = new Map((world?.points ?? []).map((point) => [point.id, point]));
    indexed = { world, points, ids: new Set(points.keys()) };
    return indexed;
  };

  const layoutAt = (position: At): At => {
    const at = toLayout(position);
    return { x: Math.round(at.x), y: Math.round(at.y) };
  };

  /** Where the arrow is when the user takes it. Null for an arrow that is not in the scene. */
  const endOrigin = (key: string) => {
    const lead = scene.current().leads.find((candidate) => candidate.trackKey === key);
    const at = lead && layoutAt(lead.end);
    return lead && at ? { scope: 'end' as const, startX: at.x, startY: at.y, pathId: lead.pathId } : null;
  };

  const finish = (key: string) => {
    pathGrab = null;
    interaction.dropLine(key);
    scene.rebuild();
  };

  return {
    lineEndAt: (world) =>
      edits.canMove() && model.level() !== null
        ? (hitLeadEnd(scene.current().leads, world, reachAt(zoom()))?.trackKey ?? null)
        : null,

    pathLineAt(world) {
      if (!edits.canMove()) return null;
      const reach = reachAt(zoom());
      const { points, ids } = pointsOfWorld();
      const current = scene.current();
      const lead = hitLeadLine(current.leads, world, reach);
      const edge = lead ? null : hitConnection(current.edges, ids, world, reach);
      const pathId = lead ? lead.pathId : edge && points.get(edge.from)?.pathId;
      return pathId === undefined || pathId === null ? null : pathKeyOf(pathId);
    },

    onLineGrab(key, world) {
      pathGrab = pathIdOfKey(key) === null ? null : { key, at: layoutAt(world) };
    },

    onLineEndMove(key, position) {
      const pathId = pathIdOfKey(key);
      const at = layoutAt(position);
      const grab = pathGrab?.key === key ? pathGrab.at : null;
      const origin =
        interaction.lineDrags().get(key) ??
        (pathId === null ? endOrigin(key) : grab && { scope: 'path' as const, pathId, startX: grab.x, startY: grab.y });
      if (!origin) return;
      // Along the time axis a line only moves up and down, unless the overview is moved freely
      const moves = model.level() === null ? at : { x: origin.startX, y: at.y };
      interaction.dragLine(key, { ...origin, ...moves });
      scene.rebuild();
    },

    onLineEndCancel: finish,

    onLineEndRelease(key) {
      const drag = interaction.lineDrags().get(key);
      pathGrab = null;
      if (!drag) return finish(key);
      // The arrow and the path stay where they were dragged until the app answers with a new store
      if (drag.scope === 'end') edits.moveArrow(key, drag.y);
      else if (drag.pathId !== undefined) {
        edits.movePath(drag.pathId, { x: drag.x - drag.startX, y: drag.y - drag.startY });
      }
      scene.rebuild();
    },
  };
}
