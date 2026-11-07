import { Application, Container } from 'pixi.js';
import type { Camera } from '../../core/camera';
import type { Scene } from '../../core/scene/types';
import { createEdgeLayer } from './createEdgeLayer';
import { createHereLayer } from './createHereLayer';
import { createNodeLayer } from './createNodeLayer';
import { createRingLayer } from './createRingLayer';
import { createTextPool } from './createTextPool';
import { BOB_MS, easeOut, now, RING_MS } from './timing';

const MAX_FPS = 40;
const MAX_RESOLUTION = 2;
const MAX_DELTA_MS = 100;

export type PixiRenderer = {
  /** Starts Pixi on a host element. Rejects when the graphics cannot be started. */
  mount(host: HTMLElement): Promise<void>;
  /** Sets the canvas size. A size given before Pixi has started is applied once it has. */
  resize(width: number, height: number): void;
  setCamera(camera: Camera): void;
  /** Turns the moving parts on or off: flowing dashes, pulses, the glow's breathing and smooth size changes. */
  setAnimate(animate: boolean): void;
  setScene(scene: Scene): void;
  destroy(): void;
};

/** The only place that talks to Pixi's application. Draws a scene on a canvas inside a host element. */
export function createPixiRenderer(): PixiRenderer {
  let app: Application | null = null;
  let destroyed = false;
  let scene: Scene | null = null;
  let camera: Camera = { x: 0, y: 0, zoom: 1 };
  let size = { width: 1, height: 1 };
  let lastTick = now();
  let keepTicking = false;
  let animate = true;

  const world = new Container();
  const texts = createTextPool(() => app?.render());
  const edges = createEdgeLayer();
  const nodes = createNodeLayer(texts);
  const heres = createHereLayer(texts);
  const rings = createRingLayer();

  const applyCamera = () => {
    world.position.set(camera.x, camera.y);
    world.scale.set(camera.zoom);
    edges.setZoom(camera.zoom);
    texts.setZoom(camera.zoom);
  };

  const tick = () => {
    if (!app) return;
    const time = now();
    const deltaMs = Math.min(MAX_DELTA_MS, time - lastTick);
    lastTick = time;

    const ringPhase = easeOut((time % RING_MS) / RING_MS);
    const bob = 0.5 - 0.5 * Math.cos((2 * Math.PI * (time % BOB_MS)) / BOB_MS);
    const drawing = edges.tick(time);
    const moving = nodes.tick(deltaMs, ringPhase, bob);
    const gliding = heres.tick(ringPhase, deltaMs);

    // Pixi renders after this on the same tick, so there is no render call here
    if (!keepTicking && !drawing && !moving && !gliding) app.ticker.stop();
  };

  const resize = (width: number, height: number) => {
    size = { width: Math.max(1, width), height: Math.max(1, height) };
    if (!app) return;
    app.renderer.resize(size.width, size.height);
    app.render();
  };

  const setScene = (next: Scene) => {
    scene = next;
    if (!app) return;
    edges.sync(next.edges);
    nodes.sync(next.nodes);
    heres.sync(next.heres);
    rings.sync(next.rings);
    keepTicking = edges.isAnimated() || nodes.isAnimated() || heres.isAnimated();
    app.render();
    if (keepTicking || nodes.isMoving() || heres.isMoving()) app.ticker.start();
    else app.ticker.stop();
  };

  return {
    async mount(host) {
      const created = new Application();
      await created.init({
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(MAX_RESOLUTION, window.devicePixelRatio || 1),
        autoDensity: true,
        autoStart: false,
        preference: 'webgl',
        width: host.clientWidth || 1,
        height: host.clientHeight || 1,
      });
      if (destroyed) {
        created.destroy(true, { children: true });
        return;
      }
      app = created;
      host.appendChild(created.canvas);
      world.addChild(edges.lines, edges.glow, edges.lit, rings.container, nodes.container, heres.container);
      created.stage.addChild(world);
      created.ticker.maxFPS = MAX_FPS;
      created.ticker.add(tick);
      applyCamera();
      // The size may have changed while Pixi was starting
      resize(host.clientWidth || size.width, host.clientHeight || size.height);
      if (scene) setScene(scene);
    },

    resize,

    setCamera(next) {
      camera = next;
      if (!app) return;
      applyCamera();
      app.render();
    },

    setAnimate(on) {
      if (on === animate) return;
      animate = on;
      edges.setAnimate(on);
      nodes.setAnimate(on);
      heres.setAnimate(on);
      if (scene) setScene(scene);
    },

    setScene,

    destroy() {
      destroyed = true;
      texts.destroy();
      if (!app) return;
      app.ticker.stop();
      app.destroy(true, { children: true });
      app = null;
    },
  };
}
