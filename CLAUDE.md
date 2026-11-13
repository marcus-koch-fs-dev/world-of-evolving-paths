# CLAUDE.md — World of Evolving Paths

A TypeScript library for date-based, evolving paths on a pannable, zoomable canvas. The library stores nothing: the app passes a store of paths, branches and points in, the library builds week, month and year from it, draws them and hands back the new store when the user moves something.

## Language and commits

- Everything is in **English**: code, comments, identifiers, commit messages, UI texts, docs.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`). The title is one short line.
- Add a body only when the why is not obvious, and keep it to 1–2 lines.
- Keep the `Co-Authored-By` trailer.

## Git

- Create the branch before the first edit. Never work directly on `main`, not even for small changes.
- One branch per feature: `feature-<short-topic>`. Merge into `main` with `git merge --no-ff`, never squash or rebase.
- Before merging: `/code-review`, fix the findings, then run all tests. While bugs are still being found, run focused checks only.

## Stack

- TypeScript (strict), PixiJS, Vite, React only in the React adapter.
- Biome for lint, format and imports. Vitest for tests.
- No new dependencies without asking.
- Node.js 24 (`engines >=24`, CI and Docker on `node:24`).

## Architecture

Dependencies point downwards only: `core` ← `map` ← `react`.

1. **core:** pure functions, no framework, no Pixi, no browser APIs.
2. **map:** framework-free engine with rendering and interaction (`createPathWorld`).
3. **react:** thin binding and controls. No business logic.

Test: does the function need React, Pixi or the browser to run? If yes, it belongs to map or react. If no, it belongs to core.

The library never touches `localStorage` or stores data. A test enforces the layer rules.

## Components, hooks, controls

- One responsibility per component. Split components that do two jobs.
- One job per hook; its name says which. Keep `useEffect` and `useState` small. Don't store what can be derived.
- Each control lives in its own folder under `src/react/controls/` with its styles. Controls hold no map logic.

## Code style

- **Functional approach: no classes of our own.** State lives in factory functions with closures (`createX`). Put the logic into small, separate, exported functions that take the state they need as parameters, so only what is used gets loaded. Classes from other libraries, such as Pixi's, are fine.
- **Single responsibility for factories, modules and hooks, too.** A `createX` factory, a module or a hook does one job. A main factory only wires smaller ones together. Split when a factory grows past about 8 inner functions or 120 lines, or when it holds two unrelated pieces of state. Pure parts (diffs, calculations) become separate, tested functions. Apply this while writing, not in a later cleanup.
- **Modern JavaScript only (ES2023).** Write it this way from the first line, not in a later cleanup. `const` by default, `let` only when a value really changes, never `var`. Destructuring, spread, optional chaining, `??`, template strings, arrow functions, `async`/`await` instead of `.then`, `.at(-1)` instead of `[length - 1]`, `includes` instead of `indexOf`.
- **No `for` or `while` loops.** Use array methods (`map`, `filter`, `find`, `findLast`, `some`, `every`, `flatMap`, `reduce`, `forEach`). State from step to step goes into `reduce` or a small recursive function.
- **No mutable state at module level.** A cache or counter lives inside a factory, or has a size limit.
- **One pattern, one helper.** When the same pattern shows up a second time (slot sync, easing, random numbers), it becomes a shared, tested function.
- A component with many props takes one settings object and a single `onChange(patch)` instead of a prop and a callback per value.
- **No n² work for simple tasks.** Before iterating inside an iteration, look for a better algorithm (Map lookup, grouping, sorting).
- **CSS sizes are `rem`** (16px = 1rem), so controls grow with the user's font size. Icon sizes are `em`. Only hairlines (1 to 2px borders) stay `px`. Touch targets are at least `2.75rem` (`@media (pointer: coarse)`).
- **Icons come from `src/react/icons`** (Phosphor, MIT, regular and fill), never from Unicode symbols: those look different on every system. Add an icon by adding its name to the generator list, not by drawing paths.
- Relative imports in `src/` end in `.js` (`./geometry.js`, `./map/index.js`), so the published types resolve under `node16`. Check with `npx tsc -p tsconfig.build.json --noEmit --module node16 --moduleResolution node16`.
- No `any`. Type data and state explicitly.
- Guard clauses over nesting. Descriptive names, no abbreviations. Magic values become named constants.
- Fixed mappings from a union type are `Record` hashmaps, not `switch`.
- Exported functions get a short TSDoc comment (what it does, 1–2 lines). No doc comments on plain objects, consts or interfaces.
- Don't fight the linter.

## Performance

- A changed input must not re-render the whole tree.
- Camera and hover live in the map engine, not in React state.
- Redraw only what changed. Measure before optimising.

## Tests

- Structure: `describe('Topic') > describe('when …') > it('outcome')`. Lowercase nested titles that start with `when`, outcomes in present tense without "should".
- Each test is Arrange, Act, Assert, visibly separated.
- Unit tests sit next to their file (`collide.ts` → `collide.test.ts`). Cross-cutting fixtures live in `tests/`.

## Never

- Swallow errors. Every error has a clear message.
- Put logic into components.
- Commit or push without the user's explicit OK.
