import { Application, Container } from 'pixi.js';
import type { Camera } from '../../core/camera';
import type { Scene } from '../../core/scene/types';
import { EdgeLayer } from './EdgeLayer';
import { HereLayer } from './HereLayer';
import { NodeLayer } from './NodeLayer';
import { TextPool } from './TextPool';
import { BOB_MS, easeOut, now, RING_MS } from './timing';

const MAX_FPS = 40;
const MAX_RESOLUTION = 2;
const MAX_DELTA_MS = 100;

/** The only place that talks to Pixi's application. Draws a scene on a canvas inside a host element. */
export class PixiRenderer {
  private app: Application | null = null;
  private destroyed = false;
  private scene: Scene | null = null;
  private camera: Camera = { x: 0, y: 0, zoom: 1 };
  private size = { width: 1, height: 1 };
  private lastTick = now();
  private keepTicking = false;
  private animate = true;

  private readonly world = new Container();
  private readonly texts = new TextPool(() => this.app?.render());
  private readonly edges = new EdgeLayer();
  private readonly nodes = new NodeLayer(this.texts);
  private readonly heres = new HereLayer(this.texts);

  async mount(host: HTMLElement): Promise<void> {
    const app = new Application();
    await app.init({
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(MAX_RESOLUTION, window.devicePixelRatio || 1),
      autoDensity: true,
      autoStart: false,
      preference: 'webgl',
      width: host.clientWidth || 1,
      height: host.clientHeight || 1,
    });
    if (this.destroyed) {
      app.destroy(true, { children: true });
      return;
    }
    this.app = app;
    host.appendChild(app.canvas);
    this.world.addChild(this.edges.lines, this.edges.glow, this.edges.lit, this.nodes.container, this.heres.container);
    app.stage.addChild(this.world);
    app.ticker.maxFPS = MAX_FPS;
    app.ticker.add(() => this.tick());
    this.applyCamera();
    // The size may have changed while Pixi was starting
    this.resize(host.clientWidth || this.size.width, host.clientHeight || this.size.height);
    if (this.scene) this.setScene(this.scene);
  }

  /** Sets the canvas size. A size given before Pixi has started is applied once it has. */
  resize(width: number, height: number): void {
    this.size = { width: Math.max(1, width), height: Math.max(1, height) };
    if (!this.app) return;
    this.app.renderer.resize(this.size.width, this.size.height);
    this.app.render();
  }

  setCamera(camera: Camera): void {
    this.camera = camera;
    if (!this.app) return;
    this.applyCamera();
    this.app.render();
  }

  /** Turns the moving parts on or off: flowing dashes, pulses, the glow's breathing and smooth size changes. */
  setAnimate(animate: boolean): void {
    if (animate === this.animate) return;
    this.animate = animate;
    this.edges.animate = animate;
    this.nodes.animate = animate;
    this.heres.animate = animate;
    if (this.scene) this.setScene(this.scene);
  }

  setScene(scene: Scene): void {
    this.scene = scene;
    if (!this.app) return;
    this.edges.sync(scene.edges);
    this.nodes.sync(scene.nodes);
    this.heres.sync(scene.heres);
    this.keepTicking = this.edges.animated || this.nodes.animated || this.heres.animated;
    this.app.render();
    if (this.keepTicking || this.nodes.moving) this.app.ticker.start();
    else this.app.ticker.stop();
  }

  destroy(): void {
    this.destroyed = true;
    this.texts.destroy();
    if (!this.app) return;
    this.app.ticker.stop();
    this.app.destroy(true, { children: true });
    this.app = null;
  }

  private applyCamera(): void {
    this.world.position.set(this.camera.x, this.camera.y);
    this.world.scale.set(this.camera.zoom);
    this.edges.setZoom(this.camera.zoom);
    this.texts.setZoom(this.camera.zoom);
  }

  private tick(): void {
    const app = this.app;
    if (!app) return;
    const time = now();
    const deltaMs = Math.min(MAX_DELTA_MS, time - this.lastTick);
    this.lastTick = time;

    const ringPhase = easeOut((time % RING_MS) / RING_MS);
    const bob = 0.5 - 0.5 * Math.cos((2 * Math.PI * (time % BOB_MS)) / BOB_MS);
    const drawing = this.edges.tick(time);
    const moving = this.nodes.tick(deltaMs, ringPhase, bob);
    this.heres.tick(ringPhase);

    // Pixi renders after this on the same tick, so there is no render call here
    if (!this.keepTicking && !drawing && !moving) app.ticker.stop();
  }
}
