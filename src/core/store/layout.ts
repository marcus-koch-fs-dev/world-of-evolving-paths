import type { Position } from '../types.js';
import type { Level, StorePath } from './types.js';

/** The height kept for a point on a level, or undefined. */
export const keptPointHeight = (path: StorePath, level: Level, id: string): number | undefined =>
  path.layout?.heights?.[level]?.points?.[id];

/** The height kept for an arrow on a level, or undefined. */
export const keptArrowHeight = (path: StorePath, level: Level, key: string): number | undefined =>
  path.layout?.heights?.[level]?.arrows?.[key];

/** The free place kept for a point, or undefined. */
export const keptFreePlace = (path: StorePath, id: string): Position | undefined => path.layout?.free?.[id];

/** The path an arrow belongs to: the key starts with its id (see `arrowKey`). */
export const pathOfArrow = (key: string): string => key.slice(0, key.indexOf('/'));
