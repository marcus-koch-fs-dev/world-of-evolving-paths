import type { PointStatus } from '../../../../core';
import type { PointPatch } from '../types';

const STATUS_LABELS: Record<PointStatus, string> = {
  done: 'Done',
  current: 'Current',
  open: 'Open',
  abandoned: 'Abandoned',
};

type Props = {
  status: PointStatus;
  canComplete: boolean;
  onUpdate: (patch: PointPatch) => void;
};

/** Panel to complete, reopen or abandon a point. */
export function StatusPanel({ status, canComplete, onUpdate }: Props) {
  return (
    <>
      <p>
        Status: <strong>{STATUS_LABELS[status]}</strong>
        {!canComplete && status !== 'done' && <span> · waiting for earlier points</span>}
      </p>
      {status !== 'done' && (
        <button type="button" disabled={!canComplete} onClick={() => onUpdate({ status: 'done' })}>
          Mark as done
        </button>
      )}
      {(status === 'done' || status === 'abandoned') && (
        <button type="button" onClick={() => onUpdate({ status: 'open' })}>
          Reopen
        </button>
      )}
      {status !== 'abandoned' && status !== 'done' && (
        <button type="button" onClick={() => onUpdate({ status: 'abandoned' })}>
          Abandon
        </button>
      )}
    </>
  );
}

export { STATUS_LABELS };
