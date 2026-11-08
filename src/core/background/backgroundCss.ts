import type { Camera } from '../camera.js';
import { DOT_TILE, dotImage, FAR_STARS, HEX_TILE, hexImage, NEAR_STARS, STAR_TILE, starImage } from './svgPatterns.js';
import type { BackgroundOptions, BackgroundPattern } from './types.js';

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
type PatternContext = { camera: Camera; strength: number; color: string; scale: number };

const atCamera = ({ camera }: PatternContext, factor = 1) => `${camera.x * factor}px ${camera.y * factor}px`;
const tileSize = (width: number, height: number, scale: number) => `${width * scale}px ${height * scale}px`;

const PATTERN_LAYERS: Record<BackgroundPattern, (context: PatternContext) => Layer[]> = {
  none: () => [],
  hex: (context) => [
    {
      image: hexImage(context.color, context.strength),
      size: tileSize(HEX_TILE.width, HEX_TILE.height, context.scale),
      position: atCamera(context),
    },
  ],
  dots: (context) => [
    {
      image: dotImage(context.color, context.strength),
      size: tileSize(DOT_TILE, DOT_TILE, context.scale),
      position: atCamera(context),
    },
  ],
  stars: (context) =>
    [NEAR_STARS, FAR_STARS].map((layer) => ({
      image: starImage(layer, context.color, context.strength),
      size: tileSize(STAR_TILE, STAR_TILE, context.scale),
      position: atCamera(context, layer.parallax),
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
