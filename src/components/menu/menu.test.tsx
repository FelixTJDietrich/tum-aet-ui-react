import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { Button } from '../button';
import { Menu, MenuItem } from './menu';

function Host({ onArchive = vi.fn(), onRename = vi.fn() }: { onArchive?: () => void; onRename?: () => void }) {
  return (
    <>
      <Menu trigger={<Button>Actions</Button>}>
        <MenuItem onClick={onRename}>Rename</MenuItem>
        <MenuItem href="https://example.com/docs" onClick={(e) => e.preventDefault()}>
          Docs
        </MenuItem>
        <MenuItem disabled onClick={onArchive}>
          Archive
        </MenuItem>
        <MenuItem>Delete</MenuItem>
      </Menu>
      <button>Outside</button>
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Actions' });
const items = () => screen.getAllByRole('menuitem');
const names = () => items().map((i) => i.textContent);

describe('Menu', () => {
  it('is a closed menu button until opened, then links trigger and menu', async () => {
    render(<Host />);
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).toBeNull();
    await userEvent.click(trigger());
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-controls', menu.id);
    expect(names()).toEqual(['Rename', 'Docs', 'Archive', 'Delete']);
  });

  it('renders action items as buttons and link items as anchors', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    expect(items()[0]!.tagName).toBe('BUTTON');
    expect(items()[1]).toHaveAttribute('href', 'https://example.com/docs');
    expect(items()[1]!.tagName).toBe('A');
  });

  it('focuses the first item on open and wraps with ArrowDown and ArrowUp', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    expect(items()[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(items()[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(items()[3]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(items()[0]).toHaveFocus();
  });

  it('opens with ArrowDown on the trigger (first item) and ArrowUp (last item)', async () => {
    render(<Host />);
    trigger().focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(items()[0]).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{ArrowUp}');
    expect(items()[3]).toHaveFocus();
  });

  it('opens with Enter and Space on the trigger', async () => {
    render(<Host />);
    trigger().focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard(' ');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('jumps with Home and End', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    await userEvent.keyboard('{End}');
    expect(items()[3]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(items()[0]).toHaveFocus();
  });

  it('moves to the item that starts with the typed characters', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    await userEvent.keyboard('d');
    expect(items()[1]).toHaveFocus();
    await userEvent.keyboard('d');
    expect(items()[3]).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('closes on Tab and continues from the trigger', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    await userEvent.tab();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
  });

  it('closes when focus moves elsewhere', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    act(() => screen.getByRole('button', { name: 'Outside' }).focus());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('runs an item on click and on Enter, closes and focuses the trigger', async () => {
    const onRename = vi.fn();
    render(<Host onRename={onRename} />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    expect(onRename).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger()).toHaveFocus();
    await userEvent.click(trigger());
    await userEvent.keyboard('{Enter}');
    expect(onRename).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('keeps a disabled item focusable but never runs it or closes the menu', async () => {
    const onArchive = vi.fn();
    render(<Host onArchive={onArchive} />);
    await userEvent.click(trigger());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    const archive = screen.getByRole('menuitem', { name: 'Archive' });
    expect(archive).toHaveFocus();
    expect(archive).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{Enter}');
    expect(onArchive).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('toggles closed when the trigger is clicked again', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    await userEvent.click(trigger());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('lets Escape on a closed trigger reach enclosing handlers', async () => {
    const onKeyDown = vi.fn();
    render(
      <div onKeyDown={onKeyDown}>
        <Host />
      </div>,
    );
    trigger().focus();
    await userEvent.keyboard('{Escape}');
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    // The menu is portaled to the body, outside any landmark, so the page-level `region` rule does not apply.
    const results = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
