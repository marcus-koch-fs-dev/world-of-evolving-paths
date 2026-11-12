<div align="center">

# 🌱 World of Evolving Paths

**Paths with dates that grow stronger the more you walk them.**
A pannable, zoomable canvas for milestones, branches and goals. Think of a skill tree that is also a milestone calendar. The paths are not fixed: they change as you use them.

[![npm](https://img.shields.io/npm/v/world-of-evolving-paths?color=cb3837&logo=npm)](https://www.npmjs.com/package/world-of-evolving-paths)
[![license](https://img.shields.io/npm/l/world-of-evolving-paths?color=3da639)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D24-5fa04e?logo=node.js&logoColor=white)](#-install)
[![demo](https://img.shields.io/badge/live-demo-7c4dff)](https://marcus-koch-fs-dev.github.io/world-of-evolving-paths/)

**[▶ Live demo](https://marcus-koch-fs-dev.github.io/world-of-evolving-paths/)** · [Open in StackBlitz](https://stackblitz.com/github/marcus-koch-fs-dev/world-of-evolving-paths?view=preview) · [Changelog](CHANGELOG.md)

<img src="https://raw.githubusercontent.com/marcus-koch-fs-dev/world-of-evolving-paths/main/docs/demo-all.jpg" alt="Everything at once: all paths with their points, from start to goal" width="360"> <img src="https://raw.githubusercontent.com/marcus-koch-fs-dev/world-of-evolving-paths/main/docs/demo-week.jpg" alt="One week: the points of the week, lines that leave the view and the marker for today" width="360">

</div>

|     |                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📚  | **A library, not an app.** It stores nothing. Your app gives it a store of paths, it draws the views and hands you the new store when the user moves something. |
| 🗓️  | **A tower of views.** Week, month and year are built from one store by the prio of the points: a week shows prio 1–5, a month 3–5, a year only 5. |
| 🛣️  | **Paths that evolve.** Lines you have reached get wider and start to shine the more often you walk the path: from a faint trail to a highway.           |
| 🧲  | **Borders that match.** The arrow where a line crosses the border between two periods has the same height on both sides. Points move alone, paths move as a whole. |
| 🧩  | **Framework-free core.** The map works on any element. A React binding and ready-made controls are included.                                            |

> Status: early (0.x). The API can still change.

## 📑 Contents

| I want to …                        | Go to                                                 |
| ---------------------------------- | ----------------------------------------------------- |
| install it                         | [📦 Install](#-install)                               |
| see it work in a few lines         | [🚀 Quick start](#-quick-start)                       |
| know where to click in the demo    | [🎮 Using the map](#-using-the-map)                   |
| build it into my app               | [🧩 Building your app](#-building-your-app)           |
| look up an object, event or option | [📚 Reference](#-reference)                           |
| know the limits                    | [📈 Performance and limits](#-performance-and-limits) |
| move over from 0.0.x                | [⚠️ Breaking change](#️-breaking-change-the-data-model)  |
| work on the library itself         | [🔧 Contributing](#-contributing)                     |

## 📦 Install

```bash
npm install world-of-evolving-paths
```

`pixi.js` is installed with it. `react` and `react-dom` (18 or newer) are optional peer dependencies, needed only for `world-of-evolving-paths/react`. The package declares Node.js 24 or newer (`engines`).

## 🚀 Quick start

### With React

```tsx
import { useState } from 'react';
import { createStore, periodOf } from 'world-of-evolving-paths';
import { PathWorld, ZoomControls } from 'world-of-evolving-paths/react';
import 'world-of-evolving-paths/style.css';

const period = periodOf('week', '2026-11-04');

// Your data: paths, each with branches, each with points in time order
const start = createStore([
  {
    id: 'combat',
    name: 'Combat',
    color: '#ff3b3b',
    branches: [
      {
        id: 'combat-main',
        points: [
          { id: 'a', date: '2026-11-02', title: 'Sword basics', kind: 'start', status: 'done', prio: 5 },
          { id: 'b', date: '2026-11-05', title: 'Parry', kind: 'milestone', status: 'current', prio: 2 },
        ],
      },
      // A fork: a branch that leaves from a point of another branch
      {
        id: 'combat-shield',
        splitsAt: 'a',
        points: [{ id: 'c', date: '2026-11-06', title: 'Shield', kind: 'goal', status: 'open', prio: 3 }],
      },
    ],
  },
]);

export function Example() {
  const [store, setStore] = useState(start);
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* The map hands you a new store whenever the user moves something. Keep it. */}
      <PathWorld store={store} onStoreChange={setStore} view={period.key}>
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
import { createPathWorld, createStore, periodOf, type PathWorldOptions } from 'world-of-evolving-paths';

const period = periodOf('week', '2026-11-04');
let store = createStore([/* your paths, as in the React example */]);

// The element needs a size, the map fills it
const element = document.getElementById('map')!;

const options = (): PathWorldOptions => ({
  store,
  view: period.key,
  onStoreChange: (next) => {
    store = next; // keep it, then pass it back in
    handle.update(options());
  },
});

const handle = createPathWorld(element, options());

// When you remove the element:
handle.destroy();
```

> [!IMPORTANT]
> **`handle.update(options)` replaces all options, it does not merge them.** Always pass the full set, callbacks included. An option you leave out is gone: without `onStoreChange` nothing can be moved. The easiest way is one function that builds the options, as above.

The stylesheet is only needed for the React binding and its controls. The map itself sets the styles of its element in code (inline styles).

## 🎮 Using the map

The [live demo](https://marcus-koch-fs-dev.github.io/world-of-evolving-paths/) shows what the library can do. This is where to click.

**Points**

| I want to …                      | Do this                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Select a point and open its menu | Click it. Click the empty area to deselect.                                                                                                                                  |
| Move a point                     | Drag it up or down. It stays on its date, so it only moves across the time axis. Its height is kept for the level of the view (week, month or year). The arrows next to it stay where they are. |
| Add a point                      | Double-click the empty area. It joins the branch of the selected point, or the first path. The new point gets the prio the current view needs, so you see it right away. |
| Add the next point               | Point menu → **Next point** → name and date → **Create**.                                                                                                                    |
| Start a **new path**             | Point menu → **Next point** → tick **On a new path (own color)**, give the path a name (optional) and pick a color → **Create**.                                             |
| Change status, kind, name, color | Point menu → **Properties**: Status, Kind, Name, Path color.                                                                                                                 |
| Delete a point                   | Point menu → **Delete**. The path stays connected: the point before and the point after are joined.                                                                          |
| Point hidden after a change      | If you lower the prio of a point, the view may no longer show it. A message says which view shows it, and its button goes there.                                       |

**Lines**

| I want to …                  | Do this                                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Insert a point into a line   | Click or right-click the line → **Insert point**. The new point sits between the two points, on the date where you clicked.                                                  |
| Move a line                  | Drag the arrow at its end, at the border of the view, up or down: only this arrow moves. Drag the line itself: the whole path moves, with all its points and arrows. |
| Keep the height of a line    | Nothing to do. The arrow on a border has one height for both periods next to it. Until you drag it, it lies on the straight line between its two points. |
| See a path that skips a view | A path with points before and after the period, but none inside, runs across the whole view, with the names and dates at both ends. At a fork each branch gets its own line. |

**Paths grow**

| I want to …             | Do this                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Check in on a path      | Select a point of the path, then the **Check in** button at the bottom right. Once per day.                                               |
| Tell done from open     | A point you reached has a check mark in its symbol. The point you are walking to pulses with an arrow, and a point still ahead is dashed. |
| See what a check-in did | A message at the top shows the active days before and after and what the next tier needs.                                                 |
| Undo or redo            | The arrow buttons in the top bar, or Ctrl+Z and Ctrl+Y. Up to 100 steps, kept in memory.                                                  |

**Moving around**

| I want to …              | Do this                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zoom                     | Mouse wheel or pinch.                                                                                                                                                                                               |
| Pan                      | Drag the empty area.                                                                                                                                                                                                |
| Center / fit everything  | Keys **M** and **E** while the pointer is over the map, or the buttons (tiles) in the menu.                                                                                                                         |
| Change the level         | The chips **W** (week), **M** (month), **Y** (year) and **All** in the top bar, or the keys W, M, Y and A.                                                                                                          |
| Show several years       | In the year view, the counter **− 1 +** next to the chips: 1, 2, 5 or 10 years. The keys + and − do the same.                                                                                                       |
| Change the period        | The arrows ◀ ▶ on both sides of the period, or the arrow keys ← →. **Today** (key T) goes to the week of today.                                                                                                     |
| Pick a period directly   | Click the period in the top bar (for example "2026 ▾"). A list opens with the weeks, months and years. The view jumps to the one you pick.                                                                          |
| See which points show    | The **Legend** in the corner (closed at first). It shows, for each prio, from which view on such a point appears.                                                                                             |
| Snap to a grid           | Menu (▦) → **Mode** → Settings → **Snap to grid**. Dragged and added points then sit on a grid.                                                                                                                     |
| Go one level deeper      | Double-click a point. From the year you go to the month, then the week.                                                                                                                                             |
| See where a path goes on | At the start and end of a view, a line runs to the border with an arrow. Next to it you read the name and date of the next or earlier point. Double-click the line or its text to go there. **⤴** brings you back. |
| Go back                  | The **⤴** button in the top bar. It returns to the view before the last double-click.                                                                                                                               |
| Travel through time      | The time slider at the bottom (on a small screen the bar starts closed, open it with **+**). **Play** runs through the days of the view.                                                                            |
| Turn the map             | Menu (▦) → **Map** → Turn left / Turn right.                                                                                                                                                                        |
| Change the background    | Menu (▦) → **Mode** → Settings.                                                                                                                                                                                     |
| Switch to read-only      | Menu (▦) → **Mode** → Map. The editor mode has everything on.                                                                                                                                                       |

> [!TIP]
> Both bars can be dragged to the top or bottom edge, left, middle or right. Everything on the bars is built from the controls of the library, see [Controls](#controls-react).

## 🧩 Building your app

You own the data. The library turns your `store` into a picture, and when the user moves something it hands you the new store.

```
your app ── store, view, options ──▶  PathWorld  ──▶  canvas
   ▲                                      │
   └─ onStoreChange(newStore, { changed, removed }) ─┘
```

> [!NOTE]
> **The library stores nothing.** Undo, saving and loading are your app's job. A store is plain JSON, so you can save it as it is. If you work with several graphs, keep a map of stores yourself (`{ sport: store1, work: store2 }`) and pass the chosen one. The demo shows one way in `demo/app-logic/`.

### The data

```ts
type Store = { paths: StorePath[] };
```

The store is only the list of paths. **A path holds everything about itself**, also what the user arranged on it (`layout`: the heights per level and the places in the free view). So one path is one unit: you give paths in, and you save paths when they change. Pass your paths to `createStore(paths)`:

| Object  | Fields                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------- |
| Path    | `{ id, name, color, lane?, branches, layout? }`. `color` is `#rrggbb`. The `id` must not contain a slash.      |
| Branch  | `{ id, splitsAt?, points }`. A branch with `splitsAt` (the id of a point) forks off from that point.         |
| Point   | `{ id, date, title, kind, status, prio, note?, strength? }`. `date` is `YYYY-MM-DD`, `prio` is 1 to 5.        |

- The points of a branch stand in time order. At the same date the id decides. There is no `next`: a line always connects a point with the one before and the one after it in its branch.
- A branch can only fork off. Two branches do not run together again, and two paths are not connected.
- Heights and arrows are **not** your input. They come from dragging, are kept per level and live in the `layout` of the path. Save the layout with the path.
- `validateStore(paths)` lists what is wrong (double ids, a bad date, a prio outside 1 to 5, a `splitsAt` that does not exist, a fork in a circle). The map runs it and reports through `onError`.

### Show a view

A view is a period of a level: `week`, `month` or `year` (one to ten years). Its key comes from the calendar helpers:

```ts
import { periodOf, shiftPeriod, periodFromKey } from 'world-of-evolving-paths';

const week = periodOf('week', '2026-11-04'); // key 'week:2026-11-02', label 'CW 45, 2 Nov – 8 Nov 2026'
const nextWeek = shiftPeriod(week, 1);
const sameWeek = periodFromKey('week:2026-11-02'); // back from a key

periodOf('week', '2026-11-04', { weekStart: 4 }); // weeks that start on a Friday (0 = Monday ... 6 = Sunday)
periodOf('year', '2026-11-04', { years: 5 }); // key 'year:2022-01-01+5', label '2022–2026': 1 to 10 years
```

**The levels are a tower by prio.** A week shows the points with prio 1 to 5, a month 3 to 5, a year only 5. The same function builds every level, and it works from the whole store, so two periods next to each other always agree.

- Any key that is not a period (for example `'free'`) shows **the free view** with everything. See [The free view](#the-free-view).
- `pathIds` limits the paths shown. Use it to page through many paths: `pathsInView(store, view)` gives the ids that have something in a view.
- `buildLevel(store, level, period)` is the function behind a level. You do not need it to draw, but it shows the elements a branch runs through: its points and its arrows.

### Where lines cross the border

A line of a branch that continues outside the view ends in an **arrow** on the border of the period, at the exact place of the border. It shows the title and date of the point out there. A branch with no point in the view is drawn as a line across the whole view with an arrow at both borders.

Both periods that share a border show the arrow at the **same height**: there is one entry per path, branch and border date, not two. Until the user drags it, the arrow lies on the straight line between its two neighbour points.

A double-click on the line or its text calls `onLeadDoubleClick({ pointId, side, title, date, id })`. Your app decides what happens. The demo goes to the period of that date and selects the point out there.

### What happens when the user drags

The map makes the change and calls `onStoreChange(newStore, { changed, removed })`. Keep the new store and pass it back in as `store`, and save what changed ([Connect your database](#connect-your-database)).

| The user takes …    | What moves                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| a point             | Only this point. The arrows next to it stay where they are.                                                   |
| an arrow            | Only this end. The period on the other side of the border shows it at the same height.                       |
| a line              | The whole path with all its branches: its points and its arrows. Forks of other paths keep their own arrows. |
| (prio changes)      | The point appears or disappears on levels. Heights that were kept stay valid.                                 |

**Heights are per level.** A week, a month and a year have different scales, so each keeps its own heights. A point without a height on a level takes the one from the week, and without any it gets a fixed default that depends only on the point itself. Heights are distances from the lane of the path (0 = on the lane, negative = above when time runs left to right).

The update functions behind it are exported, so you can call them yourself: `movePoint`, `moveArrow`, `movePath`, `addPoint`, `updatePoint`, `removePoint`, `addBranch`, `addPath`, `updatePath` and `forgetHeights`. All are pure: they return a new store.

By default a dragged point moves only across the time axis (`timeLocked: true`), so it stays on its date. Set `timeLocked: false` to let it leave its date. With `snap` (a distance in world units) dragged and added points sit on a grid.

**Clicking a line.** `onLineSelect({ from, to, x, y, date, lanes, at })` comes when the user clicks or right-clicks a line. `from` and `to` are its two ends, `date` is the date where it was clicked, and `lanes` the lane of every path, so `y - lanes[pathId]` is the height for a new point. Show a `LineMenu` at `at`, for example with **Insert point**.


### Connect your database

One rule: **the unit is the path.** What you save and what you load are whole paths, and the map tells you which ones changed.

```tsx
<PathWorld
  store={store}
  view={view}
  onStoreChange={(next, { changed, removed }) => {
    setStore(next); // your state, passed back in as `store`
    changed.forEach(savePath); // new or different paths, whole, with their layout
    removed.forEach(deletePath); // ids of paths that are gone
  }}
/>
```

- **Into the map:** `store = { paths }`. Load your paths from the database as they are and pass them in. Nothing else.
- **Out of the map:** `onStoreChange(store, { changed, removed })`. `store` is the new whole store for your state. `changed` holds the paths that are new or different, each one whole. `removed` holds the ids of paths that are gone. Save `changed`, delete `removed`, nothing more. How you save a path (one row, one document, one file) is up to you.
- **Where it comes from.** The map hands over `changed` after every move. The functions that change the store (`movePoint`, `updatePoint`, `addPoint`, …) keep every path they do not touch as the same object, so `storeChanges(before, after)` gives the same answer for changes you make yourself. Moving a point can touch two paths: the arrows of a fork that leaves from that point belong to the fork's path.
- **Something changed in the database by someone else?** Replace that path with `replacePath(store, path)` and pass the store in again. Other paths stay the same objects.

### Big data, small updates

The store is your state, so you change it in small pieces and the map only works on what changed:

- **Replace one path.** Put a new path object in the place of the old one and keep all other paths as they are: `replacePath(store, path)`, or `paths.map(...)` yourself. Paths that are the same objects as before are not worked out again, because the map keeps its results per path (`createStoreCache`, used inside the map; you can pass your own to `placeLevel` and `pathsInView`). A fork is worked out again when the path it leaves from changed.
- **Show only some paths.** `pathIds` limits the paths. Only these are worked out, the rest of the store is not touched.
- **Load in pieces.** The library does not load anything. Load by path (a page of paths), by prio (a year needs only prio 5, a month 3 to 5) or by time window with one neighbour point before and after the window for the arrows. Every path comes with its own `layout`, so loading a path loads its heights.
- **Save only what changed.** See [Connect your database](#connect-your-database).

Measured with 80,000 points in 100 paths (a week of 2 paths, in a Node script, best of 5): about 70 ms without the cache, about 0.2 ms with it. The free view of 2 paths went from about 74 ms to 3 ms. Finding out which paths have something in a view (`pathsInView`) still looks at every path and took about 10 ms.
### The free view

Every view that is not a period shows all points of all paths. With the option `freeMove` on, points and whole paths can be moved freely in every direction, without a time axis. These places are kept in the `layout.free` of each path, apart from the heights of the levels, so week, month and year do not change. It is meant for arranging things your own way, for example to lay points out as a figure. With `freeMove` off, the free view is only an overview.

### Add points and paths

- The user double-clicks the empty area: `onPointAdd({ x, y, date, lanes })` tells you where. You decide whether and how to add a point, for example with `addPoint(store, branchId, point)`. `y - lanes[pathId]` is its height for the path you put it on.
- The user double-clicks a point: `onPointDoubleClick({ id, date })` tells you which one. The demo uses it to go one level deeper.
- The `PointMenu` control has a **Next point** panel. It calls your `onAddNext({ title, date, newPath, color, pathName })`. The demo adds the point to the same branch, and with `newPath` as the first point of a new branch that forks off.
- A new path is `addPath(store, { id, name, color, branches })`.

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

The strength of a path arrives at its next point: the border of a reached point is thicker the stronger the path that led to it. The prio of a point is separate. It is your own rating from 1 to 5 and decides the size of the symbol and on which levels the point shows. A strong path does not make a point more important.

Lines to points that are not reached yet stay thin and are drawn with dots.

### Dates and language

The date under a point is short, `2.11.` in German, and carries the year only when it is not the current one. Set `locale` (`de`, `en-GB`, `en-US`, ...) to choose the order and separators. Without it the browser's language is used. To write the date yourself, for example with your own date library, pass `formatDate: (iso) => string`.

The labels of periods follow the same language: `periodLabel(period, 'de')` gives `KW 45, 2.11. – 8.11.2026`. `period.label` is the English one.

### Camera and direction of time

Mouse wheel and pinch zoom, drag to pan. When the view changes, the zoom stays and the content is centered. `handle.fit()` fits the content into about 60 % of the viewport, so a frame of empty space stays around it. `handle.center()` and `handle.zoomBy(factor)` do the same from code. With React, put a `ref` on `<PathWorld>` to get the handle (it is `null` until the map exists).

The option `orientation` sets which way time runs: `horizontal` (left to right), `horizontal-inverted` (right to left), `vertical` (top to bottom), `vertical-inverted` (bottom to top) or `auto` (vertical when the map is taller than wide, good for phones). Only the picture turns. Your data, the positions you store and the events stay the same.

`handle.getDirection()` tells which way time runs right now, also with `orientation: 'auto'`. `rotateDirection(direction, 'left' | 'right')` gives the direction after a quarter turn, so you can build your own turn buttons.

## 📚 Reference

### Objects

**`StorePoint`** is one point of a branch.

| Field      | Type                                              | Meaning                                                                                         |
| ---------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `id`       | `string`                                          | Unique in the whole store.                                                                      |
| `date`     | `string`                                          | ISO date `YYYY-MM-DD`. Decides the place along the time axis and the order in its branch.      |
| `title`    | `string`                                          | Shown under the point.                                                                          |
| `kind`     | `'start' \| 'milestone' \| 'crossroad' \| 'goal'` | Start ▲, goal ★, fork ◆ (also when a branch forks off), otherwise ●.                            |
| `status`   | `'done' \| 'current' \| 'open' \| 'abandoned'`    | Looks and animation.                                                                            |
| `prio`     | `number` (1–5)                                    | Decides on which levels the point shows, and its size. Week 1–5, month 3–5, year 5.             |
| `note`     | `string` (optional)                               | Free text for your app.                                                                         |
| `strength` | `number` (0–4, optional)                          | Tier of the line leading to this point. See [Make paths stronger](#make-paths-stronger).        |

**`Branch`** is `{ id, splitsAt?, points }`. **`StorePath`** is `{ id, name, color, lane?, branches, layout? }`. Paths are placed one below the other by `lane` (lowest number first), otherwise in list order. **`Store`** is `{ paths }`, made by `createStore(paths)`. **`PathLayout`** is `{ heights?, free? }`: what the user arranged on a path.

The data is checked when it arrives. Invalid data is reported through `onError`, the message says where the problem is, and nothing is drawn. Without `onError` the messages go to `console.error`. `validateStore(paths)` runs the same check yourself.

### Events

All events are options of `PathWorld` and `createPathWorld`.

| Callback                                                | When                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStoreChange(store, { changed, removed })`            | The user moved a point, an arrow or a path. Keep the new store and pass it back as `store`, and save `changed` and `removed`. Without it nothing can be moved.                                                          |
| `onSelect(id \| null)`                                  | A point was pressed (also when it is then dragged), or the empty area was clicked (`null`).                                                                                           |
| `onPointAdd({ x, y, date, lanes })`                     | The empty area was double-clicked. In a period `date` follows the horizontal position. `lanes` holds the lane of every path.                                                          |
| `onPointDoubleClick({ id, date })`                      | A point was double-clicked. Your app decides what happens, for example a finer view.                                                                                                  |
| `onLeadDoubleClick({ pointId, side, title, date, id })` | A line that crosses the border was double-clicked, on its text or on the line. `side` is `'before'` for a line that comes from outside and `'after'` for one that goes on.           |
| `onLineSelect({ from, to, x, y, date, lanes, at })`     | A line was clicked or right-clicked. `from` and `to` are its ends, `x`/`y`/`date` the place on the line, `at` the place for a `LineMenu`.                                             |
| `onError(errors)`                                       | The data is invalid, or an option such as `today`, `locale` or a background color is invalid (it is then replaced by its default).                                                    |

If you do not answer a move within 80 ms with a **new** `store` object, the point moves back to where it was. Changing the old object in place does not count, the map compares by reference.

### Options

**Copy this object.** It lists every option of `PathWorld` and `createPathWorld` with its default value. Only `store` and `view` are needed, so you can delete every other line.

```ts
import type { PathWorldOptions } from 'world-of-evolving-paths';

const options: PathWorldOptions = {
  store, // required: from createStore(paths)
  view: period.key, // required: the key of the period to show; any other key is the free view
  // pathIds: ['gym', 'reading'], // no default: show only these paths (for paging)
  today: '2026-11-10', // default: today's local date
  editable: true, // false: no moving and no adding of points
  pointsLocked: false, // true: points cannot be dragged
  timeLocked: true, // false: a dragged point may leave its date
  freeMove: false, // true: in the free view, points and paths can be moved freely
  // snap: 40, // no default: dragged and added points snap to a grid with this distance
  wavy: false, // true: a slight wave on the lines
  animate: true, // false: no moving parts (also the default for users who prefer reduced motion)
  orientation: 'horizontal', // 'horizontal-inverted' | 'vertical' | 'vertical-inverted' | 'auto'
  locale: 'en-GB', // default: the language of the browser
  shortcuts: true, // keys M (center) and E (fit)
  background: {
    // every value here is the default
    fill: 'solid', // or 'gradient'
    pattern: 'none', // or 'stars' | 'hex' | 'dots'
    base: '#0e0f0c', // base color
    color: '#edefe6', // color of the pattern
    color2: '#1d3a4a', // second color of the gradient
    angle: 180, // direction of the gradient in degrees
    mid: 50, // middle of the gradient in percent
    intensity: 0.5, // brightness of the pattern, 0 to 1
    scale: 1, // size of the pattern, 0.5 to 2
  },
  // formatDate: (iso) => iso, // no default: write the date under a point yourself
  // The events, all optional (see Events above):
  // onStoreChange, onSelect, onPointAdd, onPointDoubleClick, onLeadDoubleClick, onLineSelect, onError
};
```

The `PointMenu` has options too. These are the defaults:

```tsx
<PointMenu
  point={point} // a StorePoint
  path={path}
  onUpdate={onUpdate} // gets a patch such as { prio: 4 }
  onAddNext={onAddNext}
  onPathColor={onPathColor}
  onDelete={onDelete}
  canComplete // true: false while earlier points are not done yet
  isFork={false} // true: a branch forks off from this point
  importanceRange={[1, 5]}
  placement="auto" // 'below' | 'above' | 'right' | 'left'
  hide={[]} // tiles to leave out: 'status' | 'next' | 'connect' | 'kind' | 'color' | 'rename' | 'details' | 'remove'
  // colors={PATH_PALETTE}, customColors, onCustomColor, onConnect, connecting, checkInCount: no default
/>;
```


### Controls (React)

Ready-made controls are imported from `world-of-evolving-paths/react`. In the repository they live in `src/react/controls/`, one folder per control with its own styles; their props are typed, so your editor shows what each one needs. They hold no map logic: they get values and callbacks, so you can restyle or replace them.

<details>
<summary><b>All controls</b> (click to open)</summary>

| Control           | What it does                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ZoomControls`    | Zoom out, zoom in, center, fit. Place it inside `PathWorld`.                                                                                                                                                                                                                                                                                                                                                                         |
| `ViewBar`         | Level buttons (or one dropdown with `compact`), previous/next period, today, pages, reroll. With `onDateChange` (and `date`) a click on the period opens a date picker. Holds no state. `levelChips` keeps the level buttons with `periodOnly`, `freeLast` puts the free view after the levels, `afterLevels` and `periodSlot` take your own controls (for example a counter of years and a period picker).                          |
| `ControlBar`      | A bar fixed to the top or bottom edge (`dock`: `top-left`, `top-center`, `top-right`, `bottom-...`). Bars on one edge sit side by side. With `onDockChange` the user drags it to another place, you store it; with `label` it can be folded.                                                                                                                                                                                         |
| `TilePanel`       | One button (`▦`) that opens a small panel of buttons (tiles) in groups, like a number pad. You give the groups and tiles (glyph, label, `active`, `disabled`, `onClick`). It opens away from the edge of its `ControlBar` and stays open until the button is clicked again or Escape is pressed. `ViewBar` with `periodOnly` pairs with it: the period stays in the bar, everything else goes into tiles.                            |
| `SidePanel`       | A panel over the full height at the left or right side, with a close button. Scrolls when long. For settings.                                                                                                                                                                                                                                                                                                                        |
| `BackgroundPanel` | Fill (plain or gradient with two colors), pattern, brightness and size. Holds no state.                                                                                                                                                                                                                                                                                                                                              |
| `PointMenu`       | Menu with buttons at a selected point. Actions: next point, delete. Properties: status, kind, name, path color (with slots for your own colors) and details. The menu shows the name of the path of the point. `checkInCount` shows the check-ins of the path. It moves with the map and sits below the point, or above when there is no room (`placement`: `auto`, `below`, `above`, `right`, `left`). |
| `Toast`           | A short message at the top of the map that slides in and goes away by itself (`durationMs`, default 6 s) or when closed. For hints and problems of your app. With `action` it shows a button. Holds no state.                                                                                                                                                                                                                        |
| `LineMenu`        | Tile menu at a clicked line, in the look of `PointMenu`. Place it inside `PathWorld` at `at` of `onLineSelect`; you give the title and the tiles.                                                                                                                                                                                                                                                                                    |
| `TimeSlider`      | A slider through time with play and pause. Pass its day to the map as `today` and the today markers move along the paths. Holds no state.                                                                                                                                                                                                                                                                                            |

</details>

- Controls that need the map (`ZoomControls`, `PointMenu`) go inside `<PathWorld>`, and so does `ControlBar`. The controls do not position themselves, so you decide what goes where: a bar with everything in the editor, only a zoom control on the published map.
- The color slots of `PointMenu` are filled by you: it reports a confirmed color with `onCustomColor`, you remember it and pass the list back in `customColors`.
- `PointMenu` calls your callbacks (`onUpdate`, `onAddNext`, `onPathColor`, `onDelete`); you change your data.
- `useTimePlayback` moves the day of a `TimeSlider` forward while it plays. `playbackPlan(days, durationMs)` works out the pace so that any range takes the same time, and the slider can show speed buttons (`speeds`, `speed`, `onSpeedChange`). Moving through time only changes `today`, so the points keep their places. Statuses and strengths as of that day are your app's to work out, the demo shows how.
- With React, import `world-of-evolving-paths/style.css` once for `PathWorld` and the controls. Colors are CSS variables on `.pw-root` (`--pw-bg`, `--pw-ink`, `--pw-lit`, ...), the class `PathWorld` puts on its element.

### More exports

Besides what is shown above, the package exports helpers you may want for your own controls: `usePathWorldHandle`, `useCameraZoom` and `useWorldVersion` for React; `positionOf`, `getCamera` and `subscribeCamera` on the handle; and constants and functions such as `VIEW_LEVELS`, `PATH_PALETTE`, `BACKGROUND_DEFAULTS`, `STRENGTH_RULE`, `tierOf`, `activeDaysIn`, `fromDay`, `todayLocal` and `symbolSize`. All of them are typed, so your editor shows how to use them.

## 📈 Performance and limits

- Pass a **new `store` object** whenever something changed and keep it as it is otherwise. The map compares by reference and builds the view again only when the store, the view, the shown paths or `today` changed.
- Camera movement and hover never touch React state. Zooming does not re-render your tree.
- Only changed lines and points are redrawn. The map keeps drawing at up to 40 frames per second while something moves on its own (today markers, moving dashes, the soft light). Set `animate: false` to stop that; the map is then only redrawn when something changes. Users who prefer reduced motion get that by default.
- Keep `background` and other object options stable between renders (define them once). They are compared field by field.

### What your app does

The library draws and reports, your app holds the state. That is a choice, not a gap:

- **Undo and redo** work on your state. The demo keeps a history of its states (`demo/app-logic/history.ts`, `stateHistory.ts`).
- **Saving and loading** are yours, in whatever store you use. The store is plain JSON.
- **Week, month and year** are views of the same store. You do not build them: the library does, from the prio of the points.
- **Strength and time travel:** statuses and strengths as of a day are your app's to work out. The demo does it by passing a copy of the store with other `status` and `strength` values (`demo/app-logic/appearance.ts`). Take only the `layout` of the paths in `changed`, so that look does not become your data.

Controls are provided for React only; the map itself works with any framework.

## ⚠️ Breaking change: the data model

Yes, again. We are sorry. It is the last time we ask you to rewrite your data, and this time it gets simpler. 🙈

| Before (0.0.x)                                                       | Now                                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `periods: PeriodMap` (one `PeriodData` per view, built by you)       | `store: Store` (one store, the library builds every view)                        |
| Points linked with `next`, even across paths                         | Branches: a point is linked to its neighbours in the branch. Forks use `splitsAt`. |
| `incoming`, `outgoing`, `through` on points and paths                | Gone. The library makes the arrows at the borders itself.                        |
| `importance` on a point, filtered by your app                        | `prio` (1–5). Week 1–5, month 3–5, year 5, built in.                             |
| `x`, `y`, `seed`, pins, `offsets`, `positions`                       | Gone. Heights are kept per level in the `layout` of each path.                           |
| `onPointMove`, `onLineEndMove` and your own bookkeeping              | `onStoreChange(store, changes)`. Keep it, save `changed`.                                        |
| `PathPoint`, `Path`, `PeriodData`, `PeriodMap`, `validatePeriodData` | `StorePoint`, `StorePath`, `Store`, `createStore`, `validateStore`               |
| Points push each other away, layouts could differ between periods    | No collision search. Two periods next to each other agree on every border.       |
| Connect two points, merge branches                                   | Gone. A branch can only fork off.                                                |

How to move over: put your points into branches (one main branch per path, a `splitsAt` branch for every fork), turn `importance` into `prio`, drop `next`, `incoming`, `outgoing`, `through` and all pinned positions, and pass `store` instead of `periods`.


## 🔧 Contributing

### Run the demo

`demo/` is a complete example app: four everyday topics over about half a year, one point per week, two paths per page, with check-ins that make the paths stronger. It holds the paths, passes the store to the map, keeps what the map hands back (with undo), and uses only the public API.

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

src/  core/            Pure logic, no framework, no Pixi, no browser: dates, calendar, the store (paths,                   levels, heights, update functions), placing a view, scene model, strength tiers,                   background CSS  map/             Framework-free map: createPathWorld wires small parts together:                   engine/ (orientation, framing, keyboard, store edits), interaction/ (pointer,                   gestures, dragging), render/ (Pixi layers), state/ (world model), camera/, dom/  react/           React binding (PathWorld) and controls    controls/      One folder per control (see the table above)    hooks/         One job per hookdemo/              The demo app (not published)tests/             Cross-cutting tests and fixtures

Layers only depend downwards: `core` ← `map` ← `react`. A test (`tests/architecture.test.ts`) enforces this, and that the library never touches `localStorage`.

## 📝 Changelog

What changed in each version: [CHANGELOG.md](CHANGELOG.md).
