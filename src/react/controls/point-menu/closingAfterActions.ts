import type { PointMenuProps } from './PointMenu.js';

/** The menu with its actions wrapped so that each one asks the app to close the menu afterwards. */
export function closingAfterActions(menu: PointMenuProps): PointMenuProps {
  const { onClose } = menu;
  if (!onClose || menu.closeAfterAction === false) return menu;
  return {
    ...menu,
    onUpdate: (patch) => {
      menu.onUpdate(patch);
      onClose();
    },
    onAddNext: (input) => {
      const error = menu.onAddNext(input);
      if (error === null) onClose();
      return error;
    },
    onDelete: () => {
      menu.onDelete();
      onClose();
    },
  };
}
