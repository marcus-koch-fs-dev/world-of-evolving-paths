import { describe, expect, it, vi } from 'vitest';
import { createSlotMap } from './createSlotMap.js';

type Item = { id: string; value: number };
type Slot = { id: string; value: number };

const setup = () => {
  const create = vi.fn((item: Item): Slot => ({ id: item.id, value: 0 }));
  const destroy = vi.fn();
  const slots = createSlotMap<Item, Slot>({ create, destroy });
  const update = (slot: Slot, item: Item) => {
    slot.value = item.value;
  };
  return { slots, create, destroy, update };
};

describe('Slot map', () => {
  describe('when an item is seen for the first time', () => {
    it('creates a slot and updates it', () => {
      const { slots, create, update } = setup();

      slots.sync([{ id: 'a', value: 3 }], update);

      expect(create).toHaveBeenCalledTimes(1);
      expect(slots.values()).toEqual([{ id: 'a', value: 3 }]);
    });
  });

  describe('when an item is synced again', () => {
    it('reuses its slot', () => {
      const { slots, create, update } = setup();

      slots.sync([{ id: 'a', value: 1 }], update);
      slots.sync([{ id: 'a', value: 2 }], update);

      expect(create).toHaveBeenCalledTimes(1);
      expect(slots.values()[0].value).toBe(2);
    });
  });

  describe('when an item is gone', () => {
    it('destroys its slot and keeps the others', () => {
      const { slots, destroy, update } = setup();
      slots.sync(
        [
          { id: 'a', value: 1 },
          { id: 'b', value: 2 },
        ],
        update,
      );

      slots.sync([{ id: 'b', value: 2 }], update);

      expect(destroy).toHaveBeenCalledTimes(1);
      expect(slots.values().map((slot) => slot.id)).toEqual(['b']);
    });
  });
});
