import type { Bounds } from '../core/camera';
import { layoutOf, nearestFree } from '../core/collision';
import { contentBounds } from '../core/geometry';
import { dateAtX } from '../core/layout';
import { buildScene } from '../core/scene/buildScene';
import { hitNode } from '../core/scene/hit';
import type { Scene } from '../core/scene/types';
import type { Position } from '../core/types';
import { createCameraController } from './camera/createCameraController';
import { createViewport } from './dom/createViewport';
import { createBoundaryChecks } from './engine/boundary';
import { prefersReducedMotion, sameBackground } from './engine/environment';
import { buildMoveEvent, rounded } from './engine/events';
import { shortcutFor } from './engine/shortcuts';
import { createPointDragger } from './interaction/createPointDragger';
import { createPointerController } from './interaction/createPointerController';
import type { PathWorldHandle, PathWorldOptions } from './options';
import { createPixiRenderer } from './render/createPixiRenderer';
import { createWorldModel } from './state/createWorldModel';

const DEFAULT_SEED = 1;
const EMPTY_SCENE: Scene = { edges: [], nodes: [], heres: [], rings: [] };
const ERROR_PREFIX = 'World of Evolving Paths:';

type Framing = 'fit' | 'center' | null;

/**
 * Mounts the map on an element. Works with any framework, or none.
 * The element needs a size. Call `handle.update(options)` whenever your data or options change,
 * and `handle.destroy()` when you remove the element.
 *
 * The map draws what the options say and reports what the user does through the option callbacks.
 */
export function createPathWorld(container: HTMLElement, initialOptions: PathWorldOptions): PathWorldHandle {
  let options = initialOptions;
  let scene: Scene = EMPTY_SCENE;
  let hovered: string | null = null;
  let dragging: string | null = null;
  let framing: Framing = null;
  let framedOnce = false;
  let worldVersion = 0;
  let destroyed = false;
  const worldListeners = new Set<() => void>();

  const viewport = createViewport(container);
  const camera = createCameraController(() => viewport.size());
  const renderer = createPixiRenderer();

  const reportError = (errors: string[]) => {
    if (options.onError) options.onError(errors);
    else console.error(`${ERROR_PREFIX}\n${errors.join('\n')}`);
  };
  const boundary = createBoundaryChecks(reportError);
  const model = createWorldModel(reportError);
  let background = boundary.backgroundOf(initialOptions);

  const bounds = (): Bounds | null => contentBounds(model.world()?.points ?? []);

  const notifyWorld = () => {
    worldVersion += 1;
    worldListeners.forEach((listener) => {
      listener();
    });
  };

  const rebuildScene = () => {
    const world = model.world();
    scene = world
      ? buildScene(world, {
          wave: options.wavy === true,
          hovered,
          dragging,
          locale: boundary.localeOf(options),
          formatDate: options.formatDate,
        })
      : EMPTY_SCENE;
    renderer.setScene(scene);
  };

  /** Fits or centers once there is content and room, then not again until the view changes. */
  const applyFraming = () => {
    const content = bounds();
    const { width, height } = viewport.size();
    if (!framing || !content || width <= 1 || height <= 1) return;
    if (framing === 'fit') camera.fit(content);
    else camera.center(content);
    framing = null;
    framedOnce = true;
  };

  const dragger = createPointDragger({
    model,
    onChange: () => {
      rebuildScene();
      notifyWorld();
    },
    onMoved: (id, position) => {
      options.onPointMove?.(buildMoveEvent(model.world()?.points ?? [], id, position));
    },
  });

  const canDrag = () => options.editable !== false && options.pointsLocked !== true;

  const pointer = createPointerController(
    viewport.root,
    camera,
    {
      pointAt: (world) => hitNode(scene.nodes, world)?.id ?? null,
      onHover(id) {
        if (id === hovered) return;
        hovered = id;
        viewport.setCursor(id ? 'pointer' : 'grab');
        rebuildScene();
      },
      onPointPress(id) {
        options.onSelect?.(id);
        if (!canDrag()) return false;
        dragger.start(id);
        dragging = id;
        rebuildScene();
        return true;
      },
      onDragMove: (id, position) => dragger.move(id, position),
      onDragEnd(id) {
        dragging = null;
        dragger.end(id);
        rebuildScene();
      },
      onBackgroundClick: () => options.onSelect?.(null),
      onBackgroundDoubleClick(at: Position) {
        if (options.editable === false) return;
        const points = model.world()?.points ?? [];
        const free = rounded(nearestFree(layoutOf(points), { id: '', kind: 'start' }, at));
        const date = dateAtX(free.x, model.periodData(), options.view, boundary.todayOf(options));
        options.onPointAdd?.({ ...free, date });
      },
    },
    (id) => model.positionOf(id),
  );

  const unsubscribeCamera = camera.subscribe((next) => {
    renderer.setCamera(next);
    viewport.render(next, background ?? {});
  });

  const resizeObserver = new ResizeObserver(() => {
    const { width, height } = viewport.size();
    renderer.resize(width, height);
    applyFraming();
  });
  resizeObserver.observe(viewport.root);

  // The keys belong to this map only while the pointer is over it or the focus is inside it
  let pointerInside = false;
  const onEnter = () => {
    pointerInside = true;
  };
  const onLeave = () => {
    pointerInside = false;
  };
  viewport.root.addEventListener('pointerenter', onEnter);
  viewport.root.addEventListener('pointerleave', onLeave);
  const isActive = () => pointerInside || viewport.root.contains(document.activeElement);

  const onKey = (event: KeyboardEvent) => {
    const shortcut = shortcutFor(event, options.shortcuts !== false && isActive());
    const content = bounds();
    if (!shortcut || !content) return;
    if (shortcut === 'center') camera.center(content);
    else camera.fit(content);
  };

  const update = (next: PathWorldOptions) => {
    const previous = options;
    options = next;
    const { changed, viewChanged, dataChanged } = model.configure({
      periods: next.periods,
      view: next.view,
      seed: next.seed ?? DEFAULT_SEED,
      today: boundary.todayOf(next),
    });
    renderer.setAnimate(next.animate ?? !prefersReducedMotion());
    if (viewChanged) {
      framing = framedOnce ? 'center' : 'fit';
      hovered = null;
      dragging = null;
      dragger.cancel();
      pointer.cancel();
    } else if (dataChanged) {
      dragger.acknowledge();
    }
    const lookChanged =
      (previous.wavy === true) !== (next.wavy === true) ||
      previous.locale !== next.locale ||
      previous.formatDate !== next.formatDate;
    if (changed || lookChanged) rebuildScene();
    if (changed) notifyWorld();
    if (!sameBackground(previous.background, next.background)) {
      background = boundary.backgroundOf(next);
      viewport.render(camera.get(), background ?? {});
    }
    applyFraming();
  };

  renderer.mount(viewport.host).catch((error: unknown) => {
    reportError([`The graphics could not be started: ${error instanceof Error ? error.message : String(error)}`]);
  });
  viewport.render(camera.get(), background ?? {});
  update(initialOptions);
  window.addEventListener('keydown', onKey);

  return {
    overlay: viewport.overlay,
    update,
    positionOf(id) {
      const point = model.world()?.points.find((candidate) => candidate.id === id);
      return point ? { x: point.x, y: point.y } : null;
    },
    zoomBy: (factor) => camera.zoomBy(factor),
    fit() {
      const content = bounds();
      if (content) camera.fit(content);
    },
    center() {
      const content = bounds();
      if (content) camera.center(content);
    },
    getCamera: () => camera.get(),
    subscribeCamera: (listener) => camera.subscribe(listener),
    subscribeWorld(listener) {
      worldListeners.add(listener);
      return () => worldListeners.delete(listener);
    },
    getWorldVersion: () => worldVersion,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window.removeEventListener('keydown', onKey);
      viewport.root.removeEventListener('pointerenter', onEnter);
      viewport.root.removeEventListener('pointerleave', onLeave);
      resizeObserver.disconnect();
      unsubscribeCamera();
      pointer.destroy();
      dragger.cancel();
      renderer.destroy();
      viewport.destroy();
    },
  };
}
