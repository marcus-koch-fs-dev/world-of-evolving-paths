import { useState } from 'react';
import type { StorePoint } from '../../../../core/index.js';
import type { PointPatch } from '../types.js';
import { InfoToggle } from './InfoToggle.js';

type Props = {
  point: Pick<StorePoint, 'date' | 'prio' | 'note'>;
  importanceRange: [number, number];
  onUpdate: (patch: PointPatch) => void;
};

/** Panel for date, importance and note of a point. */
export function DetailsPanel({ point, importanceRange, onUpdate }: Props) {
  const [min, max] = importanceRange;
  // The note is sent when the field loses focus, not on every key, so the app is not asked to relayout while typing
  const [note, setNote] = useState(point.note ?? '');
  // The date is sent the same way: a date field fires a change for each part of the date while it is typed
  const [date, setDate] = useState(point.date);
  // On blur or Enter. An empty field goes back to the date of the point, so the field never shows something else
  const commitDate = () => {
    if (!date) setDate(point.date);
    else if (date !== point.date) onUpdate({ date });
  };
  // The note field grows with the text, so it never has to be pulled by hand
  const grow = (field: HTMLTextAreaElement | null) => {
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight + 2}px`;
  };
  const values = Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => min + i);

  return (
    <>
      <label>
        Date
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          onBlur={commitDate}
          onKeyDown={(event) => event.key === 'Enter' && commitDate()}
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
          value={point.prio ?? min}
          onChange={(event) => onUpdate({ prio: Number(event.target.value) })}
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
          ref={grow}
          rows={3}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            grow(event.target);
          }}
          onBlur={() => note !== (point.note ?? '') && onUpdate({ note: note || undefined })}
        />
      </label>
    </>
  );
}
