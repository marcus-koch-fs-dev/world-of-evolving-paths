export type WorldSignal = {
  /** The points were laid out again or moved. */
  notify(): void;
  /** Calls the listener on every notification. Returns a function that stops listening. */
  subscribe(listener: () => void): () => void;
  /** Increases with every notification. */
  version(): number;
};

/** A version number with listeners: how the controls learn that the points changed. */
export function createWorldSignal(): WorldSignal {
  let version = 0;
  const listeners = new Set<() => void>();

  return {
    notify() {
      version += 1;
      listeners.forEach((listener) => {
        listener();
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    version: () => version,
  };
}
