import type { Shape } from '../shapes.js';
import type { Lead, Position } from '../types.js';

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

/** The label at the end of a line that leaves the view: the title and date of the point out there. */
export type LeadDraw = {
  id: string;
  /** The point the line leaves from, and what the app told about the point out there. */
  pointId: string;
  lead: Lead;
  /** Where the label sits. The line ends a little before it, at `end`. */
  x: number;
  y: number;
  text: string;
  /** The line itself, from the point to its end, so a click on it can be found. */
  line: Position[];
  /** The end of the line, where the arrow sits. */
  end: Position;
  /** The direction out of the view, as a unit vector on the screen. The arrow points that way. */
  outward: Position;
  /** Color of the line and the arrow. */
  color: string;
  /** The pointer is on the line, so the arrow and the text stand out. */
  hovered: boolean;
  /** Before the point in time (incoming) or after it (outgoing). */
  side: 'before' | 'after';
  /** Which spot of the text sits on x and y, 0 to 1 each, so the text grows away from the point. */
  anchor: Position;
  /** For a line that spans the whole view: both points it leads from and to, as `pointId` is empty then. */
  span?: { from: Lead; to: Lead };
  /** The key of the line among the lines that run along the time axis. The end of the line can be dragged by it. */
  trackKey: string;
  /** The y of the lane of the path the line belongs to. A height in the data is a distance from it. */
  lane: number;
};

export type SceneState = {
  /** Slight wave on the lines. */
  wave: boolean;
  hovered: string | null;
  dragging: string | null;
  /** Language of the dates under the points, such as de. Default: the browser's. */
  locale?: string;
  /** Writes the date under a point instead of the built-in short form. */
  formatDate?: (iso: string) => string;
  /** Heights the user is dragging lines to right now, by `trackKey` of the line. */
  lineOverrides?: ReadonlyMap<string, number>;
};

export type Scene = { edges: EdgeDraw[]; nodes: NodeDraw[]; heres: HereDraw[]; rings: RingDraw[]; leads: LeadDraw[] };
