type Props = { onDelete: () => void };

/** Panel that asks to delete a point. */
export function DeletePanel({ onDelete }: Props) {
  return (
    <>
      <p>Delete this point? The line stays: the points before and after it are joined.</p>
      <button type="button" className="is-danger" onClick={onDelete}>
        Delete
      </button>
    </>
  );
}
