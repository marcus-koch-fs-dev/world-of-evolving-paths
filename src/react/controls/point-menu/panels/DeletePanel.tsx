type Props = {
  onDelete: () => void;
  /** Does a branch leave from this point? */
  isFork: boolean;
};

/** Panel that asks to delete a point. */
export function DeletePanel({ onDelete, isFork }: Props) {
  return (
    <>
      <p>Delete this point? The line stays: the points before and after it are joined.</p>
      {isFork && (
        <p className="pw-warn">
          A branch leaves from this point. It will leave from the point before it, or stand alone if there is none.
        </p>
      )}
      <button type="button" className="is-danger" onClick={onDelete}>
        Delete
      </button>
    </>
  );
}
