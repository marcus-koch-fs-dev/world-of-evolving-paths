import { type Shortcut, shortcutFor } from './shortcuts.js';

type Dependencies = {
  root: HTMLElement;
  /** False when the app turned the shortcuts off. */
  enabled(): boolean;
  onShortcut(shortcut: Shortcut): void;
};

export type Keyboard = { destroy(): void };

/**
 * Listens for the shortcut keys. They belong to this map only while the pointer is over it
 * or the focus is inside it, so several maps on a page do not answer the same key.
 */
export function createKeyboard({ root, enabled, onShortcut }: Dependencies): Keyboard {
  let pointerInside = false;
  const enter = () => {
    pointerInside = true;
  };
  const leave = () => {
    pointerInside = false;
  };
  const isActive = () => pointerInside || root.contains(document.activeElement);

  const onKey = (event: KeyboardEvent) => {
    const shortcut = shortcutFor(event, enabled() && isActive());
    if (shortcut) onShortcut(shortcut);
  };

  root.addEventListener('pointerenter', enter);
  root.addEventListener('pointerleave', leave);
  window.addEventListener('keydown', onKey);

  return {
    destroy() {
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('pointerenter', enter);
      root.removeEventListener('pointerleave', leave);
    },
  };
}
