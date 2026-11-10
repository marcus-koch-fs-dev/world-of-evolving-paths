import { describe, expect, it } from 'vitest';
import { hitLead } from './hit.js';
import type { EdgeDraw, LeadDraw } from './types.js';

const after: LeadDraw = {
  id: 'lead:after:a:0',
  pointId: 'a',
  lead: { title: 'Goal', date: '2027-01-05', id: 'goal' },
  x: 628,
  y: 100,
  text: 'Goal · 5.1.',
  side: 'after',
  anchor: { x: 0, y: 0.5 },
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
};

const line = (id: string, from: number, to: number): EdgeDraw =>
  ({
    id,
    points: [
      { x: from, y: 100 },
      { x: (from + to) / 2, y: 100 },
      { x: to, y: 100 },
    ],
  }) as unknown as EdgeDraw;

const edges = [line('a->lead:after:a:0', 400, 620), line('lead:before:a:0->a', 180, 400)];

describe('Hit test of the lines that leave the view', () => {
  describe('when the pointer is on a label', () => {
    it('hits a label that grows to the right of its anchor', () => {
      expect(hitLead([after], edges, { x: 660, y: 100 })?.id).toBe('lead:after:a:0');
    });

    it('hits a label that grows to the left of its anchor', () => {
      expect(hitLead([before], edges, { x: 130, y: 100 })?.id).toBe('lead:before:a:0');
    });

    it('misses the space on the other side of the anchor', () => {
      expect(hitLead([after], [], { x: 560, y: 100 })).toBeNull();
    });
  });

  describe('when the pointer is on the line', () => {
    it('hits it, also a little beside it', () => {
      expect(hitLead([after], edges, { x: 500, y: 106 })?.id).toBe('lead:after:a:0');
    });

    it('misses it when the pointer is far from the line', () => {
      expect(hitLead([after], edges, { x: 500, y: 160 })).toBeNull();
    });
  });

  describe('when there is nothing', () => {
    it('hits nothing', () => {
      expect(hitLead([], [], { x: 0, y: 0 })).toBeNull();
    });
  });
});
