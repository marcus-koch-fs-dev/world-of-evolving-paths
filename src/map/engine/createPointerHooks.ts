import { layoutOf, nearestFree } from '../../core/collision.js';
import type { Turn } from '../../core/orientation.js';
import { hitLead, hitLeadEnd, hitNode, reachAt } from '../../core/scene/hit.js';
import { lineTargetAt, targetOfLead } from '../../core/scene/lineTarget.js';
import { dateAxisX } from '../../core/scene/viewEdges.js';
import { snapToGrid } from '../../core/snap.js';
import { dateAtX } from '../../core/timeAxis.js';
import type { Position } from '../../core/types.js';
import type { Viewport } from '../dom/createViewport.js';
import type { PointDragger } from '../interaction/createPointDragger.js';
import type { PointerHooks } from '../interaction/createPointerController.js';
import type { PathWorldOptions } from '../options.js';
import type { WorldModel } from '../state/createWorldModel.js';
import type { InteractionState } from './createInteractionState.js';
import type { SceneHolder } from './createSceneHolder.js';
import { rounded } from './events.js';

type Dependencies = {
  options(): PathWorldOptions;
  model: WorldModel;
  scene: SceneHolder;
  interaction: InteractionState;
  dragger: PointDragger;
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
  viewport,
  toLayout,
  zoom,
  today,
}: Dependencies): PointerHooks {
  const canDrag = () => options().editable !== false && options().pointsLocked !== true;

  /** The position with its place along the time axis put back to the date of the point. */
  const onItsDate = (id: string, position: Position): Position => {
    const world = model.world();
    const date = world?.points.find((point) => point.id === id)?.date;
    const x = world && date ? dateAxisX(world, date) : null;
    return x === null ? position : { x, y: position.y };
  };

  return {
    pointAt: (world) => hitNode(scene.current().nodes, world)?.id ?? null,

    onHover(id) {
      if (id === interaction.hovered()) return;
      interaction.hover(id);
      viewport.setCursor(id ? 'pointer' : 'grab');
      scene.rebuild();
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

    lineEndAt: (world) =>
      canDrag() ? (hitLeadEnd(scene.current().leads, world, reachAt(zoom()))?.trackKey ?? null) : null,

    onLineEndMove(key, position) {
      interaction.dragLine(key, Math.round(toLayout(position).y));
      scene.rebuild();
    },

    onLineEndRelease(key) {
      const y = interaction.lineHeights().get(key);
      const lead = scene.current().leads.find((candidate) => candidate.trackKey === key);
      const points = new Map((model.world()?.points ?? []).map((point) => [point.id, point]));
      const target = lead && targetOfLead(lead, points);
      // The line stays where it was dragged until the app answers with new data that holds the height
      if (y !== undefined && target) options().onLineEndMove?.({ ...target, y });
      else interaction.dropLine(key);
      scene.rebuild();
    },

    onLineClick(at) {
      const current = options();
      const points = model.world()?.points ?? [];
      const target = current.onLineSelect ? lineTargetAt(scene.current(), points, at, reachAt(zoom())) : null;
      if (!current.onLineSelect || !target) return false;
      const place = rounded(toLayout(at));
      const date = dateAtX(place.x, model.periodData(), current.view, today(current));
      current.onLineSelect({ ...target, ...place, date, at });
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
      const points = model.world()?.points ?? [];
      const target = snapToGrid(toLayout(onScreen), current.snap);
      const free = rounded(nearestFree(layoutOf(points), { id: '', kind: 'start' }, target));
      current.onPointAdd?.({ ...free, date: dateAtX(free.x, model.periodData(), current.view, today(current)) });
    },
  };
}
