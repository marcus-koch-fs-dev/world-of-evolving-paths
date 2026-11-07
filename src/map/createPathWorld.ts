import type { PathWorldHandle, PathWorldOptions } from './options';
import { PathWorldEngine } from './PathWorldEngine';

/**
 * Mounts the map on an element. Works with any framework, or none.
 * The element needs a size. Call `handle.update(options)` whenever your data or options change,
 * and `handle.destroy()` when you remove the element.
 */
export function createPathWorld(container: HTMLElement, options: PathWorldOptions): PathWorldHandle {
  return new PathWorldEngine(container, options);
}
