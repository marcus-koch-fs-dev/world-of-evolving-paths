<div align="center">

# 🌱 World of Evolving Paths

**Paths with dates that grow stronger the more you walk them.**
A pannable, zoomable canvas for milestones, branches and goals. Think of a skill tree that is also a milestone calendar. The paths are not fixed: they change as you use them.

[![npm](https://img.shields.io/npm/v/world-of-evolving-paths?color=cb3837&logo=npm)](https://www.npmjs.com/package/world-of-evolving-paths)
[![license](https://img.shields.io/npm/l/world-of-evolving-paths?color=3da639)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D24-5fa04e?logo=node.js&logoColor=white)](#-install)
[![demo](https://img.shields.io/badge/live-demo-7c4dff)](https://marcus-koch-fs-dev.github.io/world-of-evolving-paths/)

**[▶ Live demo](https://marcus-koch-fs-dev.github.io/world-of-evolving-paths/)** · [Open in StackBlitz](https://stackblitz.com/github/marcus-koch-fs-dev/world-of-evolving-paths?view=preview) · [Changelog](CHANGELOG.md)

![The year view with paths that grow from thin to wide, a slim bar at the top and the time slider at the bottom](docs/demo-year.jpg)

</div>

|     |                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📚  | **A library, not an app.** It stores nothing and prepares no data. Your app gives it data, it draws the data and tells you what the user does.          |
| 🗓️  | **Time-aware views.** Show a day, a week, a month, half a year or a year. Each view gets its own data, so a year view can show only the big milestones. |
| 🛣️  | **Paths that evolve.** Lines you have reached get wider and start to shine the more often you walk the path: from a faint trail to a highway.           |
| 🧲  | **Points keep their distance.** A dragged point stops where there is room. Otherwise it moves back. The same data and seed always give the same layout. |
| 🧩  | **Framework-free core.** The map works on any element. A React binding and ready-made controls are included.                                            |

> Status: early (0.0.x). The API can still change.

## 📑 Contents

| I want to …                        | Go to                                                 |
| ---------------------------------- | ----------------------------------------------------- |
| install it                         | [📦 Install](#-install)                               |
| see it work in a few lines         | [🚀 Quick start](#-quick-start)                       |
| know where to click in the demo    | [🎮 Using the map](#-using-the-map)                   |
| build it into my app               | [🧩 Building your app](#-building-your-app)           |
| look up an object, event or option | [📚 Reference](#-reference)                           |
| know the limits                    | [📈 Performance and limits](#-performance-and-limits) |
| work on the library itself         | [🔧 Contributing](#-contributing)                     |

## 📦 Install

```bash
npm install world-of-evolving-paths
```

`pixi.js` is installed with it. `react` and `react-dom` (18 or newer) are optional peer dependencies, needed only for `world-of-evolving-paths/react`. The package declares Node.js 24 or newer (`engines`).

## 🚀 Quick start

### With React

```tsx
import { periodOf, type PeriodMap } from 'world-of-evolving-paths';
import { PathWorld, ZoomControls } from 'world-of-evolving-paths/react';
import 'world-of-evolving-paths/style.css';

const period = periodOf('week', '2026-11-04');

// One entry per view: period key → the paths of that view, each with its points
const periods: PeriodMap = {
  [period.key]: {
    paths: [
      {
        id: 'combat',
        name: 'Combat',
        color: '#ff3b3b',
        points: [
          { id: 'a', date: '2026-11-02', title: 'Sword basics', kind: 'start', status: 'done', next: ['b'] },
          { id: 'b', date: '2026-11-05', title: 'Parry', kind: 'milestone', status: 'current', next: [] },
        ],
      },
    ],
  },
};

export function Example() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <PathWorld periods={periods} view={period.key}>
        <ZoomControls />
      </PathWorld>
    </div>
  );
}
```

> [!NOTE]
> `PathWorld` fills its parent, so give the parent a size.

### Without a framework

```ts
import {
  createPathWorld,
  periodOf,
  type PathWorldOptions,
  type PeriodData,
  type PeriodMap,
  type Position,
} from 'world-of-evolving-paths';

const period = periodOf('week', '2026-11-04');
let periods: PeriodMap = {
  [period.key]: {
    paths: [
      /* your paths, as in the React example */
    ],
  },
};

// The element needs a size, the map fills it
const element = document.getElementById('map')!;

// Pins every point where the user sees it, as a new object
const pinned = (data: PeriodData, positions: Record<string, Position>): PeriodData => ({
  paths: data.paths.map((path) => ({
    ...path,
    points: path.points.map((point) => ({ ...point, ...positions[point.id] })),
  })),
});

const options = (): PathWorldOptions => ({
  periods,
  view: period.key,
  onPointMove: ({ positions }) => {
    // Store the positions, then pass a new object back in (see Events)
    periods = { ...periods, [period.key]: pinned(periods[period.key], positions) };
    handle.update(options());
  },
});

const handle = createPathWorld(element, options());

// When you remove the element:
handle.destroy();
```

> [!IMPORTANT]
> **`handle.update(options)` replaces all options, it does not merge them.** Always pass the full set, callbacks included. An option you leave out is gone: without `onPointMove` a dragged point moves back. The easiest way is one function that builds the options, as above.

The stylesheet is only needed for the React binding and its controls. The map itself sets the styles of its element in code (inline styles).

## 🎮 Using the map

The [live demo](https://marcus-koch-fs-dev.github.io/world-of-evolving-paths/) shows what the library can do. This is where to click.

**Points**

| I want to …                      | Do this                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Select a point and open its menu | Click it. Click the empty area to deselect.                                                                                                                                  |
| Move a point                     | Drag it. It stops where there is room. Otherwise it moves back.                                                                                                              |
| Add a point                      | Double-click the empty area. It joins the path of the selected point, or the first path. The new point gets the importance the current view needs, so you see it right away. |
| Add the next point               | Point menu → **Next point** → name and date → **Create**.                                                                                                                    |
| Start a **new path**             | Point menu → **Next point** → tick **On a new path (own color)**, pick a color → **Create**.                                                                                 |
| Connect two points               | Point menu → **Connect**, then click the point to connect to. Escape cancels.                                                                                                |
| Change status, kind, name, color | Point menu → **Properties**: Status, Kind, Name, Path color.                                                                                                                 |
| Delete a point                   | Point menu → **Delete**.                                                                                                                                                     |

**Paths grow**

| I want to …             | Do this                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| Check in on a path      | Select a point of the path, then the **Check in** button at the bottom right. Once per day. |
| See what a check-in did | A message at the top shows the active days before and after and what the next tier needs.   |
| Undo or redo            | The arrow buttons in the top bar, or Ctrl+Z and Ctrl+Y. Up to 100 steps, kept in memory.    |

**Moving around**

| I want to …             | Do this                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Zoom                    | Mouse wheel or pinch.                                                                                                                    |
| Pan                     | Drag the empty area.                                                                                                                     |
| Center / fit everything | Keys **M** and **E** while the pointer is over the map, or the buttons (tiles) in the menu.                                              |
| Change the period       | The arrows and **Today** in the top bar. The levels (Free, Week, Month, Half year, Year) are in the menu (▦) under **View**.             |
| Travel through time     | The time slider at the bottom (on a small screen the bar starts closed, open it with **+**). **Play** runs through the days of the view. |
| Turn the map            | Menu (▦) → **Map** → Turn left / Turn right.                                                                                             |
| Change the background   | Menu (▦) → **Mode** → Settings.                                                                                                          |
| Switch to read-only     | Menu (▦) → **Mode** → Map. The editor mode has everything on.                                                                            |

> [!TIP]
> Both bars can be dragged to the top or bottom edge, left, middle or right. Everything on the bars is built from the controls of the library, see [Controls](#controls-react).

## 🧩 Building your app

You own the data. The library turns what you pass in into a picture and tells you what the user did. It never changes your objects.

```
your app ── periods, view, options ──▶  PathWorld  ──▶  canvas
   ▲                                       │
   └────────── events (onPointMove, ...) ──┘
```

> [!NOTE]
> **The library stores nothing.** Undo, saving and loading are your app's job. The demo shows one way in `demo/app-logic/`.

### Show a view

A view is a period of a level: `day`, `week`, `month`, `halfYear` or `year`. Its key is made by the calendar helpers, and `periods` holds the data of each key.

```ts
import { periodOf, shiftPeriod, periodFromKey } from 'world-of-evolving-paths';

const week = periodOf('week', '2026-11-04'); // key 'week:2026-11-02', label 'CW 45, 2 Nov – 8 Nov 2026'
const nextWeek = shiftPeriod(week, 1);
const sameWeek = periodFromKey('week:2026-11-02'); // back from a key

periodOf('week', '2026-11-04', { weekStart: 4 }); // weeks that start on a Friday (0 = Monday ... 6 = Sunday)
```

```ts
const periods: PeriodMap = {
  'week:2026-11-02': { paths }, // the paths of that week, each with its points
  'month:2026-11-01': { paths }, // other points: only the more important ones
};
```

- The key decides the calendar span the points are spread over. Any other key (for example `'free'`) is a free view: the points are spread over the span of their own dates.
- **What a view shows is up to your app.** The library does not filter. A year view typically gets only the important points, a day view all of them. The demo shows one way to do it (`demo/app-logic/`): filter by period and importance, connect across hidden points, split many paths into pages.
- Typically `periods` holds only the view you show, and you load the next one when the user changes the view.
- If `periods` has no entry for `view`, the map stays empty and reports nothing, so make sure the view you show has data.

### Keep the layout

You give points without positions and the library lays them out:

- The date decides the rough x position inside the calendar span.
- Each path has a lane (its row). Paths in upper lanes bend up, middle ones stay straight, lower ones bend down.
- Where a path splits, the branches move apart.
- Points keep `radius + radius` from each other and stay off foreign lines. Lines may cross.
- The same input and `seed` always give the same layout. Change `seed` for another one.

**Fixing a position (pinning).** A point with `x` and `y` stays exactly there, the others make room around it. When the user drops a dragged point, `onPointMove` tells you where it ended up, and `positions` holds every point of the view. Store them and pass them back as `x`/`y` to keep the layout as the user sees it.

> [!WARNING]
> Answer a move with a **new** `PeriodData` object within 80 ms, otherwise the point moves back. Changing the old object in place does not count, the map compares by reference. See [Events](#events).

### Add points and paths

- The user double-clicks the empty area: `onPointAdd({ x, y, date })` tells you where. You decide whether and how to add a point.
- The `PointMenu` control has a **Next point** panel. It calls your `onAddNext({ title, date, newPath, color })`. With `newPath` you create a new `Path` with that color and put the point on it. Without it, the point joins the path of the selected point.
- A new path is just another entry in `paths`. Give it an `id`, a `name`, a `color` and its points.

### Make paths stronger

The more often a path is walked, the stronger it gets. The library draws the tier you pass in `strength` (0–4) and offers the rule that turns activity into a tier.

**Activity is a check-in: a day on which the path was walked.** Check-ins are not points on the map, so a daily habit does not fill the map. Keep them in your app. Pass the day numbers of a path, including days the current view hides:

```ts
import { tierAt, toDay, TIERS } from 'world-of-evolving-paths';

// The days on which this path was walked, as day numbers
const activityDays = checkInDates.map(toDay); // checkInDates: ['2026-11-02', '2026-11-04', ...]
const strength = tierAt(activityDays, toDay(point.date));
TIERS[strength]; // { name: 'Highway', width: 13, glow: 0.7 }
```

The tier counts the **active days in the last 12 weeks** up to the date of the point. Several check-ins on one day count once.

| Tier | Name        | Active days in 12 weeks | What it takes                         |
| ---- | ----------- | ----------------------- | ------------------------------------- |
| 0    | Desire path | 0                       | just started, a faint trail           |
| 1    | Path        | 6                       | about once a week                     |
| 2    | Road        | 18                      | two or three times a week             |
| 3    | Expressway  | 40                      | most days                             |
| 4    | Highway     | 70                      | nearly every day, for about ten weeks |

A highway is a real habit. It shrinks slowly when the habit stops. Pass your own rule as the third argument: `{ weeks, minActiveDays }`.

The strength of a path arrives at its next point: the border of a reached point is thicker the stronger the path that led to it. The importance of a point is separate. It is your own rating from 1 to 5 and decides the size of the symbol and the room it keeps. Your app can also use it to decide which views show the point (the demo does). A strong path does not make a point more important.

Lines to points that are not reached yet stay thin and are drawn with dots. While a point is dragged, thin rings show how much room it needs.

### Dates and language

The date under a point is short, `2.11.` in German, and carries the year only when it is not the current one. Set `locale` (`de`, `en-GB`, `en-US`, ...) to choose the order and separators. Without it the browser's language is used. To write the date yourself, for example with your own date library, pass `formatDate: (iso) => string`.

The labels of periods follow the same language: `periodLabel(period, 'de')` gives `KW 45, 2.11. – 8.11.2026`. `period.label` is the English one.

### Camera and direction of time

Mouse wheel and pinch zoom, drag to pan. When the view changes, the zoom stays and the content is centered. `handle.fit()` fits the content into about 60 % of the viewport, so a frame of empty space stays around it. `handle.center()` and `handle.zoomBy(factor)` do the same from code. With React, put a `ref` on `<PathWorld>` to get the handle (it is `null` until the map exists).

The option `orientation` sets which way time runs: `horizontal` (left to right), `horizontal-inverted` (right to left), `vertical` (top to bottom), `vertical-inverted` (bottom to top) or `auto` (vertical when the map is taller than wide, good for phones). Only the picture turns. Your data, the positions you store and the events stay the same.

`handle.getDirection()` tells which way time runs right now, also with `orientation: 'auto'`. `rotateDirection(direction, 'left' | 'right')` gives the direction after a quarter turn, so you can build your own turn buttons.

## 📚 Reference

### Objects

**`PathPoint`** is one point on a path.

| Field        | Type                                              | Meaning                                                                                        |
| ------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`         | `string`                                          | Unique within the view.                                                                        |
| `date`       | `string`                                          | ISO date `YYYY-MM-DD`. Decides the rough horizontal position.                                  |
| `title`      | `string`                                          | Shown under the point.                                                                         |
| `kind`       | `'start' \| 'milestone' \| 'crossroad' \| 'goal'` | Start ▲, goal ★, fork ◆ (also when two or more points follow), otherwise ●.                    |
| `status`     | `'done' \| 'current' \| 'open' \| 'abandoned'`    | Looks and animation.                                                                           |
| `next`       | `string[]`                                        | Ids of the points this one leads to. Draws the connections.                                    |
| `importance` | `number` (1–5, optional)                          | Bigger points keep more distance.                                                              |
| `note`       | `string` (optional)                               | Free text for your app.                                                                        |
| `strength`   | `number` (0–4, optional)                          | Tier of the connection leading to this point. See [Make paths stronger](#make-paths-stronger). |
| `x`, `y`     | `number` (optional)                               | Pins the point. Set both or neither.                                                           |

**`Path`** is one graph with its points: `{ id, name, color, lane?, points }`. `color` is `#rrggbb` and stays the same along the whole path. Paths are placed one below the other by `lane` (lowest number first), otherwise in list order.

**`PeriodData`** is everything one view needs: `{ paths: Path[] }`. Points can lead to points on other paths with `next`, so paths can branch off and merge. A `next` to a point that is not in the view is dropped. Connections never form a circle: such data is rejected with a message. Point ids may not contain `->`, it separates the ids in the id of a line.

**`PeriodMap`** is an object that maps a period key to its `PeriodData`.

The data is checked when it arrives. Invalid data (a bad date, a duplicate id, a circle of connections, ...) is reported through `onError`. The message says where the problem is, and nothing is drawn. Without `onError` the messages go to `console.error`. `validatePeriodData(data)` runs the same check yourself.

### Events

All events are options of `PathWorld` and `createPathWorld`.

| Callback                               | When                                                                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onSelect(id \| null)`                 | A point was pressed (also when it is then dragged), or the empty area was clicked (`null`).                                                                                                         |
| `onPointMove({ id, x, y, positions })` | A dragged point was released at its final position.                                                                                                                                                 |
| `onPointAdd({ x, y, date })`           | The empty area was double-clicked. In a calendar view `date` follows the horizontal position, otherwise it is today. `x`/`y` are map coordinates (not screen pixels), already moved to a free spot. |
| `onError(errors)`                      | The data of the current view is invalid, or an option such as `today`, `locale` or a background color is invalid (it is then replaced by its default).                                              |

Update your data in these callbacks and pass the new objects back in. The data is yours. If you do not answer a move within 80 ms with a **new** `PeriodData` object for the current view, the point moves back to where it was. Changing the old object in place does not count, the map compares by reference. Sometimes a point cannot stay where it was dropped (no room, or on a foreign line). Then it moves back along its way until it finds a free spot. That spot is what `onPointMove` reports.

### Options

<details>
<summary><b>All options of <code>PathWorld</code> and <code>createPathWorld</code></b> (click to open)</summary>

| Option         | Default        | Meaning                                                                                                                                                                                                                             |
| -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `periods`      | —              | The `PeriodMap`.                                                                                                                                                                                                                    |
| `view`         | —              | Key of the period to show.                                                                                                                                                                                                          |
| `today`        | local date     | Today as `YYYY-MM-DD`. Marks "today" on every path.                                                                                                                                                                                 |
| `seed`         | `1`            | Changes the generated layout.                                                                                                                                                                                                       |
| `editable`     | `true`         | Allow moving and adding points.                                                                                                                                                                                                     |
| `pointsLocked` | `false`        | Points cannot be dragged.                                                                                                                                                                                                           |
| `wavy`         | `false`        | A slight wave on the lines.                                                                                                                                                                                                         |
| `background`   | dark, plain    | `{ pattern: 'stars' \| 'hex' \| 'dots' \| 'none', fill: 'solid' \| 'gradient', base, color, color2, angle, mid, intensity, scale }`.                                                                                                |
| `orientation`  | `'horizontal'` | Which way time runs: `horizontal`, `horizontal-inverted`, `vertical`, `vertical-inverted` or `auto`. See [Camera and direction of time](#camera-and-direction-of-time). Only the picture turns, your data and events stay the same. |
| `animate`      | `true`         | Moving dashes, pulsing rings and a soft pulsing light. Off by default for users who prefer reduced motion.                                                                                                                          |
| `locale`       | browser        | Language of the dates under the points, such as `de`.                                                                                                                                                                               |
| `formatDate`   | —              | Writes the date under a point yourself. It is used instead of `locale`.                                                                                                                                                             |
| `shortcuts`    | `true`         | Keys `M` (center) and `E` (fit), only while the pointer is over the map or the focus is inside it.                                                                                                                                  |

</details>

### Controls (React)

Ready-made controls are imported from `world-of-evolving-paths/react`. In the repository they live in `src/react/controls/`, one folder per control with its own styles; their props are typed, so your editor shows what each one needs. They hold no map logic: they get values and callbacks, so you can restyle or replace them.

<details>
<summary><b>All controls</b> (click to open)</summary>

| Control           | What it does                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ZoomControls`    | Zoom out, zoom in, center, fit. Place it inside `PathWorld`.                                                                                                                                                                                                                                                                                                                                              |
| `ViewBar`         | Level buttons (or one dropdown with `compact`), previous/next period, today, pages, reroll. Holds no state.                                                                                                                                                                                                                                                                                               |
| `ControlBar`      | A bar fixed to the top or bottom edge (`dock`: `top-left`, `top-center`, `top-right`, `bottom-...`). Bars on one edge sit side by side. With `onDockChange` the user drags it to another place, you store it; with `label` it can be folded.                                                                                                                                                              |
| `TilePanel`       | One button (`▦`) that opens a small panel of buttons (tiles) in groups, like a number pad. You give the groups and tiles (glyph, label, `active`, `disabled`, `onClick`). It opens away from the edge of its `ControlBar` and stays open until the button is clicked again or Escape is pressed. `ViewBar` with `periodOnly` pairs with it: the period stays in the bar, everything else goes into tiles. |
| `SidePanel`       | A panel over the full height at the left or right side, with a close button. Scrolls when long. For settings.                                                                                                                                                                                                                                                                                             |
| `BackgroundPanel` | Fill (plain or gradient with two colors), pattern, brightness and size. Holds no state.                                                                                                                                                                                                                                                                                                                   |
| `PointMenu`       | Menu with buttons at a selected point. Actions: next point, connect (needs `onConnect`), delete. Properties: status, kind, name, path color (with slots for your own colors) and details. `checkInCount` shows the check-ins of the path. It moves with the map and sits below the point, or above when there is no room (`placement`: `auto`, `below`, `above`, `right`, `left`).                        |
| `Toast`           | A short message at the top of the map that slides in and goes away by itself (`durationMs`, default 6 s) or when closed. For hints and problems of your app. Holds no state.                                                                                                                                                                                                                              |
| `TimeSlider`      | A slider through time with play and pause. Pass its day to the map as `today` and the today markers move along the paths. Holds no state.                                                                                                                                                                                                                                                                 |

</details>

- Controls that need the map (`ZoomControls`, `PointMenu`) go inside `<PathWorld>`, and so does `ControlBar`. The controls do not position themselves, so you decide what goes where: a bar with everything in the editor, only a zoom control on the published map.
- The color slots of `PointMenu` are filled by you: it reports a confirmed color with `onCustomColor`, you remember it and pass the list back in `customColors`.
- `PointMenu` calls your callbacks (`onUpdate`, `onAddNext`, `onPathColor`, `onDelete`); you change your data.
- `useTimePlayback` moves the day of a `TimeSlider` forward while it plays. `playbackPlan(days, durationMs)` works out the pace so that any range takes the same time, and the slider can show speed buttons (`speeds`, `speed`, `onSpeedChange`). Moving through time only changes `today`, so the points keep their places. Statuses and strengths as of that day are your app's to work out, the demo shows how.
- With React, import `world-of-evolving-paths/style.css` once for `PathWorld` and the controls. Colors are CSS variables on `.pw-root` (`--pw-bg`, `--pw-ink`, `--pw-lit`, ...), the class `PathWorld` puts on its element.

### More exports

Besides what is shown above, the package exports helpers you may want for your own controls: `usePathWorldHandle`, `useCameraZoom` and `useWorldVersion` for React; `positionOf`, `getCamera` and `subscribeCamera` on the handle; and constants and functions such as `VIEW_LEVELS`, `PATH_PALETTE`, `BACKGROUND_DEFAULTS`, `STRENGTH_RULE`, `tierOf`, `activeDaysIn`, `fromDay` and `todayLocal`. All of them are typed, so your editor shows how to use them.

## 📈 Performance and limits

- Pass a **new object for every period that changed** and keep unchanged ones as they are. The map compares periods by reference and calculates again only when one changed. Changing an object in place is not noticed.
- Camera movement and hover never touch React state. Zooming does not re-render your tree.
- Only changed lines and points are redrawn. The map keeps drawing at up to 40 frames per second while something moves on its own (today markers, moving dashes, the soft light). Set `animate: false` to stop that; the map is then only redrawn when something changes. Users who prefer reduced motion get that by default.
- Keep `background` and other object options stable between renders (define them once). They are compared field by field.
- The first layout of a view costs time with many points: about 150 ms for 200 points and well over a second beyond 500, when none of them is pinned. Pinned points cost almost nothing, so store the positions the user chose (see `onPointMove`). Plan on views with a few dozen points.
- Adding a point to a path can make the view wider and move points that are not pinned. Pin points to keep them where they are.

### Not in this version

Undo and redo belong in your app, and so does passing changes on between week, month and year data. The library never changes your data. The demo shows one way to do undo and redo (`demo/app-logic/history.ts`). Controls are provided for React only; the map itself works with any framework.

## 🔧 Contributing

### Run the demo

`demo/` is a complete example app: six everyday topics over one year, two paths per page, with check-ins that make the paths stronger. It holds the data, builds the `PeriodMap` for each view, handles the events and keeps the pinned positions, using only the public API.

```bash
npm install
npm run dev     # http://localhost:5173
```

### Scripts

| Script               | What it does                             |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Starts the demo.                         |
| `npm test`           | Runs the tests (Vitest).                 |
| `npm run typecheck`  | TypeScript, strict.                      |
| `npm run lint`       | Biome: lint, format check, import order. |
| `npm run format`     | Fixes what Biome can fix.                |
| `npm run build`      | Builds the library into `dist/`.         |
| `npm run build:demo` | Builds the demo into `dist-demo/`.       |

### Project layout

```
src/
  core/            Pure logic, no framework, no Pixi, no browser: dates, calendar, layout,
                   collision, strength tiers, validation, scene model, background CSS
  map/             Framework-free map: createPathWorld wires small parts together:
                   engine/ (orientation, framing, keyboard), interaction/ (pointer, gestures,
                   dragging), render/ (Pixi layers), state/ (world model), camera/, dom/
  react/           React binding (PathWorld) and controls
    controls/      One folder per control (see the table above)
    hooks/         One job per hook
demo/              The demo app (not published)
tests/             Cross-cutting tests and fixtures
```

Layers only depend downwards: `core` ← `map` ← `react`. A test (`tests/architecture.test.ts`) enforces this, and that the library never touches `localStorage`.

## 📝 Changelog

What changed in each version: [CHANGELOG.md](CHANGELOG.md).
