import { useLayoutEffect, useState } from 'react';

/**
 * An element that holds a bar and sits inside the dock container. Moving to another edge moves that element, so
 * React keeps the bar (collapsed or not, panel open or not) instead of building it again.
 */
export function usePortalHost(container: HTMLElement | undefined): HTMLElement {
  const [host] = useState(() => {
    const element = document.createElement('div');
    element.style.display = 'contents';
    return element;
  });
  useLayoutEffect(() => {
    container?.appendChild(host);
    return () => host.remove();
  }, [container, host]);
  return host;
}
