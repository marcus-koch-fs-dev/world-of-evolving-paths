import { isIsoDate } from './dates';
import { EDGE_SEPARATOR } from './geometry';
import type { PeriodData, PointKind, PointStatus } from './types';

export type Validation = { ok: true; data: PeriodData } | { ok: false; errors: string[] };

const KINDS: readonly PointKind[] = ['start', 'milestone', 'crossroad', 'goal'];
const STATUSES: readonly PointStatus[] = ['done', 'current', 'open', 'abandoned'];
const COLOR = /^#[0-9a-fA-F]{6}$/;
const MIN_IMPORTANCE = 1;
const MAX_IMPORTANCE = 5;
const MAX_STRENGTH = 4;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value !== '';

function pointErrors(point: unknown, where: string): string[] {
  if (!isRecord(point)) return [`${where} must be an object.`];
  const errors: string[] = [];
  if (!isNonEmptyString(point.id)) errors.push(`${where}.id must be a non-empty string.`);
  else if (point.id.includes(EDGE_SEPARATOR)) errors.push(`${where}.id may not contain "${EDGE_SEPARATOR}".`);
  if (typeof point.title !== 'string') errors.push(`${where}.title must be a string.`);
  if (typeof point.date !== 'string' || !isIsoDate(point.date))
    errors.push(`${where}.date must be a valid YYYY-MM-DD date.`);
  if (!KINDS.includes(point.kind as PointKind)) errors.push(`${where}.kind must be one of ${KINDS.join(', ')}.`);
  if (!STATUSES.includes(point.status as PointStatus))
    errors.push(`${where}.status must be one of ${STATUSES.join(', ')}.`);
  if (!Array.isArray(point.next) || !point.next.every((id) => typeof id === 'string')) {
    errors.push(`${where}.next must be a list of point ids.`);
  }
  if (
    point.importance !== undefined &&
    !(isFiniteNumber(point.importance) && point.importance >= MIN_IMPORTANCE && point.importance <= MAX_IMPORTANCE)
  ) {
    errors.push(`${where}.importance must be a number from ${MIN_IMPORTANCE} to ${MAX_IMPORTANCE}.`);
  }
  if (
    point.strength !== undefined &&
    !(Number.isInteger(point.strength) && (point.strength as number) >= 0 && (point.strength as number) <= MAX_STRENGTH)
  ) {
    errors.push(`${where}.strength must be a whole number from 0 to ${MAX_STRENGTH}.`);
  }
  if ((point.x === undefined) !== (point.y === undefined)) errors.push(`${where} needs both x and y, or neither.`);
  if (point.x !== undefined && !(isFiniteNumber(point.x) && isFiniteNumber(point.y)))
    errors.push(`${where}.x and y must be numbers.`);
  return errors;
}

function pathErrors(path: unknown, index: number): string[] {
  const where = `paths[${index}]`;
  if (!isRecord(path)) return [`${where} must be an object.`];
  const errors: string[] = [];
  if (!isNonEmptyString(path.id)) errors.push(`${where}.id must be a non-empty string.`);
  if (typeof path.name !== 'string') errors.push(`${where}.name must be a string.`);
  if (typeof path.color !== 'string' || !COLOR.test(path.color)) errors.push(`${where}.color must look like #rrggbb.`);
  if (path.lane !== undefined && !isFiniteNumber(path.lane)) errors.push(`${where}.lane must be a number.`);
  if (!Array.isArray(path.points)) return [...errors, `${where}.points must be a list.`];
  return [...errors, ...path.points.flatMap((point, i) => pointErrors(point, `${where}.points[${i}]`))];
}

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  ids.forEach((id) => {
    (seen.has(id) ? repeated : seen).add(id);
  });
  return [...repeated];
}

/** The ids of points that lie on a circle of connections. A path only runs forward. */
function circleIds(points: { id: string; next: string[] }[]): string[] {
  const nextOf = new Map(points.map((point) => [point.id, point.next]));
  const finished = new Set<string>();
  const found = new Set<string>();
  const visit = (id: string, trail: readonly string[]): void => {
    if (trail.includes(id)) {
      found.add(id);
      return;
    }
    if (finished.has(id)) return;
    (nextOf.get(id) ?? []).forEach((nextId) => {
      visit(nextId, [...trail, id]);
    });
    finished.add(id);
  };
  points.forEach((point) => {
    visit(point.id, []);
  });
  return [...found];
}

function referenceErrors(data: PeriodData): string[] {
  const pathIds = data.paths.map((path) => path.id);
  const points = data.paths.flatMap((path) => path.points);
  const known = new Set(points.map((point) => point.id));
  const unknownLinks = points.flatMap((point) =>
    point.next
      .filter((id) => !known.has(id))
      .map((id) => `Point "${point.id}" links to "${id}", which does not exist.`),
  );
  return [
    ...duplicates(pathIds).map((id) => `Path id "${id}" is used twice.`),
    ...duplicates(points.map((point) => point.id)).map((id) => `Point id "${id}" is used twice.`),
    ...unknownLinks,
    ...circleIds(points).map((id) => `Point "${id}" is on a circle of connections. A path only runs forward.`),
  ];
}

/** Checks the data an app passes in. Collects every problem, with a message that says where it is. */
export function validatePeriodData(input: unknown): Validation {
  if (!isRecord(input)) return { ok: false, errors: ['Period data must be an object with `paths`.'] };
  if (!Array.isArray(input.paths)) return { ok: false, errors: ['`paths` must be a list.'] };
  const errors = input.paths.flatMap(pathErrors);
  if (errors.length > 0) return { ok: false, errors };
  const data = input as unknown as PeriodData;
  const references = referenceErrors(data);
  return references.length > 0 ? { ok: false, errors: references } : { ok: true, data };
}
