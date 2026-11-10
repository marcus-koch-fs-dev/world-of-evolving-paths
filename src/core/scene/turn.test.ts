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
  leads: [
    {
      id: 'l',
      x: 2,
      y: 8,
      text: 'Next · 1.2.',
      side: 'after',
      anchor: { x: 0, y: 0.5 },
      line: [
        { x: 0, y: 8 },
        { x: 1, y: 8 },
      ],
      end: { x: 0, y: 8 },
      outward: { x: 1, y: 0 },
    },
  ],
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

  it('turns a label with its point and lets the text grow away along the new direction of time', () => {
    const turned = turnScene(scene, TURNS.vertical.toScreen);

    // Time runs down the screen, so the text of a label after the point sits below it
    expect(turned.leads[0]).toMatchObject({ x: 8, y: 2, text: 'Next · 1.2.', anchor: { x: 0.5, y: 0 } });
  });

  it('turns the end of the line and the direction of the arrow, so it points out of the view on the screen', () => {
    const [down] = turnScene(scene, TURNS.vertical.toScreen).leads;
    const [left] = turnScene(scene, TURNS['horizontal-inverted'].toScreen).leads;

    expect(down).toMatchObject({ end: { x: 8, y: 0 }, outward: { x: 0, y: 1 } });
    expect(down.line).toEqual([
      { x: 8, y: 0 },
      { x: 8, y: 1 },
    ]);
    expect(left.outward).toEqual({ x: -1, y: 0 });
  });

  it('gives the original after turning there and back, also upside down', () => {
    const { toScreen, toLayout } = TURNS['vertical-inverted'];

    const back = turnScene(turnScene(scene, toScreen), toLayout);

    // The anchor of a label follows the direction of time of the last turn, so only its position is compared
    const withoutAnchors = (value: Scene) => ({
      ...value,
      leads: value.leads.map(({ anchor: _anchor, ...rest }) => rest),
    });
    expect(withoutAnchors(back)).toEqual(withoutAnchors(scene));
  });
});
