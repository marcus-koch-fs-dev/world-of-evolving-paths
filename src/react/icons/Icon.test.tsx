import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon.js';
import { ICON_DATA } from './iconData.js';

describe('Icon', () => {
  it('draws the regular shape in the text color and hides itself from screen readers', () => {
    const html = renderToStaticMarkup(<Icon name="lock" />);

    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(`d="${ICON_DATA.lock.regular[0]}"`);
  });

  it('draws the solid shape for the fill weight', () => {
    const html = renderToStaticMarkup(<Icon name="unlock" weight="fill" />);

    expect(html).toContain(`d="${ICON_DATA.unlock.fill[0]}"`);
    expect(html).not.toContain(`d="${ICON_DATA.unlock.regular[0]}"`);
  });

  it('has both shapes for every icon', () => {
    const all: [string, { regular: readonly string[]; fill: readonly string[] }][] = Object.entries(ICON_DATA);
    const missing = all.filter(([, shapes]) => shapes.regular.length === 0 || shapes.fill.length === 0);

    expect(missing).toEqual([]);
  });
});
