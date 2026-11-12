import type { Turn } from '../../core/orientation.js';
import { targetOfLead } from '../../core/scene/lineTarget.js';
import type { LeadDraw } from '../../core/scene/types.js';
import type { PlacedPoint } from '../../core/types.js';
import type { LineEndHeight } from '../options.js';

/**
 * The height of the end of every line that leaves the view or comes in from outside it, as a distance from the lane of
 * its path. The line that is being dragged counts with the height it had when it was taken (`dragged`), so all heights
 * are those from before the move. Lines across the whole view are left out, except the two ends of the one in
 * `through`: it is being moved as a whole.
 */
export function lineEndHeights(
  leads: readonly LeadDraw[],
  byId: ReadonlyMap<string, PlacedPoint>,
  toLayout: Turn,
  dragged: { key: string; startY: number },
  through?: { keys: ReadonlySet<string>; startYs: ReadonlyMap<string, number> },
): LineEndHeight[] {
  return leads.flatMap((lead): LineEndHeight[] => {
    if (lead.span && !through?.keys.has(lead.trackKey)) return [];
    const target = targetOfLead(lead, byId);
    if (!target) return [];
    const startY = through?.startYs.get(lead.trackKey);
    const y = startY ?? (lead.trackKey === dragged.key ? dragged.startY : Math.round(toLayout(lead.end).y));
    return [{ ...target, y: y - Math.round(lead.lane), ...(lead.span ? { side: lead.side } : {}) }];
  });
}
