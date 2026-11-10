import { layoutOf, nearestFree } from '../../core/collision.js';
import type { Turn } from '../../core/orientation.js';
import { hitLead, hitNode } from '../../core/scene/hit.js';
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
  today,
}: Dependencies): PointerHooks {
  const canDrag = () => options().editable !== false && options().pointsLocked !== true;

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

    onDragMove: (id, position) => dragger.move(id, toLayout(position)),

    onDragEnd(id) {
      interaction.drag(null);
      dragger.end(id);
      scene.rebuild();
    },

    onBackgroundClick: () => options().onSelect?.(null),

    leadAt: (world) => hitLead(scene.current().leads, scene.current().edges, world)?.id ?? null,

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
      const free = rounded(nearestFree(layoutOf(points), { id: '', kind: 'start' }, toLayout(onScreen)));
      current.onPointAdd?.({ ...free, date: dateAtX(free.x, model.periodData(), current.view, today(current)) });
    },
  };
}
