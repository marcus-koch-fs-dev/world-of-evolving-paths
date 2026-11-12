import type { Store } from '../../core/store/types.js';

/** What the model was configured with last time. */
export type ConfigSnapshot = {
  store: Store | undefined;
  view: string | null;
  today: string;
  pathIds: readonly string[] | undefined;
};

export type ConfigInput = { store: Store; view: string; today: string; pathIds: readonly string[] | undefined };

export type ConfigDelta = {
  dataChanged: boolean;
  viewChanged: boolean;
  todayChanged: boolean;
  pathsChanged: boolean;
};

export const EMPTY_SNAPSHOT: ConfigSnapshot = { store: undefined, view: null, today: '', pathIds: undefined };

/** What differs between the last configuration and a new one. The data counts as changed when it is another object. */
export function configDelta(previous: ConfigSnapshot, next: ConfigInput): ConfigDelta {
  return {
    dataChanged: next.store !== previous.store,
    viewChanged: next.view !== previous.view,
    todayChanged: next.today !== previous.today,
    pathsChanged: next.pathIds !== previous.pathIds,
  };
}

/** Did anything change at all? */
export const anyChange = (delta: ConfigDelta): boolean => Object.values(delta).some(Boolean);
