import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MoveLock } from './MoveLock.js';

describe('MoveLock', () => {
  it('offers to unlock while things are fixed', () => {
    const html = renderToStaticMarkup(<MoveLock locked onToggle={() => undefined} />);

    expect(html).toContain('aria-label="Unlock to move points and paths"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain('is-active');
  });

  it('shows itself as switched on while things can be moved', () => {
    const html = renderToStaticMarkup(<MoveLock locked={false} onToggle={() => undefined} />);

    expect(html).toContain('aria-label="Lock points and paths"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('is-active');
  });
});
