import { useEffect } from 'react';

/** Sets the size of the page font, so every rem on the page, and with it every control, scales. */
export function useUiScale(percent: number) {
  useEffect(() => {
    document.documentElement.style.fontSize = `${percent}%`;
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [percent]);
}
