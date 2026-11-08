import { Container } from 'pixi.js';
import type { NodeDraw } from '../../core/scene/types.js';
import { createSlotMap } from './createSlotMap.js';
import type { TextPool } from './createTextPool.js';
import { isFollowing, placeNode, tickNode } from './nodeMotion.js';
import { createNodeSlot, destroyNodeSlot, type NodeSlot, paintNode } from './paintNode.js';

export type NodeLayer = {
  container: Container;
  /** Off: size and opacity change at once, rings and arrows stand still. */
  setAnimate(animate: boolean): void;
  isAnimated(): boolean;
  /** True while a size or opacity is still on its way to its target. */
  isMoving(): boolean;
  sync(nodes: NodeDraw[]): void;
  /** Moves size and opacity toward their targets and pulses the rings (`ringPhase` 0 to 1). Returns true while something still moves. */
  tick(deltaMs: number, ringPhase: number, bob: number): boolean;
};

/** Draws the point symbols with their names. Size and opacity follow smoothly, only changed points are repainted. */
export function createNodeLayer(texts: TextPool): NodeLayer {
  const container = new Container();
  let animate = true;

  const slots = createSlotMap<NodeDraw, NodeSlot>({
    create(node) {
      const slot = createNodeSlot(node);
      container.addChild(slot.root);
      return slot;
    },
    destroy: (slot) => destroyNodeSlot(slot, texts),
  });

  const update = (slot: NodeSlot, node: NodeDraw) => {
    slot.node = node;
    if (!animate) {
      slot.alpha = node.alpha;
      slot.scale = node.scale;
    }
    paintNode(slot, texts);
    placeNode(slot);
  };

  return {
    container,
    setAnimate: (on) => {
      animate = on;
    },
    isAnimated: () => animate && slots.values().some((slot) => slot.node.pulse),
    isMoving: () => animate && slots.values().some(isFollowing),
    sync: (nodes) => slots.sync(nodes, update),

    tick(deltaMs, ringPhase, bob) {
      // Every slot must follow, so collect the results first and only then ask whether any is still moving
      const moving = slots.values().map((slot) => tickNode(slot, deltaMs, ringPhase, bob));
      return moving.some(Boolean);
    },
  };
}
