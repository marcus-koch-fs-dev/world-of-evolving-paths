import { useState } from 'react';
import type { PathPoint } from '../../../../core/index.js';
import type { PointPatch } from '../types.js';
import { InfoToggle } from './InfoToggle.js';

type Props = {
  point: Pick<PathPoint, 'date' | 'importance' | 'note'>;
  importanceRange: [number, number];
  onUpdate: (patch: PointPatch) => void;
};

/** Panel for date, importance and note of a point. */
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
      <div className="pw-field">
        <div className="pw-info-row">
          <span>Importance</span>
          <InfoToggle label="What importance means">
            Your own rating, 1 to 5. A more important point is drawn bigger, keeps more distance to others and stays
            visible in wider views such as month and year. The thickness of its outline shows how strong the path is
            that leads to it, and that comes from how often you walk it.
          </InfoToggle>
        </div>
        <select
          aria-label="Importance"
          value={point.importance ?? min}
          onChange={(event) => onUpdate({ importance: Number(event.target.value) })}
        >
          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
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
