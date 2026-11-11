import { buildScene } from '../../core/scene/buildScene.js';
import { turnScene } from '../../core/scene/turn.js';
import type { Scene } from '../../core/scene/types.js';
import type { PathWorldOptions } from '../options.js';
import type { PixiRenderer } from '../render/createPixiRenderer.js';
import type { WorldModel } from '../state/createWorldModel.js';
import type { InteractionState } from './createInteractionState.js';
import type { OrientationState } from './createOrientationState.js';

const EMPTY_SCENE: Scene = { edges: [], nodes: [], heres: [], rings: [], leads: [] };

type Dependencies = {
  model: WorldModel;
  renderer: PixiRenderer;
  interaction: InteractionState;
  orientation: OrientationState;
  options(): PathWorldOptions;
  /** The language for dates, already checked. */
  locale(options: PathWorldOptions): string | undefined;
};

export type SceneHolder = {
  /** The scene that is on the screen now. */
  current(): Scene;
  /** Builds the scene again from the model, the hover state and the direction, and hands it to the renderer. */
  rebuild(): void;
};

/** Keeps the scene on the screen: built from the world, turned for the direction, drawn by the renderer. */
export function createSceneHolder({
  model,
  renderer,
  interaction,
  orientation,
  options,
  locale,
}: Dependencies): SceneHolder {
  let scene: Scene = EMPTY_SCENE;

  return {
    current: () => scene,
    rebuild() {
      const world = model.world();
      const current = options();
      const built = world
        ? buildScene(world, {
            wave: current.wavy === true,
            hovered: interaction.hovered(),
            dragging: interaction.dragging(),
            lineOverrides: interaction.lineHeights(),
            locale: locale(current),
            formatDate: current.formatDate,
          })
        : EMPTY_SCENE;
      scene = orientation.direction() === 'horizontal' ? built : turnScene(built, orientation.toScreen);
      renderer.setScene(scene);
    },
  };
}
