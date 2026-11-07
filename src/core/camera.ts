import type { Position } from './types';

/** Screen = world * zoom + (x, y). */
export type Camera = { x: number; y: number; zoom: number };
export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3;

/** Fitting fills this share of the viewport, so the content keeps a frame around it. */
const FIT_FILL = 0.75;
/** A lone point or a tiny group is not blown up beyond this zoom when fitting. */
const MAX_FIT_ZOOM = 1.25;

/** Keeps a zoom factor inside the allowed range. */
export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function screenToWorld(camera: Camera, screenX: number, screenY: number): Position {
  return { x: (screenX - camera.x) / camera.zoom, y: (screenY - camera.y) / camera.zoom };
}

/** Zooms around a screen point: the world point under it stays where it is. */
export function zoomAt(camera: Camera, screenX: number, screenY: number, factor: number): Camera {
  const zoom = clampZoom(camera.zoom * factor);
  const ratio = zoom / camera.zoom;
  return { zoom, x: screenX - (screenX - camera.x) * ratio, y: screenY - (screenY - camera.y) * ratio };
}

/**
 * Zoom factor and movement of the midpoint between two fingers.
 * Zoom around the old midpoint (`px`, `py`) first, then move by (`dx`, `dy`).
 */
export function pinchStep(
  before: [Position, Position],
  after: [Position, Position],
): { factor: number; px: number; py: number; dx: number; dy: number } {
  const distanceBefore = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y);
  const distanceAfter = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
  const midBefore = { x: (before[0].x + before[1].x) / 2, y: (before[0].y + before[1].y) / 2 };
  const midAfter = { x: (after[0].x + after[1].x) / 2, y: (after[0].y + after[1].y) / 2 };
  return {
    factor: distanceBefore > 0 && distanceAfter > 0 ? distanceAfter / distanceBefore : 1,
    px: midBefore.x,
    py: midBefore.y,
    dx: midAfter.x - midBefore.x,
    dy: midAfter.y - midBefore.y,
  };
}

/** Camera that puts the middle of the bounds in the middle of the viewport. The zoom stays. */
export function centerOn(bounds: Bounds, viewportWidth: number, viewportHeight: number, zoom: number): Camera {
  return {
    zoom,
    x: viewportWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom,
    y: viewportHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom,
  };
}

/** Camera that fits the bounds into the viewport, leaving a frame of empty space around them. */
export function fitBounds(bounds: Bounds, viewportWidth: number, viewportHeight: number, fill = FIT_FILL): Camera {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const zoom = Math.min(
    MAX_FIT_ZOOM,
    clampZoom(Math.min((viewportWidth * fill) / width, (viewportHeight * fill) / height)),
  );
  return centerOn(bounds, viewportWidth, viewportHeight, zoom);
}
