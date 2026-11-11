import { describe, expect, it } from 'vitest';
import { makePath, makePoint } from '../../../tests/fixtures.js';
import { toDay } from '../dates.js';
import { TIERS } from '../strength.js';
import type { PlacedPoint, PlacedWorld } from '../types.js';
import { buildScene } from './buildScene.js';
import { cutAt, dashSegments, polylineLength, sampleEdge } from './curves.js';
import { hitNode } from './hit.js';
import type { SceneState } from './types.js';

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

    it('marks every point that is done with a check, whatever its kind', () => {
      const kinds = ['start', 'milestone', 'crossroad', 'goal'] as const;
      const points = kinds.map((kind, index) => placed({ id: kind, kind, status: 'done' }, index * 100));

      const nodes = buildScene(worldOf(points), calm).nodes;

      expect(nodes.map((node) => node.glyph)).toEqual(['✓', '✓', '✓', '✓']);
    });

    it('leaves the others without a check: current, open and abandoned', () => {
      const statuses = ['current', 'open', 'abandoned'] as const;
      const points = statuses.map((status, index) => placed({ id: status, status }, index * 100));

      const nodes = buildScene(worldOf(points), calm).nodes;

      expect(nodes.map((node) => node.glyph)).toEqual([null, null, null]);
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

    describe('when the line to the goal comes in from outside the view', () => {
      const november = { start: toDay('2026-11-01'), end: toDay('2026-11-30') };
      const goal = placed(
        {
          id: 'goal',
          kind: 'goal',
          status: 'open',
          date: '2026-11-15',
          incoming: [{ title: 'Start', date: '2026-10-15' }],
        },
        60 + (14.5 / 30) * 2080, // where 15 November lies on the axis
        40,
      );

      it('sits on that line, shortly before the goal, not on the goal', () => {
        const world = { ...worldOf([goal], '2026-11-11'), period: november };

        const [here] = buildScene(world, calm).heres;

        // The line runs from the left edge of the view to the goal. Day 11 of 30 on a tile 2200 wide, 60 padding
        expect(here.x).toBeCloseTo(60 + (10.5 / 30) * 2080, 0);
        expect(here.x).toBeLessThan(60 + (14.5 / 30) * 2080);
        // The line leaves the lane of the path at the edge and bends to the goal, so the marker is on the way
        expect(here.y).toBeGreaterThan(0);
        expect(here.y).toBeLessThan(40);
        expect(here.onPoint).toBe(false);
      });

      it('meets the edge of the view on the lane of the path, whatever the height of the goal', () => {
        const high = { ...goal, y: -300 };
        const low = { ...goal, y: 300 };

        const [fromHigh] = buildScene({ ...worldOf([high], '2026-11-11'), period: november }, calm).leads;
        const [fromLow] = buildScene({ ...worldOf([low], '2026-11-11'), period: november }, calm).leads;

        expect(fromHigh.end.y).toBe(fromLow.end.y);
      });

      it('is lit only up to the marker for today, not beyond it', () => {
        const world = { ...worldOf([goal], '2026-11-11'), period: november };

        const scene = buildScene(world, calm);
        const lit = scene.edges.find((edge) => edge.to === 'goal')?.lit;

        expect(lit?.points.at(-1)?.x).toBeCloseTo(scene.heres[0].x, 0);
      });

      it('runs from the left edge of the view, not a short stretch', () => {
        const world = { ...worldOf([goal], '2026-11-11'), period: november };

        const [lead] = buildScene(world, calm).leads;

        expect(lead.end.x).toBeCloseTo(60 + (0.5 / 30) * 2080, 0);
      });

      it('keeps a short stretch when the point is at the edge', () => {
        const atEdge = { ...goal, x: 70 };
        const world = { ...worldOf([atEdge], '2026-11-11'), period: november };

        const [lead] = buildScene(world, calm).leads;

        expect(lead.end.x).toBeLessThan(70);
      });
    });

    describe('in a view that does not cover today', () => {
      const points = [
        placed({ id: 'a', status: 'done', date: '2026-11-02', next: ['b'] }, 0),
        placed({ id: 'b', status: 'done', date: '2026-11-05' }, 400),
      ];
      const lastWeek = { start: toDay('2026-11-02'), end: toDay('2026-11-08') };

      it('shows no marker, not even on the nearest point', () => {
        const world = { ...worldOf(points, '2026-11-11'), period: lastWeek };

        expect(buildScene(world, calm).heres).toEqual([]);
      });

      it('shows the marker when the view covers today', () => {
        const world = { ...worldOf(points, '2026-11-08'), period: lastWeek };

        expect(buildScene(world, calm).heres).toHaveLength(1);
      });
    });
  });

  describe('when the wave is on', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 400, y: 100 };

    it('keeps both ends exactly on the points', () => {
      const line = sampleEdge(from, to, 'a-b');

      expect(line[0]).toEqual(from);
      expect(line.at(-1)).toEqual(to);
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
  });
});
