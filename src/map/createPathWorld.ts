import type { Bounds } from '../core/camera.js';
import { contentBounds } from '../core/geometry.js';
import { createCameraController } from './camera/createCameraController.js';
import { createViewport } from './dom/createViewport.js';
import { createBoundaryChecks } from './engine/boundary.js';
import { lookChanged } from './engine/changes.js';
import { createFraming } from './engine/createFraming.js';
import { createHandle } from './engine/createHandle.js';
import { createInteractionState } from './engine/createInteractionState.js';
import { createKeyboard } from './engine/createKeyboard.js';
import { createOrientationState } from './engine/createOrientationState.js';
import { createPointerHooks } from './engine/createPointerHooks.js';
import { createSceneHolder } from './engine/createSceneHolder.js';
import { createStoreEdits } from './engine/createStoreEdits.js';
import { createWorldSignal } from './engine/createWorldSignal.js';
import { prefersReducedMotion, sameBackground } from './engine/environment.js';
import type { Shortcut } from './engine/shortcuts.js';
import { createPointDragger } from './interaction/createPointDragger.js';
import { createPointerController } from './interaction/createPointerController.js';
import type { PathWorldHandle, PathWorldOptions } from './options.js';
import { createPixiRenderer } from './render/createPixiRenderer.js';
import { createWorldModel } from './state/createWorldModel.js';

const ERROR_PREFIX = 'World of Evolving Paths:';

/**
 * Mounts the map on an element. Works with any framework, or none.
 * The element needs a size. Call `handle.update(options)` whenever your data or options change,
 * and `handle.destroy()` when you remove the element.
 *
 * The map draws what the options say and reports what the user does through the option callbacks.
 * This function only wires the parts together; each part does one job.
 */
export function createPathWorld(container: HTMLElement, initialOptions: PathWorldOptions): PathWorldHandle {
  let options = initialOptions;
  let destroyed = false;

  const viewport = createViewport(container);
  const camera = createCameraController(() => viewport.size());
  const renderer = createPixiRenderer();
  const reportError = (errors: string[]) => {
    if (options.onError) options.onError(errors);
    else console.error(`${ERROR_PREFIX}\n${errors.join('\n')}`);
  };
  const boundary = createBoundaryChecks(reportError);
  const model = createWorldModel(reportError);
  const orientation = createOrientationState();
  const framing = createFraming();
  const interaction = createInteractionState();
  const signal = createWorldSignal();
  let background = boundary.backgroundOf(initialOptions);

  // The content is the points, the arrows at the borders of the view, and the lines across the view without a point
  const bounds = (): Bounds | null => {
    const world = model.world();
    if (!world) return null;
    const arrows = world.arrows.map(({ x, y }) => ({ x, y }));
    const spans = world.spans.flatMap((span) => [span.before, span.after]);
    return contentBounds([...world.points, ...arrows, ...spans].map(orientation.toScreen));
  };
  const frame = () => framing.apply(bounds(), viewport.size(), camera);
  const show = (kind: Shortcut) => {
    const content = bounds();
    if (!content) return;
    if (kind === 'center') camera.center(content);
    else camera.fit(content);
  };

  const scene = createSceneHolder({
    model,
    renderer,
    interaction,
    orientation,
    options: () => options,
    locale: boundary.localeOf,
  });

  const edits = createStoreEdits({ options: () => options, model });

  const dragger = createPointDragger({
    model,
    onChange: () => {
      scene.rebuild();
      signal.notify();
    },
    onMoved: edits.movePoint,
  });

  const pointer = createPointerController(
    viewport.root,
    camera,
    createPointerHooks({
      options: () => options,
      model,
      scene,
      interaction,
      dragger,
      edits,
      viewport,
      toLayout: orientation.toLayout,
      zoom: () => camera.get().zoom,
      today: boundary.todayOf,
    }),
    (id) => orientation.toScreen(model.positionOf(id)),
  );

  const keyboard = createKeyboard({
    root: viewport.root,
    enabled: () => options.shortcuts !== false,
    onShortcut: show,
  });

  const unsubscribeCamera = camera.subscribe((next) => {
    renderer.setCamera(next);
    viewport.render(next, background ?? {});
  });

  const syncOrientation = () => orientation.sync(options.orientation, viewport.size());

  const resizeObserver = new ResizeObserver(() => {
    const { width, height } = viewport.size();
    renderer.resize(width, height);
    if (syncOrientation()) {
      framing.requestFit();
      scene.rebuild();
      signal.notify();
    }
    frame();
  });
  resizeObserver.observe(viewport.root);

  const update = (next: PathWorldOptions) => {
    const previous = options;
    options = next;
    const { changed, viewChanged, dataChanged } = model.configure({
      store: next.store,
      view: next.view,
      pathIds: next.pathIds,
      today: boundary.todayOf(next),
    });
    renderer.setAnimate(next.animate ?? !prefersReducedMotion());
    const orientationChanged = syncOrientation();
    if (viewChanged) {
      framing.requestForView(next.zoom);
      interaction.clear();
      dragger.cancel();
      pointer.cancel();
    } else if (dataChanged) {
      dragger.acknowledge();
      // The data now holds the heights the user dragged the lines to
      interaction.dropLines();
    }
    // A new direction needs the whole content in view again, also when the view changed at the same time
    if (orientationChanged) framing.requestFit();
    if (changed || orientationChanged || lookChanged(previous, next)) scene.rebuild();
    if (changed || orientationChanged) signal.notify();
    if (!sameBackground(previous.background, next.background)) {
      background = boundary.backgroundOf(next);
      viewport.render(camera.get(), background ?? {});
    }
    frame();
  };

  renderer.mount(viewport.host).catch((error: unknown) => {
    reportError([`The graphics could not be started: ${error instanceof Error ? error.message : String(error)}`]);
  });
  viewport.render(camera.get(), background ?? {});
  update(initialOptions);

  return createHandle({
    viewport,
    camera,
    model,
    orientation,
    signal,
    show,
    update,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      keyboard.destroy();
      resizeObserver.disconnect();
      unsubscribeCamera();
      pointer.destroy();
      dragger.cancel();
      renderer.destroy();
      viewport.destroy();
    },
  });
}
