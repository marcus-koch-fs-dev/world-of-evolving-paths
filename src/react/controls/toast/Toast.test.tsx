import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Toast } from './Toast.js';

describe('Toast', () => {
  it('shows nothing without a message', () => {
    expect(renderToStaticMarkup(<Toast message={null} onDismiss={() => undefined} />)).toBe('');
  });

  it('shows the message with a button to dismiss it', () => {
    const html = renderToStaticMarkup(<Toast message="Saved" onDismiss={() => undefined} />);

    expect(html).toContain('role="status"');
    expect(html).toContain('Saved');
    expect(html).toContain('aria-label="Dismiss"');
  });
});
