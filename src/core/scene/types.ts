import type { Shape } from '../shapes';
import type { Position } from '../types';

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

export type HereDraw = { id: string; x: number; y: number };

export type SceneState = {
  /** Slight wave on the lines. */
  wave: boolean;
  hovered: string | null;
  dragging: string | null;
};

export type Scene = { edges: EdgeDraw[]; nodes: NodeDraw[]; heres: HereDraw[] };
