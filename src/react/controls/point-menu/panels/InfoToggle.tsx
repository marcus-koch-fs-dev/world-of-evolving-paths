import { type ReactNode, useState } from 'react';

type Props = {
  /** What the information is about, for screen readers. */
  label: string;
  children: ReactNode;
};

/** A small ⓘ button that shows or hides an explanation next to it. */
export function InfoToggle({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="pw-info-button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((current) => !current)}
      >
        ⓘ
      </button>
      {open && <p className="pw-help">{children}</p>}
    </>
  );
}
