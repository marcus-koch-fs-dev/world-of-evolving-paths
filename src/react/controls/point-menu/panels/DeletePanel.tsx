type Props = { onDelete: () => void };

/** Panel that asks to delete a point. */
export function DeletePanel({ onDelete }: Props) {
  return (
    <>
      <p>Delete this point? Connections to it disappear with it.</p>
      <button type="button" className="is-danger" onClick={onDelete}>
        Delete
      </button>
    </>
  );
}
