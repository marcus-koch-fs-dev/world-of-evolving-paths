import { useEffect, useState } from 'react';

/**
 * State that survives a reload, kept in localStorage. The demo app does the storing, never the library.
 * Unreadable or missing data falls back to the initial value, with a warning in the console.
 */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`Could not read "${key}" from localStorage, using the default.`, error);
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not save "${key}" to localStorage, it is probably full.`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
