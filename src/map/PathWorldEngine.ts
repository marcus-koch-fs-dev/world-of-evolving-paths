import type { Bounds, Camera } from '../core/camera';
import { layoutOf, nearestFree } from '../core/collision';
import { todayLocal } from '../core/dates';
import { contentBounds } from '../core/geometry';
import { dateAtX } from '../core/layout';
import { buildScene } from '../core/scene/buildScene';
import { hitNode } from '../core/scene/hit';
import type { Scene } from '../core/scene/types';
import type { Position } from '../core/types';
import { CameraController } from './camera/CameraController';
import { Viewport } from './dom/Viewport';
import { PointDragger } from './interaction/PointDragger';
import { PointerController } from './interaction/PointerController';
import type { CameraListener, PathWorldHandle, PathWorldOptions } from './options';
import { PixiRenderer } from './render/PixiRenderer';
import { WorldModel } from './state/WorldModel';

const DEFAULT_SEED = 1;
const EMPTY_SCENE: Scene = { edges: [], nodes: [], heres: [] };
const TEXT_INPUT = 'input, textarea, select';
const ERROR_PREFIX = 'World of Evolving Paths:';

type Framing = 'fit' | 'center' | null;

const rounded = (position: Position): Position => ({ x: Math.round(position.x), y: Math.round(position.y) });

/**
 * Wires the map together: world model, renderer, camera and pointer handling.
 * It draws what the options say and reports what the user does through the option callbacks.
 */
export class PathWorldEngine implements PathWorldHandle {
  private readonly viewport: Viewport;
  private readonly renderer = new PixiRenderer();
  private readonly camera: CameraController;
  private readonly model: WorldModel;
  private readonly dragger: PointDragger;
  private readonly pointer: PointerController;
  private readonly resizeObserver: ResizeObserver;
  private scene: Scene = EMPTY_SCENE;
  private hovered: string | null = null;
  private dragging: string | null = null;
  private framing: Framing = null;
  private framedOnce = false;

  constructor(
    container: HTMLElement,
    private options: PathWorldOptions,
  ) {
    this.viewport = new Viewport(container);
    this.camera = new CameraController(() => this.viewport.size());
    this.model = new WorldModel((errors) => this.reportError(errors));
    this.dragger = new PointDragger({
      model: this.model,
      onChange: () => this.rebuildScene(),
      onMoved: (id, position) => this.emitMoved(id, position),
    });
    this.pointer = new PointerController(
      this.viewport.root,
      this.camera,
      {
        pointAt: (world) => hitNode(this.scene.nodes, world)?.id ?? null,
        onHover: (id) => this.hover(id),
        onPointPress: (id) => this.pressPoint(id),
        onDragMove: (id, position) => this.dragger.move(id, position),
        onDragEnd: (id) => this.releasePoint(id),
        onBackgroundClick: () => this.options.onSelect?.(null),
        onBackgroundDoubleClick: (world) => this.addPointAt(world),
      },
      (id) => this.model.positionOf(id),
    );
    this.camera.subscribe((camera) => this.onCamera(camera));
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.viewport.root);
    window.addEventListener('keydown', this.onKey);
    void this.renderer.mount(this.viewport.host);
    this.update(options);
  }

  get overlay(): HTMLElement {
    return this.viewport.overlay;
  }

  update(options: PathWorldOptions): void {
    this.options = options;
    const { viewChanged } = this.model.configure({
      periods: options.periods,
      view: options.view,
      seed: options.seed ?? DEFAULT_SEED,
      today: options.today ?? todayLocal(),
    });
    if (viewChanged) this.framing = this.framedOnce ? 'center' : 'fit';
    this.rebuildScene();
    this.viewport.render(this.camera.get(), options.background ?? {});
    this.applyFraming();
  }

  zoomBy(factor: number): void {
    this.camera.zoomBy(factor);
  }

  fit(): void {
    const bounds = this.bounds();
    if (bounds) this.camera.fit(bounds);
  }

  center(): void {
    const bounds = this.bounds();
    if (bounds) this.camera.center(bounds);
  }

  getCamera(): Camera {
    return this.camera.get();
  }

  subscribeCamera(listener: CameraListener): () => void {
    return this.camera.subscribe(listener);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKey);
    this.resizeObserver.disconnect();
    this.pointer.destroy();
    this.dragger.cancel();
    this.renderer.destroy();
    this.viewport.destroy();
  }

  private bounds(): Bounds | null {
    return contentBounds(this.model.world()?.points ?? []);
  }

  /** Fits or centers once there is content and room, then not again until the view changes. */
  private applyFraming(): void {
    const bounds = this.bounds();
    const { width, height } = this.viewport.size();
    if (!this.framing || !bounds || width <= 1 || height <= 1) return;
    if (this.framing === 'fit') this.camera.fit(bounds);
    else this.camera.center(bounds);
    this.framing = null;
    this.framedOnce = true;
  }

  private rebuildScene(): void {
    const world = this.model.world();
    this.scene = world
      ? buildScene(world, { wave: this.options.wavy === true, hovered: this.hovered, dragging: this.dragging })
      : EMPTY_SCENE;
    this.renderer.setScene(this.scene);
  }

  private onCamera(camera: Camera): void {
    this.renderer.setCamera(camera);
    this.viewport.render(camera, this.options.background ?? {});
  }

  private onResize(): void {
    const { width, height } = this.viewport.size();
    this.renderer.resize(width, height);
    this.applyFraming();
  }

  private canDrag(): boolean {
    return this.options.editable !== false && this.options.dotsLocked !== true;
  }

  private hover(id: string | null): void {
    if (id === this.hovered) return;
    this.hovered = id;
    this.viewport.setCursor(id ? 'pointer' : 'grab');
    this.rebuildScene();
  }

  private pressPoint(id: string): boolean {
    this.options.onSelect?.(id);
    if (!this.canDrag()) return false;
    this.dragger.start(id);
    this.dragging = id;
    this.rebuildScene();
    return true;
  }

  private releasePoint(id: string): void {
    this.dragging = null;
    this.dragger.end(id);
  }

  private addPointAt(at: Position): void {
    if (this.options.editable === false) return;
    const today = this.options.today ?? todayLocal();
    const points = this.model.world()?.points ?? [];
    const free = rounded(nearestFree(layoutOf(points), { id: '', kind: 'start' }, at));
    const data = this.model.periodData();
    const date = data ? dateAtX(free.x, data, this.options.view, today) : today;
    this.options.onPointAdd?.({ ...free, date });
  }

  private emitMoved(id: string, position: Position): void {
    const points = this.model.world()?.points ?? [];
    const positions = Object.fromEntries(points.map((point) => [point.id, rounded(point)]));
    const final = rounded(position);
    positions[id] = final;
    this.options.onPointMove?.({ id, ...final, positions });
  }

  private reportError(errors: string[]): void {
    if (this.options.onError) this.options.onError(errors);
    else console.error(`${ERROR_PREFIX}\n${errors.join('\n')}`);
  }

  private readonly onKey = (event: KeyboardEvent) => {
    if (this.options.shortcuts === false || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest(TEXT_INPUT)) return;
    if (event.key === 'm' || event.key === 'M') this.center();
    else if (event.key === 'e' || event.key === 'E') this.fit();
  };
}
