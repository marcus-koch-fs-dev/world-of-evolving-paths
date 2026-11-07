import { isIsoDate } from './dates';
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

function pathErrors(path: unknown, index: number): string[] {
  const where = `paths[${index}]`;
  if (!isRecord(path)) return [`${where} must be an object.`];
  const errors: string[] = [];
  if (typeof path.id !== 'string' || path.id === '') errors.push(`${where}.id must be a non-empty string.`);
  if (typeof path.name !== 'string') errors.push(`${where}.name must be a string.`);
  if (typeof path.color !== 'string' || !COLOR.test(path.color)) errors.push(`${where}.color must look like #rrggbb.`);
  if (path.lane !== undefined && !isFiniteNumber(path.lane)) errors.push(`${where}.lane must be a number.`);
  return errors;
}

function pointErrors(point: unknown, index: number): string[] {
  const where = `points[${index}]`;
  if (!isRecord(point)) return [`${where} must be an object.`];
  const errors: string[] = [];
  if (typeof point.id !== 'string' || point.id === '') errors.push(`${where}.id must be a non-empty string.`);
  if (typeof point.pathId !== 'string') errors.push(`${where}.pathId must be a string.`);
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
    !(isFiniteNumber(point.strength) && point.strength >= 0 && point.strength <= MAX_STRENGTH)
  ) {
    errors.push(`${where}.strength must be a number from 0 to ${MAX_STRENGTH}.`);
  }
  if ((point.x === undefined) !== (point.y === undefined)) errors.push(`${where} needs both x and y, or neither.`);
  if (point.x !== undefined && !(isFiniteNumber(point.x) && isFiniteNumber(point.y)))
    errors.push(`${where}.x and y must be numbers.`);
  return errors;
}

function referenceErrors(data: PeriodData): string[] {
  const errors: string[] = [];
  const pathIds = new Set(data.paths.map((path) => path.id));
  const pointIds = new Set<string>();
  for (const point of data.points) {
    if (pointIds.has(point.id)) errors.push(`Point id "${point.id}" is used twice.`);
    pointIds.add(point.id);
    if (!pathIds.has(point.pathId)) errors.push(`Point "${point.id}" refers to unknown path "${point.pathId}".`);
  }
  const duplicatePaths = data.paths.length - pathIds.size;
  if (duplicatePaths > 0) errors.push('Path ids must be unique.');
  return errors;
}

/** Checks the data an app passes in. Collects every problem, with a message that says where it is. */
export function validatePeriodData(input: unknown): Validation {
  if (!isRecord(input)) return { ok: false, errors: ['Period data must be an object with `paths` and `points`.'] };
  if (!Array.isArray(input.paths)) return { ok: false, errors: ['`paths` must be a list.'] };
  if (!Array.isArray(input.points)) return { ok: false, errors: ['`points` must be a list.'] };
  const errors = [...input.paths.flatMap(pathErrors), ...input.points.flatMap(pointErrors)];
  if (errors.length > 0) return { ok: false, errors };
  const data = input as unknown as PeriodData;
  const references = referenceErrors(data);
  return references.length > 0 ? { ok: false, errors: references } : { ok: true, data };
}
