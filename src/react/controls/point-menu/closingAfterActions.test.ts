import { describe, expect, it, vi } from 'vitest';
import { closingAfterActions } from './closingAfterActions.js';
import type { PointMenuProps } from './PointMenu.js';

const setup = (extra: Partial<PointMenuProps> = {}) => {
  const onClose = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const onAddNext = vi.fn<PointMenuProps['onAddNext']>(() => null);
  const menu = {
    point: { id: 'p' },
    path: { id: 'a' },
    onUpdate,
    onAddNext,
    onDelete,
    onPathColor: vi.fn(),
    onClose,
    ...extra,
  } as unknown as PointMenuProps;
  return { menu: closingAfterActions(menu), onClose, onUpdate, onDelete, onAddNext, original: menu };
};

describe('Closing the point menu after an action', () => {
  it('closes after a change and still passes the change on', () => {
    const { menu, onClose, onUpdate } = setup();

    menu.onUpdate({ status: 'done' });

    expect(onUpdate).toHaveBeenCalledWith({ status: 'done' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes after a delete', () => {
    const { menu, onClose, onDelete } = setup();

    menu.onDelete();

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes after a point was added, but stays open when the app reports an error', () => {
    const ok = setup();
    ok.menu.onAddNext({ title: 'x', date: '2026-11-13', newBranch: false });
    expect(ok.onClose).toHaveBeenCalledTimes(1);

    const failing = setup({ onAddNext: () => 'Date is too early.' });
    expect(failing.menu.onAddNext({ title: 'x', date: '2026-01-01', newBranch: false })).toBe('Date is too early.');
    expect(failing.onClose).not.toHaveBeenCalled();
  });

  it('does not close the menu when the path color changes', () => {
    const { menu, onClose } = setup();

    menu.onPathColor('#ff0000');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('leaves the menu open when the app turned closing off', () => {
    const { menu, original, onClose } = setup({ closeAfterAction: false });

    menu.onUpdate({ status: 'done' });

    expect(menu).toBe(original);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('leaves the menu as it is when there is no way to close it', () => {
    const { menu, original } = setup({ onClose: undefined });

    expect(menu).toBe(original);
  });
});
