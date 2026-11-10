# Changelog

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
