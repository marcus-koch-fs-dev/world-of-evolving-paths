# Changelog

## 0.1.0 (unreleased)

### Library

- **Breaking:** the levels `day` and `halfYear` are gone. `ViewLevel` is `'week' | 'month' | 'year'` and `VIEW_LEVELS` has these three. A key such as `day:2026-11-07` or `halfYear:2026-01-01` is no longer a period, so `periodFromKey` returns `null` for it. If you used them, show a week or a month instead.
- A path can have `through`: the connections that span the whole period without a point inside. Each is drawn as a line across the view, with an arrow, title and date at both ends. A fork gives one line per branch. New type `PathThrough`.
- Lines that run along the time axis keep apart from each other by themselves.
- New event `onLineEndMove({ from, to, y })`: the user dragged the arrow at the end of a line up or down. Pass `y` back on the lead (`Lead.y`) or on the `through` entry to keep the line there.
- New event `onLineSelect({ from, to, x, y, date, at })`: a line was clicked or right-clicked. New React control `LineMenu` for a tile menu at that place.
- New option `timeLocked` (default `true`): a dragged point stays on its date and only moves across the time axis.
- Heights in the data are distances from the lane of the path, not world positions: `y` alone on a point, `Lead.y` and `PathThrough.y`. The same number now fits every view and page. A point with only `y` sits on its date at that distance from its lane. `onPointMove` gives the new `offset`, `onPointAdd` and `onLineSelect` give `lanes`, and `onLineEndMove` reports `y` from the lane.
- New option `snap`: dragged and added points snap to a grid.
- The marker for today shows only in a view that holds today, on the right day of each line.
- The year level can span 1 to 10 years: `periodOf('year', date, { years })`, key `year:YYYY-01-01+N`.
- `ViewBar`: new props `levelChips`, `freeLast`, `afterLevels` and `periodSlot`. Level buttons can have a `title`.
- `Toast` can show a button (`action`).
- Lines are easier to hit when the view is zoomed out.
- A point that is done shows a check mark in its symbol, in the color of its path. Before only a reached goal did.
- Lines put at a height still move apart when two of them would lie on top of each other.

### Demo

- The top bar has level chips (W, M, Y, All), a counter for 1, 2, 5 or 10 years, the arrows around the period, a list to pick a period, and **Today**, which opens the week of today. Keys: W, M, Y, A, T, ← → and + −.
- The demo offers week, month and year, the same levels as the library. Double-click goes from the year to the month and the week.
- A legend in the corner shows from which view on a point of each importance appears. It starts closed.
- If a changed importance hides a point, a message says where it shows, with a button to go there.
- Points move only up and down and keep one height in every view. Where a line meets the edge is kept per period; without a dragged height it follows the heights of the two points.
- Click or right-click a line to insert a point there. Deleting a point keeps its path connected.
- Snap to grid in the settings.

## 0.0.6 (2026-11-10)

### Library

- Points can have `incoming` and `outgoing`: a list of `{ title, date }` for the points outside the view that the path comes from or goes to. The map draws a line from the point towards the edge, with the title and the date at its end. The line looks like the path (wide when walked, dotted when open) and works in all directions of time. New type `Lead`.
- The data check reports a wrong `incoming` or `outgoing` with the place of the error.
- The end of a line that leaves the view is an arrow, in the color of the line, that points out of the view. It and the text stand out while the pointer is on the line.
- A lead can have an `id`. Double-clicking its line or its text calls the new event `onLeadDoubleClick({ pointId, side, title, date, id })`. The cursor changes over a line that leaves the view, and the line lights up like a connection of a hovered point.

### Demo

- A point whose path goes on outside the period now shows lines to the edge, with the name and date of the point out there. Before, a point in the month or week view looked cut off from its path.
- Double-click such a line to go to the period of the point out there, in the same level. The point is selected, and **Back** returns.

## 0.0.5 (2026-11-10)

### Library

- New event `onPointDoubleClick({ id, date })`. It tells your app that a point was double-clicked and gives the date of the point. What happens next is up to your app.
- `ViewBar` has two new optional props, `date` and `onDateChange`. With them a click on the period opens a date picker, so the user does not have to click through the periods one by one.

### Demo

- Click the period in the top bar to pick a date. The view jumps to the period that has that date.
- Double-click a point to go one level deeper, to the period of its date: year, month, week (and day, if it is switched on). The half year is skipped.
- A new **Back** button returns to the view before the last double-click.

## 0.0.4 (2026-11-10)

### Library

- `PointMenu` shows the name of the path of the selected point, so you can always see where a point belongs.
- The "Next point" panel has a field for the name of a new path. `NextPointInput` has a new optional field `pathName` (empty when the user gave none).

### Documentation

- README: a copy-and-paste object with every option and its default value, the start state of the demo editor, and the defaults of the `PointMenu`.

### Demo

- A new path gets the name the user typed. Without a name it takes the title of its first point, as before.
- The demo check-ins now end yesterday. Every path can be checked in today, and the check-in can be undone.

## 0.0.3 (2026-11-10)

### Documentation

- README rebuilt around what a visitor looks for: what it is, install, quick start, then a guide to the demo ("where do I click?"), guides for building an app, and the reference further down.
- New section "Using the map": how to add points, start a new path, connect points, check in, undo and move through time.
- Colored notes (note, tip, important, warning) and collapsible tables for the long option and control lists. Badges and a contents table at the top.
- Simpler English: rare words are replaced by common ones (for example "moves back" instead of "springs back").
- Link to this changelog from the README.

### Demo

- A point added by double-click gets the importance the current view needs. Before, it was hidden at once in the month, half-year and year views.
- Undo and redo close the check-in message, so it no longer describes a change that was taken back.

The library code itself is unchanged in this release.

## 0.0.2 (2026-11-10)

### Documentation

- README: `handle.update(options)` replaces all options, it does not merge them. The framework-free quick start now shows this with a complete, compilable example.
- README: a move needs a new `PeriodData` object within 80 ms, otherwise the point springs back. Corrected how a blocked point finds its resting place.
- README: `onError` also reports invalid `today`, `locale` and background colors. `onPointAdd` coordinates are map coordinates.
- README: the stylesheet is only for the React binding. `react-dom` is an optional peer dependency. The package declares Node.js 24 or newer.
- README: removed the "unknown path" error that was never checked. Importance does not filter views in the library, your app decides.
- README: a missing entry for the shown view leaves the map empty without a message. New section "More exports".

### Package

- More keywords so the package is found in the npm search.

### Demo

- Checking in now answers with a message: active days before and after, the tier, and how many days the next tier needs, or "X is now a Highway!" when a tier is reached.
- The check-in button is disabled once the path is checked in today, so the counter cannot be pushed up by clicking.

The library code itself is unchanged in this release.

## 0.0.1 (2026-11-08)

First release.
