import type { Position } from '../../core/types.js';

/**
 * A drag of a line: where the pointer is now and where it was taken. With `scope` `end` only the arrow at the end of
 * the line moves. With `path` the whole path of the line goes along, and `pathId` says which one.
 */
export type LineDrag = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  scope: 'end' | 'path';
  pathId?: string;
};

export type InteractionState = {
  hovered(): string | null;
  dragging(): string | null;
  hover(id: string | null): void;
  drag(id: string | null): void;
  /** The lines the user is dragging, by the key of the line. */
  lineDrags(): ReadonlyMap<string, LineDrag>;
  /** Heights the user is dragging arrows to, by the key of the arrow. */
  lineHeights(): ReadonlyMap<string, number>;
  /** How far the user has moved each path by dragging one of its lines, by path id. */
  pathShifts(): ReadonlyMap<string, Position>;
  /** A line is dragged. */
  dragLine(key: string, drag: LineDrag): void;
  /** The line is let go. */
  dropLine(key: string): void;
  /** All lines are let go, for when the app answered with a new store that holds their heights. */
  dropLines(): void;
  /** Nothing is hovered or dragged any more, for when the view underneath was replaced. */
  clear(): void;
};

/** Which point the pointer is over and which one is being dragged, and which lines are dragged. The scene shows all. */
export function createInteractionState(): InteractionState {
  let hovered: string | null = null;
  let dragging: string | null = null;
  let lineDrags: ReadonlyMap<string, LineDrag> = new Map();

  return {
    hovered: () => hovered,
    dragging: () => dragging,
    hover: (id) => {
      hovered = id;
    },
    drag: (id) => {
      dragging = id;
    },
    lineDrags: () => lineDrags,
    lineHeights: () =>
      new Map([...lineDrags].flatMap(([key, { y, scope }]): [string, number][] => (scope === 'end' ? [[key, y]] : []))),
    pathShifts: () =>
      new Map(
        [...lineDrags.values()].flatMap(({ pathId, x, y, startX, startY, scope }): [string, Position][] =>
          scope === 'path' && pathId !== undefined ? [[pathId, { x: x - startX, y: y - startY }]] : [],
        ),
      ),
    dragLine(key, drag) {
      lineDrags = new Map([...lineDrags, [key, drag]]);
    },
    dropLine(key) {
      lineDrags = new Map([...lineDrags].filter(([other]) => other !== key));
    },
    dropLines() {
      lineDrags = new Map();
    },
    clear() {
      hovered = null;
      dragging = null;
      lineDrags = new Map();
    },
  };
}
