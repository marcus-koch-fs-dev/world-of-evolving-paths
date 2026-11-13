import { hasCheckedIn, type StorePath } from 'world-of-evolving-paths';
import { Icon, type PanelGroup, TilePanel } from 'world-of-evolving-paths/react';

export type CheckInProps = {
  paths: readonly StorePath[];
  today: string;
  onCheckIn: (pathId: string) => void;
};

/** A button with the paths as a list. One tap on a path checks it in today. The count shows how many are still open. */
export function CheckInButton({ paths, today, onCheckIn }: CheckInProps) {
  const rows = paths.map((path) => ({ path, done: hasCheckedIn(path, today) }));
  const open = rows.filter((row) => !row.done).length;
  const groups: PanelGroup[] = [
    {
      id: 'check-in',
      label: 'Check in today',
      tiles: rows.map(({ path, done }) => ({
        id: path.id,
        label: done ? `${path.name} · done` : path.name,
        glyph: <span className="demo-path-dot" style={{ background: path.color }} />,
        title: done ? `${path.name}: checked in today` : `Check in on ${path.name}`,
        active: done,
        disabled: done,
        onClick: () => onCheckIn(path.id),
      })),
    },
  ];
  return (
    <TilePanel groups={groups} variant="list" label="Check in" glyph={<Icon name="check-circle" />} badge={open} />
  );
}
