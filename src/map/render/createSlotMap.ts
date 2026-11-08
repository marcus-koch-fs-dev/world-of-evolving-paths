export type SlotMap<Item extends { id: string }, Slot> = {
  /** The slots in the order of the last sync. The same array comes back until the next sync. */
  values(): readonly Slot[];
  /** Updates the slot of every item, creating it on first sight, and removes the slots whose item is gone. */
  sync(items: Item[], update: (slot: Slot, item: Item) => void): void;
};

type Hooks<Item, Slot> = {
  create(item: Item): Slot;
  destroy(slot: Slot): void;
};

/** One drawing slot per item id. Layers share this instead of each keeping its own create/update/remove loop. */
export function createSlotMap<Item extends { id: string }, Slot>({
  create,
  destroy,
}: Hooks<Item, Slot>): SlotMap<Item, Slot> {
  const slots = new Map<string, Slot>();
  // Layers ask for the slots several times per frame, so the list is made once per sync
  let list: readonly Slot[] = [];

  return {
    values: () => list,

    sync(items, update) {
      const seen = new Set(items.map((item) => item.id));
      slots.forEach((slot, id) => {
        if (seen.has(id)) return;
        destroy(slot);
        slots.delete(id);
      });
      items.forEach((item) => {
        const slot = slots.get(item.id) ?? create(item);
        slots.set(item.id, slot);
        update(slot, item);
      });
      list = [...slots.values()];
    },
  };
}
