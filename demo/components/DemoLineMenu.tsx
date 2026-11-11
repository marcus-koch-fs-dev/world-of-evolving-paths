import type { LineSelectEvent } from 'world-of-evolving-paths';
import { LineMenu } from 'world-of-evolving-paths/react';

type Props = {
  line: LineSelectEvent;
  /** Puts a new point into the line. */
  onInsert: () => void;
};

/** The menu of a line: what the demo offers to do with it. */
export function DemoLineMenu({ line, onInsert }: Props) {
  // A point can only go in where the app knows both ends of the line
  const known = line.from.id !== undefined && line.to.id !== undefined;
  return (
    <LineMenu
      at={line.at}
      title={`${line.from.title} → ${line.to.title}`}
      subtitle={line.date}
      tiles={[
        {
          id: 'insert',
          label: 'Insert point',
          glyph: '+',
          title: known ? 'Put a new point into this line, here' : 'The points at the ends of this line are not known',
          disabled: !known,
          onClick: onInsert,
        },
      ]}
    />
  );
}
