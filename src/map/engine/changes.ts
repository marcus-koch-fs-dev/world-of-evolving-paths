import type { PathWorldOptions } from '../options.js';

/** Did an option change that alters how the scene looks, although the data and the view stayed the same? */
export function lookChanged(previous: PathWorldOptions, next: PathWorldOptions): boolean {
  return (
    (previous.wavy === true) !== (next.wavy === true) ||
    previous.locale !== next.locale ||
    previous.formatDate !== next.formatDate
  );
}
