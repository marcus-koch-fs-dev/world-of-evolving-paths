import { type KeyboardEvent, useState } from 'react';
import type { NextPointInput } from '../types';
import { ColorSwatches } from './ColorSwatches';

type Props = {
  colors: readonly string[];
  /** The date the field starts with, usually the date of the point the new one follows. */
  defaultDate: string;
  onAddNext: (input: NextPointInput) => string | null;
  onDone: () => void;
};

export function NextPointPanel({ colors, defaultDate, onAddNext, onDone }: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [newPath, setNewPath] = useState(false);
  const [color, setColor] = useState(colors[0] ?? '#ffffff');
  const [error, setError] = useState<string | null>(null);

  const earlier = date !== '' && date < defaultDate;

  const submit = () => {
    if (!title.trim()) return setError('The name is missing.');
    if (!date) return setError('The date is missing. Every point needs a date.');
    const problem = onAddNext({ title: title.trim(), date, newPath, color });
    if (problem) return setError(problem);
    onDone();
  };

  const submitOnEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') submit();
  };

  return (
    <>
      <p>Next point, connected to this one</p>
      <input
        value={title}
        placeholder="Name"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={submitOnEnter}
      />
      <label>
        Date (required)
        <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      {earlier && <p className="pw-warn">This date is before the point it follows, so the line will run backwards.</p>}
      <label className="pw-inline">
        <input type="checkbox" checked={newPath} onChange={(event) => setNewPath(event.target.checked)} />
        On a new path (own color)
      </label>
      {newPath && <ColorSwatches colors={colors} value={color} onPick={setColor} />}
      <button type="button" onClick={submit}>
        Create
      </button>
      {error && <p className="pw-error">{error}</p>}
    </>
  );
}
