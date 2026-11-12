import { lanesOf } from '../../core/lanes.js';
import type { Turn } from '../../core/orientation.js';
import { hitLead, hitNode, reachAt } from '../../core/scene/hit.js';
import { lineTargetAt } from '../../core/scene/lineTarget.js';
import { dateAtAxisX, dateAxisX } from '../../core/scene/viewEdges.js';
import { snapToGrid } from '../../core/snap.js';
import { dateAtFreeX } from '../../core/store/free.js';
import type { Position } from '../../core/types.js';
import type { Viewport } from '../dom/createViewport.js';
import type { PointDragger } from '../interaction/createPointDragger.js';
import type { PointerHooks } from '../interaction/createPointerController.js';
import type { PathWorldOptions } from '../options.js';
import type { WorldModel } from '../state/createWorldModel.js';
import type { InteractionState } from './createInteractionState.js';
import { createLineGrabs } from './createLineGrabs.js';
import type { SceneHolder } from './createSceneHolder.js';
import type { StoreEdits } from './createStoreEdits.js';
import { rounded } from './events.js';

type Dependencies = {
  options(): PathWorldOptions;
  model: WorldModel;
  scene: SceneHolder;
  interaction: InteractionState;
  dragger: PointDragger;
  edits: StoreEdits;
  viewport: Pick<Viewport, 'setCursor'>;
  toLayout: Turn;
  /** The zoom of the camera now: lines are as easy to hit when the view is small. */
  zoom(): number;
  /** Today, already checked. */
  today(options: PathWorldOptions): string;
};

/** What the pointer does to the map: hover, select, drag a point, double-click a point or the empty area. */
export function createPointerHooks({
  options,
  model,
  scene,
  interaction,
  dragger,
  edits,
  viewport,
  toLayout,
  zoom,
  today,
}: Dependencies): PointerHooks {
  const canDrag = edits.canMove;

  /** The date at a place on the map: along the time axis of a period, or in the free arrangement of the overview. */
  const dateAt = (x: number, current: PathWorldOptions) => {
    const world = model.world();
    return (world && dateAtAxisX(world, x)) ?? (world ? dateAtFreeX(x) : today(current));
  };

  /** The position with its place along the time axis put back to the date of the point. */
  const onItsDate = (id: string, position: Position): Position => {
    const world = model.world();
    const date = world?.points.find((point) => point.id === id)?.date;
    const x = world && date ? dateAxisX(world, date) : null;
    return x === null ? position : { x, y: position.y };
  };

  const lineGrabs = createLineGrabs({ model, scene, interaction, edits, toLayout, zoom });

  return {
    ...lineGrabs,
    pointAt: (world) => hitNode(scene.current().nodes, world)?.id ?? null,

    onHover(id) {
      if (id === interaction.hovered()) return;
      interaction.hover(id);
      scene.rebuild();
    },

    // A hand over what can be clicked, a cross over the end of a line or a line that can be moved, otherwise the hand
    // that pans
    onCursor(world) {
      const reach = reachAt(zoom());
      const current = scene.current();
      const onLine =
        hitLead(current.leads, world, reach) !== null ||
        (options().onLineSelect !== undefined &&
          lineTargetAt(current, model.world()?.points ?? [], world, reach) !== null);
      const movable = lineGrabs.lineEndAt(world) !== null || lineGrabs.pathLineAt(world) !== null;
      // A point wins over a line, as when it is pressed
      const cursor =
        hitNode(current.nodes, world) !== null ? 'pointer' : movable ? 'move' : onLine ? 'pointer' : 'grab';
      viewport.setCursor(cursor);
    },

    onPointPress(id) {
      options().onSelect?.(id);
      if (!canDrag()) return false;
      dragger.start(id);
      interaction.drag(id);
      scene.rebuild();
      return true;
    },

    onDragMove(id, position) {
      const target = snapToGrid(toLayout(position), options().snap);
      dragger.move(id, options().timeLocked === false ? target : onItsDate(id, target));
    },

    onDragEnd(id) {
      interaction.drag(null);
      dragger.end(id);
      scene.rebuild();
    },

    onBackgroundClick: () => options().onSelect?.(null),

    leadAt: (world) => hitLead(scene.current().leads, world, reachAt(zoom()))?.id ?? null,

    onLineClick(at) {
      const current = options();
      const points = model.world()?.points ?? [];
      const target = current.onLineSelect ? lineTargetAt(scene.current(), points, at, reachAt(zoom())) : null;
      if (!current.onLineSelect || !target) return false;
      const place = rounded(toLayout(at));
      const world = model.world();
      current.onLineSelect({
        ...target,
        ...place,
        date: dateAt(place.x, current),
        lanes: world ? lanesOf(world) : {},
        at,
      });
      return true;
    },

    onLeadDoubleClick(id) {
      const lead = scene.current().leads.find((candidate) => candidate.id === id);
      if (!lead) return;
      options().onLeadDoubleClick?.({ pointId: lead.pointId, side: lead.side, ...lead.lead });
    },

    onPointDoubleClick(id) {
      const date = model.world()?.points.find((point) => point.id === id)?.date;
      if (date) options().onPointDoubleClick?.({ id, date });
    },

    onBackgroundDoubleClick(onScreen: Position) {
      const current = options();
      if (current.editable === false) return;
      const place = rounded(snapToGrid(toLayout(onScreen), current.snap));
      const world = model.world();
      current.onPointAdd?.({ ...place, date: dateAt(place.x, current), lanes: world ? lanesOf(world) : {} });
    },
  };
}
