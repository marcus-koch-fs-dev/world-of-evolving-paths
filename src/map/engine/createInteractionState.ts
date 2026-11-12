/**
 * A drag of a line: where the pointer is now and where it was taken. With `scope` `end` only the end of the line moves.
 * With `path` the whole path of the line goes along, and `pathId` says which one.
 */
export type LineDrag = {
  y: number;
  startY: number;
  scope: 'end' | 'path';
  pathId?: string;
  /** For a line across the whole view that is taken by its body: its two ends, which go along by the same distance. */
  ends?: { key: string; startY: number }[];
};

export type InteractionState = {
  hovered(): string | null;
  dragging(): string | null;
  hover(id: string | null): void;
  drag(id: string | null): void;
  /** The lines the user is dragging, by the key of the line. */
  lineDrags(): ReadonlyMap<string, LineDrag>;
  /** Heights the user is dragging lines to, by the key of the line. */
  lineHeights(): ReadonlyMap<string, number>;
  /** How far the user has moved each path by dragging the end of one of its lines, by path id. */
  pathShifts(): ReadonlyMap<string, number>;
  /** A line is dragged. */
  dragLine(key: string, drag: LineDrag): void;
  /** The line is let go. */
  dropLine(key: string): void;
  /** All lines are let go, for when the app answered with new data that holds their heights. */
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
      new Map(
        [...lineDrags].flatMap(([key, { y, startY, scope, ends = [] }]): [string, number][] =>
          scope === 'end' ? [[key, y]] : ends.map((end) => [end.key, end.startY + (y - startY)]),
        ),
      ),
    pathShifts: () =>
      new Map(
        [...lineDrags.values()].flatMap(({ pathId, y, startY, scope }): [string, number][] =>
          scope === 'path' && pathId !== undefined ? [[pathId, y - startY]] : [],
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
