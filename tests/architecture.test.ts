import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');

/** Layers from lowest to highest. A layer may only import from itself and from layers below it. */
const LAYERS = ['core', 'map', 'react'] as const;
const FORBIDDEN_PACKAGES: Record<(typeof LAYERS)[number], string[]> = {
  core: ['pixi.js', 'react', 'react-dom'],
  map: ['react', 'react-dom'],
  react: [],
};

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

function importsOf(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  return [...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

describe('Architecture', () => {
  LAYERS.forEach((layer, index) => {
    describe(`when reading the ${layer} layer`, () => {
      const higher = LAYERS.slice(index + 1);
      const files = sourceFiles(join(SRC, layer));

      it('does not import from a higher layer', () => {
        const offenders = files.flatMap((file) =>
          importsOf(file)
            .filter((spec) => spec.startsWith('.'))
            .filter((spec) => {
              const target = relative(SRC, join(file, '..', spec)).split(/[\\/]/)[0];
              return higher.includes(target as (typeof LAYERS)[number]);
            })
            .map((spec) => `${relative(SRC, file)} imports ${spec}`),
        );

        expect(offenders).toEqual([]);
      });

      it('does not use packages it must not know', () => {
        const offenders = files.flatMap((file) =>
          importsOf(file)
            .filter((spec) => FORBIDDEN_PACKAGES[layer].some((pkg) => spec === pkg || spec.startsWith(`${pkg}/`)))
            .map((spec) => `${relative(SRC, file)} imports ${spec}`),
        );

        expect(offenders).toEqual([]);
      });

      it('never touches localStorage', () => {
        const offenders = files.filter((file) => readFileSync(file, 'utf8').includes('localStorage'));

        expect(offenders.map((file) => relative(SRC, file))).toEqual([]);
      });
    });
  });
});
