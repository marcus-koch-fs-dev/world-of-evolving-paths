export type InteractionState = {
  hovered(): string | null;
  dragging(): string | null;
  hover(id: string | null): void;
  drag(id: string | null): void;
  /** Nothing is hovered or dragged any more, for when the view underneath was replaced. */
  clear(): void;
};

/** Which point the pointer is over and which one is being dragged. The scene shows both. */
export function createInteractionState(): InteractionState {
  let hovered: string | null = null;
  let dragging: string | null = null;

  return {
    hovered: () => hovered,
    dragging: () => dragging,
    hover: (id) => {
      hovered = id;
    },
    drag: (id) => {
      dragging = id;
    },
    clear() {
      hovered = null;
      dragging = null;
    },
  };
}
