import { lanesOf } from '../../core/layout.js';
import type { Turn } from '../../core/orientation.js';
import { hitConnection, hitLeadEnd, hitLeadLine, reachAt } from '../../core/scene/hit.js';
import { throughKeyOfEnd, throughPathIdOf } from '../../core/scene/lineGeometry.js';
import { type LineTarget, lineTargetAt, targetOfLead } from '../../core/scene/lineTarget.js';
import type { Position } from '../../core/types.js';
import type { PointerHooks } from '../interaction/createPointerController.js';
import type { PathWorldOptions } from '../options.js';
import type { WorldModel } from '../state/createWorldModel.js';
import type { InteractionState, LineDrag } from './createInteractionState.js';
import type { SceneHolder } from './createSceneHolder.js';
import { offsetsOf } from './events.js';
import { lineEndHeights } from './lineEnds.js';

const PATH_PREFIX = 'path:';
const NO_TARGET: LineTarget = { from: { title: '', date: '' }, to: { title: '', date: '' } };

/** The key of a drag that moves a whole path, as the pointer controller passes it around. */
export const pathKeyOf = (pathId: string) => `${PATH_PREFIX}${pathId}`;

/** The path id in the key of a path drag, or null for the key of the end of a line. */
export const pathIdOfKey = (key: string) => (key.startsWith(PATH_PREFIX) ? key.slice(PATH_PREFIX.length) : null);

type Dependencies = {
  options(): PathWorldOptions;
  model: WorldModel;
  scene: SceneHolder;
  interaction: InteractionState;
  toLayout: Turn;
  zoom(): number;
  /** Can the user move things now? */
  canDrag(): boolean;
};

export type LineGrabs = Pick<
  PointerHooks,
  'lineEndAt' | 'pathLineAt' | 'onLineGrab' | 'onLineEndMove' | 'onLineEndCancel' | 'onLineEndRelease'
>;

/**
 * Taking a line and dragging it: the arrow at its end moves only that end, the line itself moves the whole path of
 * the line in this view. Both are only taken when the app listens, otherwise the height would be shown but never kept.
 */
export function createLineGrabs({
  options,
  model,
  scene,
  interaction,
  toLayout,
  zoom,
  canDrag,
}: Dependencies): LineGrabs {
  // Where a path was taken by its line, and which line that was
  let pathGrab: {
    key: string;
    startY: number;
    target: LineTarget | null;
    /** The two ends of the line when it spans the whole view: they go along by the same distance. */
    ends: { key: string; startY: number }[];
  } | null = null;

  const listening = () => canDrag() && options().onLineEndMove !== undefined;
  const pointsById = () => new Map((model.world()?.points ?? []).map((point) => [point.id, point]));
  const layoutY = (position: Position) => Math.round(toLayout(position).y);

  const pathOfLead = (pointId: string): string | undefined => pointsById().get(pointId)?.pathId;

  /** Where the end of a line is when the user takes it. Null for a line that is not in the scene. */
  const endOrigin = (key: string): Omit<LineDrag, 'y'> | null => {
    const lead = scene.current().leads.find((candidate) => candidate.trackKey === key);
    return lead ? { scope: 'end', startY: layoutY(lead.end), pathId: pathOfLead(lead.pointId) } : null;
  };

  const pathOrigin = (key: string, pathId: string): Omit<LineDrag, 'y'> | null =>
    pathGrab?.key === key ? { scope: 'path', startY: pathGrab.startY, pathId, ends: pathGrab.ends } : null;

  const finish = (key: string) => {
    pathGrab = null;
    interaction.dropLine(key);
    scene.rebuild();
  };

  const eventOf = (key: string, drag: LineDrag, world: NonNullable<ReturnType<WorldModel['world']>>) => {
    const points = pointsById();
    const leads = scene.current().leads;
    const lane = (drag.pathId === undefined ? undefined : lanesOf(world)[drag.pathId]) ?? 0;
    const lead = leads.find((candidate) => candidate.trackKey === key);
    const target = drag.scope === 'path' ? (pathGrab?.target ?? NO_TARGET) : lead && targetOfLead(lead, points);
    if (!target) return null;
    return {
      ...target,
      scope: drag.scope,
      pathId: drag.pathId,
      side: drag.scope === 'end' ? lead?.side : undefined,
      // The height goes to the app as a distance from the lane of the path of the line
      y: drag.y - Math.round(drag.scope === 'end' && lead ? lead.lane : lane),
      shift: drag.y - drag.startY,
      offsets: offsetsOf(world.points, lanesOf(world)),
      lineEnds: lineEndHeights(
        leads,
        points,
        toLayout,
        { key, startY: drag.startY },
        drag.scope === 'path' && drag.ends?.length
          ? {
              keys: new Set(drag.ends.map((end) => end.key)),
              startYs: new Map(drag.ends.map((end) => [end.key, end.startY])),
            }
          : undefined,
      ),
    };
  };

  return {
    lineEndAt: (world) =>
      listening() ? (hitLeadEnd(scene.current().leads, world, reachAt(zoom()))?.trackKey ?? null) : null,

    pathLineAt(world) {
      if (!listening()) return null;
      const reach = reachAt(zoom());
      const points = pointsById();
      const current = scene.current();
      const lead = hitLeadLine(current.leads, world, reach);
      const edge = lead ? null : hitConnection(current.edges, new Set(points.keys()), world, reach);
      const pathId = lead
        ? lead.span
          ? throughPathIdOf(lead.trackKey)
          : pathOfLead(lead.pointId)
        : edge && points.get(edge.from)?.pathId;
      return pathId === undefined || pathId === null ? null : pathKeyOf(pathId);
    },

    onLineGrab(key, world) {
      const pathId = pathIdOfKey(key);
      const current = scene.current();
      const target = pathId === null ? null : lineTargetAt(current, [...pointsById().values()], world, reachAt(zoom()));
      const spanKey = throughKeyOfEnd(hitLeadLine(current.leads, world, reachAt(zoom()))?.trackKey ?? '');
      // A line across the whole view is two halves with an end each, and both ends go along
      const ends = current.leads
        .filter((lead) => lead.span && spanKey !== null && lead.trackKey.startsWith(`${spanKey}:`))
        .map((lead) => ({ key: lead.trackKey, startY: layoutY(lead.end) }));
      pathGrab = pathId === null ? null : { key, startY: layoutY(world), target, ends };
    },

    onLineEndMove(key, position) {
      const pathId = pathIdOfKey(key);
      const origin = interaction.lineDrags().get(key) ?? (pathId === null ? endOrigin(key) : pathOrigin(key, pathId));
      if (!origin) return;
      interaction.dragLine(key, { ...origin, y: layoutY(position) });
      scene.rebuild();
    },

    onLineEndCancel: finish,

    onLineEndRelease(key) {
      const drag = interaction.lineDrags().get(key);
      const world = model.world();
      const event = drag && world ? eventOf(key, drag, world) : null;
      // The line and its path stay where they were dragged until the app answers with new data that holds the heights
      if (!event) return finish(key);
      pathGrab = null;
      options().onLineEndMove?.(event);
      scene.rebuild();
    },
  };
}
