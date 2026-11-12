import { describe, expect, it } from 'vitest';
import { hitLead, hitLeadEnd, hitLeadLine } from './hit.js';
import type { LeadDraw } from './types.js';

const after: LeadDraw = {
  id: 'lead:after:a:0',
  pointId: 'a',
  lead: { title: 'Goal', date: '2027-01-05', id: 'goal' },
  x: 628,
  y: 100,
  text: 'Goal · 5.1.',
  side: 'after',
  anchor: { x: 0, y: 0.5 },
  line: [
    { x: 400, y: 100 },
    { x: 510, y: 100 },
    { x: 620, y: 100 },
  ],
  end: { x: 620, y: 100 },
  outward: { x: 1, y: 0 },
  color: '#fff',
  hovered: false,
  trackKey: 'lead:after:a:0',
  lane: 0,
};

const before: LeadDraw = {
  id: 'lead:before:a:0',
  pointId: 'a',
  lead: { title: 'Start', date: '2026-01-05' },
  x: 172,
  y: 100,
  text: 'Start · 5.1.',
  side: 'before',
  anchor: { x: 1, y: 0.5 },
  line: [
    { x: 180, y: 100 },
    { x: 290, y: 100 },
    { x: 400, y: 100 },
  ],
  end: { x: 180, y: 100 },
  outward: { x: -1, y: 0 },
  color: '#fff',
  hovered: false,
  trackKey: 'lead:before:a:0',
  lane: 0,
};

describe('Hit test of the end of a line', () => {
  it('finds the line whose arrow is under the position', () => {
    expect(hitLeadEnd([before, after], { x: 616, y: 108 })?.trackKey).toBe('lead:after:a:0');
  });

  it('finds nothing on the line itself, away from its arrow', () => {
    expect(hitLeadEnd([before, after], { x: 500, y: 100 })).toBeNull();
  });

  it('finds the end of a line that spans the whole view', () => {
    const spanning: LeadDraw = { ...after, pointId: '', span: { from: before.lead, to: after.lead } };

    expect(hitLeadEnd([spanning], { x: 616, y: 108 })).toBe(spanning);
  });
});

describe('Hit test of the line itself, to move its path', () => {
  it('finds the line, also a little beside it', () => {
    expect(hitLeadLine([after], { x: 500, y: 106 })?.id).toBe('lead:after:a:0');
  });

  it('does not take the label of a line', () => {
    expect(hitLeadLine([{ ...after, line: [] }], { x: 660, y: 100 })).toBeNull();
  });

  it('finds a line across the whole view too', () => {
    const spanning: LeadDraw = { ...after, pointId: '', span: { from: before.lead, to: after.lead } };

    expect(hitLeadLine([spanning], { x: 500, y: 100 })).toBe(spanning);
  });
});

describe('Hit test of the lines that leave the view', () => {
  describe('when the pointer is on a label', () => {
    it('hits a label that grows to the right of its anchor', () => {
      expect(hitLead([after], { x: 660, y: 100 })?.id).toBe('lead:after:a:0');
    });

    it('hits a label that grows to the left of its anchor', () => {
      expect(hitLead([before], { x: 130, y: 100 })?.id).toBe('lead:before:a:0');
    });

    it('misses the space on the other side of the anchor', () => {
      expect(hitLead([{ ...after, line: [] }], { x: 560, y: 100 })).toBeNull();
    });
  });

  describe('when the pointer is on the line', () => {
    it('hits it, also a little beside it', () => {
      expect(hitLead([after], { x: 500, y: 106 })?.id).toBe('lead:after:a:0');
    });

    it('misses it when the pointer is far from the line', () => {
      expect(hitLead([after], { x: 500, y: 160 })).toBeNull();
    });
  });

  describe('when there is nothing', () => {
    it('hits nothing', () => {
      expect(hitLead([], { x: 0, y: 0 })).toBeNull();
    });
  });
});
