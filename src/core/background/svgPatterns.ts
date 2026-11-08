import { createBoundedCache } from '../boundedCache.js';
import { createSequence } from '../random.js';

const HEX_RADIUS = 30; // radius of a honeycomb cell in world units
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
export const HEX_TILE = { width: HEX_WIDTH, height: 3 * HEX_RADIUS }; // two rows, seamless
export const DOT_TILE = 22;
export const STAR_TILE = 512;
export const NEAR_STARS = { seed: 42, count: 42, maxRadius: 1.6, alpha: 0.9, parallax: 0.35 };
export const FAR_STARS = { seed: 7, count: 160, maxRadius: 0.9, alpha: 0.5, parallax: 0.15 };

const CACHE_LIMIT = 64; // pattern images kept; a color picker would otherwise fill memory with one per color

export type StarLayer = typeof NEAR_STARS;

/** `#rrggbb` and an alpha to a CSS color. */
function rgba(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const clamped = Math.min(1, Math.max(0, alpha)).toFixed(3);
  return `rgb(${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255} / ${clamped})`;
}

const svgUrl = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

function hexSvg(color: string, alpha: number): string {
  const halfWidth = HEX_WIDTH / 2;
  const cell = (cx: number, cy: number) =>
    `M ${cx.toFixed(3)} ${(cy - HEX_RADIUS).toFixed(3)} L ${(cx + halfWidth).toFixed(3)} ${(cy - HEX_RADIUS / 2).toFixed(3)} ` +
    `L ${(cx + halfWidth).toFixed(3)} ${(cy + HEX_RADIUS / 2).toFixed(3)} L ${cx.toFixed(3)} ${(cy + HEX_RADIUS).toFixed(3)} ` +
    `L ${(cx - halfWidth).toFixed(3)} ${(cy + HEX_RADIUS / 2).toFixed(3)} L ${(cx - halfWidth).toFixed(3)} ${(cy - HEX_RADIUS / 2).toFixed(3)} Z`;
  const rowHeight = 1.5 * HEX_RADIUS;
  const centers: [number, number][] = [
    [0, 0],
    [HEX_WIDTH, 0],
    [0, 2 * rowHeight],
    [HEX_WIDTH, 2 * rowHeight],
    [halfWidth, rowHeight],
  ];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${HEX_TILE.width}" height="${HEX_TILE.height}" viewBox="0 0 ${HEX_TILE.width} ${HEX_TILE.height}">` +
    `<path d="${centers.map(([x, y]) => cell(x, y)).join(' ')}" fill="none" stroke="${rgba(color, alpha)}" stroke-width="0.8"/></svg>`
  );
}

function dotSvg(color: string, alpha: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${DOT_TILE}" height="${DOT_TILE}">` +
    `<circle cx="${DOT_TILE / 2}" cy="${DOT_TILE / 2}" r="0.9" fill="${rgba(color, alpha)}"/></svg>`
  );
}

function starSvg(layer: StarLayer, color: string, alpha: number): string {
  const random = createSequence(layer.seed);
  const circles = Array.from({ length: layer.count }, () => {
    const x = (random() * STAR_TILE).toFixed(1);
    const y = (random() * STAR_TILE).toFixed(1);
    const radius = (0.3 + random() * layer.maxRadius).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${rgba(color, alpha * (0.4 + random() * 0.6))}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STAR_TILE}" height="${STAR_TILE}">${circles}</svg>`;
}

// The images are kept per color and strength; the limit keeps the cache small while a color is being picked
const images = createBoundedCache<string>(CACHE_LIMIT);
const percent = (strength: number) => Math.round(strength * 100);

/** CSS `url(...)` of the honeycomb tile. */
export const hexImage = (color: string, strength: number): string =>
  images.get(`hex-${percent(strength)}-${color}`, () => svgUrl(hexSvg(color, Math.min(1, 0.14 * strength))));

/** CSS `url(...)` of the dot tile. */
export const dotImage = (color: string, strength: number): string =>
  images.get(`dots-${percent(strength)}-${color}`, () => svgUrl(dotSvg(color, Math.min(1, 0.22 * strength))));

/** CSS `url(...)` of one layer of stars. */
export const starImage = (layer: StarLayer, color: string, strength: number): string =>
  images.get(`stars-${layer.seed}-${percent(strength)}-${color}`, () =>
    svgUrl(starSvg(layer, color, Math.min(1, layer.alpha * strength))),
  );
