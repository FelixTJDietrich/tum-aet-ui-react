import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { EllipsisIcon } from '../../internal/icons';
import { Button } from '../button';
import { Menu, MenuItem } from './menu';

const meta = {
  title: 'Navigation/Menu',
  component: Menu,
  args: {
    trigger: <Button>Course actions</Button>,
    placement: 'bottom-start',
    children: (
      <>
        <MenuItem>Add students</MenuItem>
        <MenuItem>Add tutors</MenuItem>
        <MenuItem disabled>Add editors</MenuItem>
        <MenuItem href="https://docs.artemis.cit.tum.de" target="_blank" rel="noreferrer">
          Open documentation
        </MenuItem>
      </>
    ),
  },
  argTypes: {
    trigger: { control: false },
    children: { control: false },
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end', 'left', 'right'],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Menu button pattern: the trigger opens a `role="menu"` of `MenuItem` entries, buttons for actions or links (`href`) for navigation. Arrow keys, Home and End move focus (wrapping), typing jumps to an entry (a space continues the search), Enter or Space chooses, Escape closes and returns focus to the trigger, and so do choosing an entry, Tab, or moving focus elsewhere. ArrowDown/ArrowUp on the trigger open it on the first/last entry. A disabled entry stays focusable, so it is found with the arrow keys and announced as unavailable, but never runs. Use `Popover` for rich or non-action content.',
      },
    },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Opening the menu moves focus onto the first entry, so it can be driven from the keyboard alone. */
export const Opened: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Course actions' }));

    const menu = within(document.body).getByRole('menu');
    await expect(menu).toBeInTheDocument();
    await expect(within(menu).getByRole('menuitem', { name: 'Add students' })).toHaveFocus();
  },
};

/** An icon-only trigger opening to the end edge. */
export const EndAligned: Story = {
  args: {
    placement: 'bottom-end',
    'aria-label': 'More actions',
    trigger: <Button variant="text" rounded aria-label="More actions" icon={<EllipsisIcon />} />,
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
};

/** A disabled trigger can neither be focused nor opened. */
export const DisabledTrigger: Story = {
  args: { trigger: <Button disabled>Course actions</Button> },
};

/**
 * The arrow keys move through every entry, including a disabled one, which is announced as unavailable, and Escape
 * returns focus to the trigger.
 */
export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Course actions' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');

    const menu = within(document.body).getByRole('menu');
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Add students' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    const disabled = within(menu).getByRole('menuitem', { name: 'Add editors' });
    await expect(disabled).toHaveFocus();
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');

    await userEvent.keyboard('{End}');
    await expect(within(menu).getByRole('menuitem', { name: 'Open documentation' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Typing moves to the entry whose label starts with the typed text, a space continues the search. */
export const Typeahead: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Course actions' }));
    await userEvent.keyboard('add t');
    await expect(screen.getByRole('menuitem', { name: 'Add tutors' })).toHaveFocus();
    await expect(screen.getByRole('menu')).toBeInTheDocument();
  },
};

/**
 * A menu followed by another control. A click outside closes the menu, and Tab closes it and moves on from the trigger
 * to the next control, as for a native select. Both need real pointer and key events (synthetic ones do not move
 * focus the way the browser does), so this story is for trying it by hand.
 */
export const Dismissal: Story = {
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Story />
        <Button variant="outlined">Next control</Button>
      </div>
    ),
  ],
  args: {
    children: (
      <>
        <MenuItem>Add students</MenuItem>
        <MenuItem>Add tutors</MenuItem>
      </>
    ),
  },
};
