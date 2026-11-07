import { describe, expect, it } from 'vitest';
import { TURNS } from '../orientation.js';
import { turnScene } from './turn.js';
import type { Scene } from './types.js';

const scene = {
  edges: [
    {
      id: 'a->b',
      points: [
        { x: 0, y: 10 },
        { x: 5, y: 20 },
      ],
      lit: { points: [{ x: 1, y: 2 }], color: '#fff', width: 3 },
    },
    { id: 'b->c', points: [{ x: 3, y: 4 }], lit: null },
  ],
  nodes: [{ id: 'a', x: 1, y: 2, title: 'A' }],
  heres: [{ id: 'h', x: 7, y: 9 }],
  rings: [{ id: 'r', x: 4, y: 6, radius: 30, dragged: false }],
} as unknown as Scene;

describe('Turning the scene', () => {
  it('turns every position and keeps everything else', () => {
    const turned = turnScene(scene, TURNS.vertical.toScreen);

    expect(turned.edges[0].points).toEqual([
      { x: 10, y: 0 },
      { x: 20, y: 5 },
    ]);
    expect(turned.edges[0].lit?.points).toEqual([{ x: 2, y: 1 }]);
    expect(turned.edges[1].lit).toBeNull();
    expect(turned.nodes[0]).toMatchObject({ id: 'a', x: 2, y: 1, title: 'A' });
    expect(turned.heres[0]).toEqual({ id: 'h', x: 9, y: 7 });
    expect(turned.rings[0]).toMatchObject({ x: 6, y: 4, radius: 30 });
  });

  it('gives the original after turning there and back, also upside down', () => {
    const { toScreen, toLayout } = TURNS['vertical-inverted'];

    expect(turnScene(turnScene(scene, toScreen), toLayout)).toEqual(scene);
  });
});
