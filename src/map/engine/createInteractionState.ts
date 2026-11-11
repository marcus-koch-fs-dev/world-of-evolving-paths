export type InteractionState = {
  hovered(): string | null;
  dragging(): string | null;
  hover(id: string | null): void;
  drag(id: string | null): void;
  /** Heights the user is dragging lines to, by the key of the line. */
  lineHeights(): ReadonlyMap<string, number>;
  /** A line is dragged to this height. */
  dragLine(key: string, y: number): void;
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
  let lineHeights: ReadonlyMap<string, number> = new Map();

  return {
    hovered: () => hovered,
    dragging: () => dragging,
    hover: (id) => {
      hovered = id;
    },
    drag: (id) => {
      dragging = id;
    },
    lineHeights: () => lineHeights,
    dragLine(key, y) {
      lineHeights = new Map([...lineHeights, [key, y]]);
    },
    dropLine(key) {
      lineHeights = new Map([...lineHeights].filter(([other]) => other !== key));
    },
    dropLines() {
      lineHeights = new Map();
    },
    clear() {
      hovered = null;
      dragging = null;
      lineHeights = new Map();
    },
  };
}
