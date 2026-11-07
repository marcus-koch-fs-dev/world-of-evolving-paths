type Props = { onDelete: () => void };

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
