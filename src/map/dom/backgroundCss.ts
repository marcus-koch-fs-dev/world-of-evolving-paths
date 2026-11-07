import type { Camera } from '../../core/camera';
import type { BackgroundOptions, BackgroundPattern } from '../options';

export const DEFAULT_BASE = '#0e0f0c';
export const DEFAULT_PATTERN_COLOR = '#edefe6';
export const DEFAULT_COLOR2 = '#1d3a4a';

// What each background option is when it is left out.
export const BACKGROUND_DEFAULTS = {
  base: DEFAULT_BASE,
  color: DEFAULT_PATTERN_COLOR,
  color2: DEFAULT_COLOR2,
  angle: 180,
  mid: 50,
  intensity: 0.5,
  scale: 1,
} as const;

export type BackgroundCss = {
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
};

type Layer = { image: string; size: string; position: string };

const HEX_RADIUS = 30; // radius of a honeycomb cell in world units
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_TILE = { width: HEX_WIDTH, height: 3 * HEX_RADIUS }; // two rows, seamless
const DOT_TILE = 22;
const STAR_TILE = 512;
const NEAR_STARS = { seed: 42, count: 42, maxRadius: 1.6, alpha: 0.9, parallax: 0.35 };
const FAR_STARS = { seed: 7, count: 160, maxRadius: 0.9, alpha: 0.5, parallax: 0.15 };

/** `#rrggbb` and an alpha to a CSS color. */
function rgba(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const clamped = Math.min(1, Math.max(0, alpha)).toFixed(3);
  return `rgb(${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255} / ${clamped})`;
}

/** Seeded random numbers, so the stars look the same on every load. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

function starSvg(layer: typeof NEAR_STARS, color: string, alpha: number): string {
  const random = mulberry32(layer.seed);
  let circles = '';
  for (let i = 0; i < layer.count; i++) {
    const x = (random() * STAR_TILE).toFixed(1);
    const y = (random() * STAR_TILE).toFixed(1);
    const radius = (0.3 + random() * layer.maxRadius).toFixed(2);
    circles += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${rgba(color, alpha * (0.4 + random() * 0.6))}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STAR_TILE}" height="${STAR_TILE}">${circles}</svg>`;
}

const cache = new Map<string, string>();
function cached(key: string, make: () => string): string {
  let value = cache.get(key);
  if (!value) {
    value = make();
    cache.set(key, value);
  }
  return value;
}

type PatternContext = { camera: Camera; strength: number; color: string; scale: number };

const PATTERN_LAYERS: Record<BackgroundPattern, (context: PatternContext) => Layer[]> = {
  none: () => [],
  hex: ({ camera, strength, color, scale }) => [
    {
      image: svgUrl(
        cached(`hex-${Math.round(strength * 100)}-${color}`, () => hexSvg(color, Math.min(1, 0.14 * strength))),
      ),
      size: `${HEX_TILE.width * scale}px ${HEX_TILE.height * scale}px`,
      position: `${camera.x}px ${camera.y}px`,
    },
  ],
  dots: ({ camera, strength, color, scale }) => [
    {
      image: svgUrl(
        cached(`dots-${Math.round(strength * 100)}-${color}`, () => dotSvg(color, Math.min(1, 0.22 * strength))),
      ),
      size: `${DOT_TILE * scale}px ${DOT_TILE * scale}px`,
      position: `${camera.x}px ${camera.y}px`,
    },
  ],
  stars: ({ camera, strength, color, scale }) =>
    [NEAR_STARS, FAR_STARS].map((layer) => ({
      image: svgUrl(
        cached(`stars-${layer.seed}-${Math.round(strength * 100)}-${color}`, () =>
          starSvg(layer, color, Math.min(1, layer.alpha * strength)),
        ),
      ),
      size: `${STAR_TILE * scale}px ${STAR_TILE * scale}px`,
      position: `${camera.x * layer.parallax}px ${camera.y * layer.parallax}px`,
    })),
};

/** Pattern layers from top to bottom. All scale with the zoom; the stars move slower to look deep. */
function patternLayers(pattern: BackgroundPattern, camera: Camera, options: BackgroundOptions): Layer[] {
  return PATTERN_LAYERS[pattern]({
    camera,
    strength: Math.min(1, Math.max(0, options.intensity ?? 0.5)) * 2, // 0.5 is the normal value (1)
    color: options.color ?? DEFAULT_PATTERN_COLOR,
    scale: camera.zoom * (options.scale ?? 1),
  });
}
/** CSS for the background behind the map: a plain color or gradient at the bottom, a pattern on top. */
export function backgroundCss(options: BackgroundOptions, camera: Camera): BackgroundCss {
  const base = options.base ?? DEFAULT_BASE;
  const layers = patternLayers(options.pattern ?? 'none', camera, options);
  if (options.fill === 'gradient') {
    const color2 = options.color2 ?? BACKGROUND_DEFAULTS.color2;
    const angle = options.angle ?? BACKGROUND_DEFAULTS.angle;
    const mid = options.mid ?? BACKGROUND_DEFAULTS.mid;
    layers.push({
      image: `linear-gradient(${angle}deg, ${base} 0%, color-mix(in srgb, ${base}, ${color2}) ${mid}%, ${color2} 100%)`,
      size: 'auto',
      position: '0 0',
    });
  }
  return {
    backgroundColor: base,
    backgroundImage: layers.length > 0 ? layers.map((layer) => layer.image).join(', ') : 'none',
    backgroundSize: layers.map((layer) => layer.size).join(', '),
    backgroundPosition: layers.map((layer) => layer.position).join(', '),
    backgroundRepeat: layers.map(() => 'repeat').join(', '),
  };
}
