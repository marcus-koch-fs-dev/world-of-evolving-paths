import { describe, expect, it } from 'vitest';
import { makePath, makePoint } from '../../../tests/fixtures';
import { TIERS } from '../strength';
import type { PlacedPoint, PlacedWorld } from '../types';
import { buildScene } from './buildScene';
import { cutAt, dashSegments, polylineLength, sampleEdge } from './curves';
import { hitEdge, hitNode } from './hit';
import type { SceneState } from './types';

const calm: SceneState = { wave: false, hovered: null, dragging: null };

function placed(overrides: Partial<PlacedPoint> & { id: string }, x: number, y = 0): PlacedPoint {
  const { x: _x, y: _y, ...rest } = makePoint(overrides);
  return { ...rest, x, y };
}

function worldOf(points: PlacedPoint[], today = '2026-11-10'): PlacedWorld {
  return { today, paths: [makePath('combat', '#ff3b3b')], points };
}

describe('Scene', () => {
  describe('when a connection has been walked', () => {
    const points = [
      placed({ id: 'a', status: 'done', date: '2026-11-02', next: ['b'] }, 0),
      placed({ id: 'b', status: 'done', date: '2026-11-05', strength: 4 }, 300),
    ];

    it('takes the width and glow of its strength tier', () => {
      const [edge] = buildScene(worldOf(points), calm).edges;

      expect(edge.lit?.width).toBe(TIERS[4].width);
      expect(edge.glow).toBe(TIERS[4].glow);
    });

    it('lights the whole line once today is past the end', () => {
      const [edge] = buildScene(worldOf(points), calm).edges;

      expect(edge.lit?.points).toEqual(edge.points);
    });

    it('uses the default width and glow without a strength', () => {
      const plain = [points[0], { ...points[1], strength: undefined }];

      const [edge] = buildScene(worldOf(plain), calm).edges;

      expect(edge.lit?.width).toBe(4);
      expect(edge.glow).toBe(0.3);
    });
  });

  describe('when a connection is still open', () => {
    const points = [
      placed({ id: 'a', status: 'done', date: '2026-11-02', next: ['b'] }, 0),
      placed({ id: 'b', status: 'open', date: '2026-11-20' }, 300),
    ];

    it('is thin, dotted and moving', () => {
      const [edge] = buildScene(worldOf(points, '2026-11-02'), calm).edges;

      expect(edge.dash).toEqual([2, 10]);
      expect(edge.flow).toBe(true);
      expect(edge.width).toBe(3);
    });

    it('is not lit before today reaches it', () => {
      const [edge] = buildScene(worldOf(points, '2026-11-01'), calm).edges;

      expect(edge.lit).toBeNull();
    });
  });

  describe('when the pointer is over a point', () => {
    it('highlights the lines that touch it', () => {
      const points = [placed({ id: 'a', next: ['b'] }, 0), placed({ id: 'b' }, 300)];

      const [edge] = buildScene(worldOf(points), { ...calm, hovered: 'a' }).edges;

      expect(edge.color).toBe('#ffffff');
    });

    it('enlarges the point', () => {
      const points = [placed({ id: 'a' }, 0)];

      const [node] = buildScene(worldOf(points), { ...calm, hovered: 'a' }).nodes;

      expect(node.scale).toBeGreaterThan(1);
    });
  });

  describe('when choosing a shape', () => {
    const shapeOfNode = (point: PlacedPoint) => buildScene(worldOf([point]), calm).nodes[0].shape;

    it('uses a triangle for a start', () => {
      expect(shapeOfNode(placed({ id: 's', kind: 'start' }, 0))).toBe('triangle');
    });

    it('uses a star for a goal', () => {
      expect(shapeOfNode(placed({ id: 'g', kind: 'goal' }, 0))).toBe('star');
    });

    it('uses a diamond for a point with two ways on', () => {
      expect(shapeOfNode(placed({ id: 'f', next: ['x', 'y'] }, 0))).toBe('diamond');
    });

    it('marks a reached goal with a check', () => {
      const [node] = buildScene(worldOf([placed({ id: 'g', kind: 'goal', status: 'done' }, 0)]), calm).nodes;

      expect(node.glyph).toBe('✓');
    });

    it('pulses at the current point', () => {
      const [node] = buildScene(worldOf([placed({ id: 'c', status: 'current' }, 0)]), calm).nodes;

      expect(node.pulse).toBe(true);
      expect(node.arrow).toBe(true);
    });
  });

  describe('when showing today', () => {
    it('sits on the connection that spans today', () => {
      const points = [
        placed({ id: 'a', status: 'done', date: '2026-11-02', next: ['b'] }, 0),
        placed({ id: 'b', status: 'open', date: '2026-11-12' }, 400),
      ];

      const { heres } = buildScene(worldOf(points, '2026-11-07'), calm);

      expect(heres).toHaveLength(1);
      expect(heres[0].x).toBeGreaterThan(100);
      expect(heres[0].x).toBeLessThan(300);
    });

    it('sits at the last point when today is past the path', () => {
      const points = [
        placed({ id: 'a', status: 'done', date: '2026-11-02', next: ['b'] }, 0),
        placed({ id: 'b', status: 'done', date: '2026-11-05' }, 400),
      ];

      const { heres } = buildScene(worldOf(points, '2026-12-01'), calm);

      expect(heres[0]).toMatchObject({ x: 400, y: 0 });
    });
  });

  describe('when the wave is on', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 400, y: 100 };

    it('keeps both ends exactly on the points', () => {
      const line = sampleEdge(from, to, 'a-b');

      expect(line[0]).toEqual(from);
      expect(line[line.length - 1]).toEqual(to);
    });

    it('bends the line away from the smooth curve', () => {
      expect(sampleEdge(from, to, 'a-b')).not.toEqual(sampleEdge(from, to));
    });

    it('gives the same wave for the same seed', () => {
      expect(sampleEdge(from, to, 'a-b')).toEqual(sampleEdge(from, to, 'a-b'));
    });
  });

  describe('when working with lines', () => {
    const line = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    it('cuts a line at half its length', () => {
      expect(polylineLength(cutAt(line, 0.5))).toBeCloseTo(50);
    });

    it('draws dashes as pieces that add up to the on-share', () => {
      const pieces = dashSegments(line, [10, 10]);

      const drawn = pieces.reduce((sum, [a, b]) => sum + Math.hypot(b.x - a.x, b.y - a.y), 0);
      expect(drawn).toBeCloseTo(50);
    });
  });

  describe('when finding what is under the pointer', () => {
    const points = [placed({ id: 'a', next: ['b'] }, 0), placed({ id: 'b' }, 300)];
    const scene = buildScene(worldOf(points), calm);

    it('hits a point inside its symbol', () => {
      expect(hitNode(scene.nodes, { x: 10, y: 5 })?.id).toBe('a');
    });

    it('misses empty space', () => {
      expect(hitNode(scene.nodes, { x: 150, y: 400 })).toBeNull();
    });

    it('hits a line near its path', () => {
      expect(hitEdge(scene.edges, { x: 150, y: 2 })?.id).toBe('a-b');
    });
  });
});
