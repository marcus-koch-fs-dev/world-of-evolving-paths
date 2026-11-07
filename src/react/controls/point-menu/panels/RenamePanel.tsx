import { type KeyboardEvent, useState } from 'react';

type Props = {
  title: string;
  onRename: (title: string) => void;
  onDone: () => void;
};

/** Panel to change the name of a point. */
export function RenamePanel({ title, onRename, onDone }: Props) {
  const [text, setText] = useState(title);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!text.trim()) return setError('The name is missing.');
    onRename(text.trim());
    onDone();
  };

  const submitOnEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') submit();
  };

  return (
    <>
      <p>Name</p>
      <input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={submitOnEnter} />
      <button type="button" onClick={submit}>
        Apply
      </button>
      {error && <p className="pw-error">{error}</p>}
    </>
  );
}
