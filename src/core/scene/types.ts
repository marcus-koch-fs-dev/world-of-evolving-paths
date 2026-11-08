import type { Shape } from '../shapes.js';
import type { Position } from '../types.js';

export type Dash = [on: number, off: number];

export type EdgeDraw = {
  id: string;
  from: string;
  to: string;
  points: Position[];
  color: string;
  width: number;
  alpha: number;
  dash: Dash | null;
  /** The dash pattern moves along the line (open connections). */
  flow: boolean;
  /** The part of the line that has been walked. */
  lit: { points: Position[]; color: string; width: number } | null;
  /** Glow strength around the lit part, 0 for none. */
  glow: number;
};

export type NodeDraw = {
  id: string;
  x: number;
  y: number;
  shape: Shape;
  /** Diameter of the symbol in world units. */
  size: number;
  /** Radius of the shape in symbol units (viewBox 72). */
  radius: number;
  stroke: string;
  /** Thickness of the outline in symbol units. Grows with the strength of the path that arrives at the point. */
  outlineWidth: number;
  fill: string | null;
  dash: Dash | null;
  shapeAlpha: number;
  alpha: number;
  scale: number;
  pulse: boolean;
  arrow: boolean;
  glyph: '✓' | null;
  title: string;
  date: string;
};

export type HereDraw = {
  id: string;
  x: number;
  y: number;
  /** Radius of the pulsing ring. Small in free space; as big as the symbol when the marker rests on a point. */
  radius: number;
  /** The marker rests on a point, so its ring starts at the edge of that point's symbol. */
  onPoint: boolean;
};

/** A thin circle that shows how much room a point keeps around it. */
export type RingDraw = { id: string; x: number; y: number; radius: number; dragged: boolean };

export type SceneState = {
  /** Slight wave on the lines. */
  wave: boolean;
  hovered: string | null;
  dragging: string | null;
  /** Language of the dates under the points, such as de. Default: the browser's. */
  locale?: string;
  /** Writes the date under a point instead of the built-in short form. */
  formatDate?: (iso: string) => string;
};

export type Scene = { edges: EdgeDraw[]; nodes: NodeDraw[]; heres: HereDraw[]; rings: RingDraw[] };
