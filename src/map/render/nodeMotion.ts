import { SYMBOL_UNITS } from '../../core/symbol.js';
import { ARROW_LIFT, ARROW_X, type NodeSlot } from './paintNode.js';
import { NODE_PULSE, pulseRing } from './pulse.js';
import { approach, followShare, isApproaching } from './timing.js';

const SCALE_TAU = 60; // ms, how fast the size follows
const ALPHA_TAU = 250; // ms, how fast the opacity follows
const SCALE_STEP = 0.002;
const ALPHA_STEP = 0.003;
const ARROW_BOB = 6;

/** Puts the root of a slot where its node is, with the opacity and size it has now. */
export function placeNode(slot: NodeSlot): void {
  const { node } = slot;
  slot.root.position.set(node.x, node.y);
  slot.root.alpha = slot.alpha;
  slot.marker.scale.set((node.size / SYMBOL_UNITS) * slot.scale);
}

/** Is the size or opacity of a slot still on its way to the node's? */
export const isFollowing = (slot: NodeSlot) =>
  isApproaching(slot.scale, slot.node.scale, SCALE_STEP) || isApproaching(slot.alpha, slot.node.alpha, ALPHA_STEP);

/** Moves the size and opacity of a slot toward the node's. Returns true while it is still on its way. */
export function followNode(slot: NodeSlot, deltaMs: number): boolean {
  const moving = isFollowing(slot);
  slot.scale = approach(slot.scale, slot.node.scale, followShare(deltaMs, SCALE_TAU), SCALE_STEP);
  slot.alpha = approach(slot.alpha, slot.node.alpha, followShare(deltaMs, ALPHA_TAU), ALPHA_STEP);
  return moving;
}

/** One frame of a slot: follow the node, pulse the ring, bob the arrow. Returns true while the slot still moves. */
export function tickNode(slot: NodeSlot, deltaMs: number, ringPhase: number, bob: number): boolean {
  const moving = followNode(slot, deltaMs);
  placeNode(slot);
  if (slot.ring) pulseRing(slot.ring, ringPhase, NODE_PULSE);
  if (slot.arrow) slot.arrow.position.set(ARROW_X, -slot.node.size / 2 - ARROW_LIFT - ARROW_BOB * bob);
  return moving;
}
