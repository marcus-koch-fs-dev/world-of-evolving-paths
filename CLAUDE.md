# CLAUDE.md — World of Evolving Paths

A TypeScript library for date-based, evolving paths on a pannable, zoomable canvas. The library stores nothing and prepares no data: the app passes objects in, the library draws them and reports user events.

## Language and commits

- Everything is in **English**: code, comments, identifiers, commit messages, UI texts, docs.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`). The title is one short line.
- Add a body only when the why is not obvious, and keep it to 1–2 lines.
- Keep the `Co-Authored-By` trailer.

## Git

- One branch per feature: `feature-<short-topic>`. Merge into `main` with `git merge --no-ff`, never squash or rebase.
- Run `/code-review` on the feature branch before merging.

## Stack

- TypeScript (strict), PixiJS, Vite, React only in the React adapter.
- Biome for lint, format and imports. Vitest for tests.
- No new dependencies without asking.

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
