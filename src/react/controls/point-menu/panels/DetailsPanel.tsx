import { useState } from 'react';
import type { PathPoint } from '../../../../core';
import type { PointPatch } from '../types';

type Props = {
  point: Pick<PathPoint, 'date' | 'importance' | 'note'>;
  importanceRange: [number, number];
  onUpdate: (patch: PointPatch) => void;
};

export function DetailsPanel({ point, importanceRange, onUpdate }: Props) {
  const [min, max] = importanceRange;
  // The note is sent when the field loses focus, not on every key, so the app is not asked to relayout while typing
  const [note, setNote] = useState(point.note ?? '');
  const values = Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => min + i);

  return (
    <>
      <label>
        Date
        <input
          type="date"
          value={point.date}
          onChange={(event) => event.target.value && onUpdate({ date: event.target.value })}
        />
      </label>
      <label>
        Importance
        <select
          value={point.importance ?? min}
          onChange={(event) => onUpdate({ importance: Number(event.target.value) })}
        >
          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        Note
        <textarea
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => note !== (point.note ?? '') && onUpdate({ note: note || undefined })}
        />
      </label>
    </>
  );
}
