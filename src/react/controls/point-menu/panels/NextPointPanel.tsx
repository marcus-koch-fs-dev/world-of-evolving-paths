import { type KeyboardEvent, useState } from 'react';
import type { NextPointInput } from '../types.js';
import { isBeforeFollowed, nextPointError, startsBeforeFork } from './nextPointError.js';

type Props = {
  /** The date the field starts with, usually the date of the point the new one follows. */
  defaultDate: string;
  /** Does the box "As a new branch" start checked? It does after a fork point. */
  startsNewBranch: boolean;
  onAddNext: (input: NextPointInput) => string | null;
  onDone: () => void;
};

/** Panel to create the point that follows, in the same branch or as the first point of a new branch that forks off. */
export function NextPointPanel({ defaultDate, startsNewBranch, onAddNext, onDone }: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [newBranch, setNewBranch] = useState(startsNewBranch);
  const [error, setError] = useState<string | null>(null);

  const beforeFork = startsBeforeFork(date, defaultDate, newBranch);
  const earlier = !newBranch && isBeforeFollowed(date, defaultDate);

  // A message belongs to the input it was made for, so it goes away when the user changes something
  const change =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setError(null);
    };
  const [changeTitle, changeDate, changeBranch] = [change(setTitle), change(setDate), change(setNewBranch)];

  const submit = () => {
    const missing = nextPointError(title, date);
    if (missing) return setError(missing);
    if (beforeFork) return; // the message under the date says why
    const problem = onAddNext({ title: title.trim(), date, newBranch });
    if (problem) return setError(problem);
    onDone();
  };

  const submitOnEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') submit();
  };

  return (
    <>
      <p>Next point, after this one</p>
      <input
        value={title}
        placeholder="Name"
        onChange={(event) => changeTitle(event.target.value)}
        onKeyDown={submitOnEnter}
      />
      <label>
        Date (required)
        <input type="date" required value={date} onChange={(event) => changeDate(event.target.value)} />
      </label>
      {earlier && <p className="pw-warn">This date is before the point it follows, so the line will run backwards.</p>}
      {beforeFork && <p className="pw-warn">A new branch cannot start before the point it forks from.</p>}
      <label className="pw-inline">
        <input type="checkbox" checked={newBranch} onChange={(event) => changeBranch(event.target.checked)} />
        As a new branch (forks off here)
      </label>
      <button type="button" onClick={submit}>
        Create
      </button>
      {error && <p className="pw-error">{error}</p>}
    </>
  );
}
