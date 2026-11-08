import type { PeriodData } from '../../core/types.js';

/** What the model was configured with last time. */
export type ConfigSnapshot = {
  raw: PeriodData | undefined;
  view: string | null;
  seed: number;
  today: string;
  /** The layout signature of the valid data (see `layoutSignature`). */
  signature: string;
};

export type ConfigInput = { raw: PeriodData | undefined; view: string; seed: number; today: string };

export type ConfigDelta = {
  dataChanged: boolean;
  viewChanged: boolean;
  seedChanged: boolean;
  todayChanged: boolean;
};

export const EMPTY_SNAPSHOT: ConfigSnapshot = {
  raw: undefined,
  view: null,
  seed: Number.NaN,
  today: '',
  signature: '',
};

/** What differs between the last configuration and a new one. The data counts as changed when it is another object. */
export function configDelta(previous: ConfigSnapshot, next: ConfigInput): ConfigDelta {
  return {
    dataChanged: next.raw !== previous.raw,
    viewChanged: next.view !== previous.view,
    seedChanged: next.seed !== previous.seed,
    todayChanged: next.today !== previous.today,
  };
}

/** Did anything change at all? */
export const anyChange = (delta: ConfigDelta): boolean => Object.values(delta).some(Boolean);

/** Do the points have to be laid out again? Only for another view, seed or layout signature. */
export const needsLayout = (delta: ConfigDelta, signatureChanged: boolean): boolean =>
  delta.viewChanged || delta.seedChanged || signatureChanged;
