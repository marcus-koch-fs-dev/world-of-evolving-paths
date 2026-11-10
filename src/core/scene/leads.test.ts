import { describe, expect, it } from 'vitest';
import { makePath, makePoint } from '../../../tests/fixtures.js';
import { TIERS } from '../strength.js';
import type { PlacedPoint, PlacedWorld } from '../types.js';
import { buildScene } from './buildScene.js';
import { leadAnchor } from './leads.js';
import type { SceneState } from './types.js';

const calm: SceneState = { wave: false, hovered: null, dragging: null, locale: 'de' };

function placed(overrides: Partial<PlacedPoint> & { id: string }, x = 400, y = 100): PlacedPoint {
  const { x: _x, y: _y, ...rest } = makePoint(overrides);
  return { ...rest, x, y };
}

const worldOf = (points: PlacedPoint[], today = '2026-11-10'): PlacedWorld => ({
  today,
  paths: [makePath('combat', '#ff3b3b')],
  points,
});

describe('Lines that leave the view', () => {
  describe('when no point has leads', () => {
    it('adds nothing to the scene', () => {
      const scene = buildScene(worldOf([placed({ id: 'a' })]), calm);

      expect(scene.edges).toEqual([]);
      expect(scene.leads).toEqual([]);
    });
  });

  describe('when a point comes from outside the view', () => {
    const point = placed({
      id: 'a',
      status: 'done',
      date: '2026-11-04',
      incoming: [{ title: '5 pull-ups', date: '2026-03-23' }],
    });

    it('draws a line from the left edge in time to the point', () => {
      const [edge] = buildScene(worldOf([point]), calm).edges;

      expect(edge.to).toBe('a');
      expect(edge.points[0]).toEqual({ x: 180, y: 100 });
      expect(edge.points.at(-1)).toEqual({ x: 400, y: 100 });
    });

    it('labels the end of the line with the title and date, and the text grows away from the point', () => {
      const [label] = buildScene(worldOf([point]), calm).leads;

      expect(label).toMatchObject({ text: '5 pull-ups · 23.3.', side: 'before', x: 164, y: 100 });
      expect(label.anchor).toEqual({ x: 1, y: 0.5 });
    });

    it('draws it like a walked connection, because the point has been reached', () => {
      const [edge] = buildScene(worldOf([point]), calm).edges;

      expect(edge.dash).toBeNull();
      expect(edge.lit).not.toBeNull();
    });
  });

  describe('when a line leaves the view', () => {
    it('ends in an arrow that points out of the view, on the end of the line', () => {
      const point = placed({
        id: 'a',
        incoming: [{ title: 'Start', date: '2026-03-23' }],
        outgoing: [{ title: 'Goal', date: '2027-01-05' }],
      });

      const [before, after] = buildScene(worldOf([point]), calm).leads;

      expect(before).toMatchObject({ end: { x: 180, y: 100 }, outward: { x: -1, y: 0 } });
      expect(after).toMatchObject({ end: { x: 620, y: 100 }, outward: { x: 1, y: 0 } });
    });

    it('gives the arrow the color of its line', () => {
      const point = placed({ id: 'a', status: 'done', incoming: [{ title: 'Start', date: '2026-03-23' }] });

      const scene = buildScene(worldOf([point]), calm);

      expect(scene.leads[0].color).toBe(scene.edges[0].color);
    });

    it('stands out while the pointer is on it', () => {
      const point = placed({ id: 'a', outgoing: [{ title: 'Goal', date: '2027-01-05' }] });

      const [quiet] = buildScene(worldOf([point]), calm).leads;
      const [lit] = buildScene(worldOf([point]), { ...calm, hovered: quiet.id }).leads;

      expect(quiet.hovered).toBe(false);
      expect(lit.hovered).toBe(true);
    });
  });

  describe('when the app gives the id of the point out there', () => {
    it('keeps it with the label, together with the point the line leaves from', () => {
      const point = placed({ id: 'a', incoming: [{ title: 'Start', date: '2026-03-23', id: 'start' }] });

      const [label] = buildScene(worldOf([point]), calm).leads;

      expect(label.pointId).toBe('a');
      expect(label.lead).toEqual({ title: 'Start', date: '2026-03-23', id: 'start' });
    });
  });

  describe('when a point leads to something outside the view', () => {
    it('draws an open, dotted line to the right edge if that point lies in the future', () => {
      const point = placed({ id: 'a', status: 'current', outgoing: [{ title: 'Goal', date: '2027-01-05' }] });

      const scene = buildScene(worldOf([point]), calm);

      expect(scene.edges[0].points.at(-1)).toEqual({ x: 620, y: 100 });
      expect(scene.edges[0].dash).not.toBeNull();
      expect(scene.edges[0].flow).toBe(true);
      expect(scene.leads[0]).toMatchObject({ side: 'after', x: 636 });
      expect(scene.leads[0].anchor).toEqual({ x: 0, y: 0.5 });
    });

    it('draws it as a walked line if that point lies in the past', () => {
      const point = placed({
        id: 'a',
        status: 'done',
        date: '2026-02-02',
        outgoing: [{ title: 'Later', date: '2026-03-01' }],
      });

      const [edge] = buildScene(worldOf([point]), calm).edges;

      expect(edge.dash).toBeNull();
    });

    it('keeps the width of the strength of the path, so a strong path does not get thin at the edge', () => {
      const point = placed({
        id: 'a',
        status: 'done',
        date: '2026-02-02',
        strength: 4,
        outgoing: [{ title: 'Later', date: '2026-03-01' }],
      });

      const [edge] = buildScene(worldOf([point]), calm).edges;

      expect(edge.lit?.width).toBe(TIERS[4].width);
    });
  });

  describe('when a point has several leads on one side', () => {
    it('spreads the ends so the labels do not overlap, around the height of the point', () => {
      const point = placed({
        id: 'a',
        outgoing: [
          { title: 'One', date: '2027-01-05' },
          { title: 'Two', date: '2027-01-06' },
          { title: 'Three', date: '2027-01-07' },
        ],
      });

      const ys = buildScene(worldOf([point]), calm).leads.map((lead) => lead.y);

      expect(ys).toEqual([56, 100, 144]);
    });
  });

  describe('when the app writes the dates itself', () => {
    it('uses its function for the date in the label', () => {
      const point = placed({ id: 'a', incoming: [{ title: 'Start', date: '2026-03-23' }] });

      const [label] = buildScene(worldOf([point]), { ...calm, formatDate: (iso) => `on ${iso}` }).leads;

      expect(label.text).toBe('Start · on 2026-03-23');
    });
  });

  describe('when the marker for today is placed', () => {
    it('ignores the lines that leave the view', () => {
      const withLead = placed({ id: 'a', status: 'current', outgoing: [{ title: 'Goal', date: '2026-12-01' }] });
      const without = placed({ id: 'a', status: 'current' });

      const marked = buildScene(worldOf([withLead]), calm).heres;

      expect(marked).toEqual(buildScene(worldOf([without]), calm).heres);
    });
  });

  describe('leadAnchor', () => {
    it('puts the text before the point when time runs to the right, and after it for the other side', () => {
      expect(leadAnchor('before', { x: 1, y: 0 })).toEqual({ x: 1, y: 0.5 });
      expect(leadAnchor('after', { x: 1, y: 0 })).toEqual({ x: 0, y: 0.5 });
    });

    it('mirrors when time runs to the left', () => {
      expect(leadAnchor('before', { x: -1, y: 0 })).toEqual({ x: 0, y: 0.5 });
    });
  });
});
