import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, waitForElementToBeRemoved, within } from 'storybook/test';
import { Button } from '../button';
import { Popover } from './popover';

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  args: {
    'aria-label': 'Exercise actions',
    padding: 'default',
    placement: 'bottom',
    onOpenChange: fn(),
    trigger: <Button>More actions</Button>,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button severity="secondary" variant="outlined">
          Edit
        </Button>
        <Button severity="secondary" variant="outlined">
          Duplicate
        </Button>
        <Button severity="danger" variant="outlined">
          Delete
        </Button>
      </div>
    ),
  },
  argTypes: {
    padding: { control: 'inline-radio', options: ['default', 'none'] },
    placement: {
      control: 'select',
      options: [
        'top',
        'bottom',
        'left',
        'right',
        'top-start',
        'top-end',
        'bottom-start',
        'bottom-end',
        'left-start',
        'left-end',
        'right-start',
        'right-end',
      ],
    },
    trigger: { control: false },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Anchored panel (`role="dialog"`) for rich or interactive content, toggled by its trigger, which gets `aria-haspopup`, `aria-expanded` and `aria-controls`. Focus moves into the panel on open, Tab stays inside while it is open, and Escape, an outside press or the trigger close it and return focus to the trigger. The panel needs an `aria-label`. It opens on the preferred side and flips when there is no room. Use `Tooltip` for a short non-interactive hint and `Menu` for a list of commands. Pass `open`/`onOpenChange` to control it.',
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoPadding: Story = {
  args: {
    'aria-label': 'No-padding popover',
    padding: 'none',
    trigger: <Button>Show No-Padding Popover</Button>,
    children: (
      <div style={{ width: '18rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>Area 1</div>
        <div style={{ borderTop: '1px solid var(--tumaet-ui-border-color)' }} />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>Area 2</div>
      </div>
    ),
  },
};

/** The four sides. Near a viewport edge the panel flips to the opposite side. */
export const Placements: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '6rem 8rem' }}>
      {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
        <Popover
          key={placement}
          {...args}
          placement={placement}
          aria-label={`Details (${placement})`}
          trigger={<Button variant="outlined">{placement}</Button>}
        >
          <p style={{ margin: 0 }}>Opens {placement}.</p>
        </Popover>
      ))}
    </div>
  ),
};

/** Controlled from outside: the panel is open on load. */
export const InitiallyOpen: Story = { args: { defaultOpen: true } };

export const OpensAndTrapsFocus: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'More actions' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);

    const panel = await screen.findByRole('dialog', { name: 'Exercise actions' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toContainElement(document.activeElement as HTMLElement);
    // Waited for: the panel grows into place from transparent, so it is not yet visible on the frame it opens.
    await waitFor(() => expect(within(panel).getByRole('button', { name: 'Delete' })).toBeVisible());
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);

    // Tab wraps inside the panel.
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(panel).toContainElement(document.activeElement as HTMLElement);
  },
};

export const ClosesOnEscape: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'More actions' });
    await userEvent.click(trigger);

    const panel = await screen.findByRole('dialog', { name: 'Exercise actions' });
    const panelRemoved = waitForElementToBeRemoved(panel);
    await userEvent.keyboard('{Escape}');
    await panelRemoved;

    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
  },
};
