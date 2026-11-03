import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitForElementToBeRemoved } from 'storybook/test';
import { Button } from '../button';
import { Tooltip } from './tooltip';

const TEXT = 'Downloads the current result as a CSV file';

const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  args: {
    content: TEXT,
    placement: 'top',
    showDelay: 150,
    hideDelay: 100,
    describesHost: true,
    children: <Button>Export</Button>,
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    content: { control: 'text' },
    children: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '4rem 8rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Short, non-interactive hint shown on hover and keyboard focus of its single child and linked to it through `aria-describedby` while open. Escape dismisses it without moving focus, pressing the child hides it, and touch never shows it. The bubble stays open while the pointer travels onto it. `content` is a string, a list of strings (rendered as bullets) or any non-interactive node; nothing is shown when it is empty. Set `describesHost={false}` when the host is already described by permanent text. The child must accept a ref and DOM event props.',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  tags: ['!autodocs'],
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Export' });
    await userEvent.tab();

    const tooltip = await screen.findByRole('tooltip', { name: TEXT });
    await expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
  },
};

export const Placements: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div style={{ display: 'flex', gap: '8rem', padding: '4rem 10rem' }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((placement) => (
        <Tooltip key={placement} {...args} placement={placement} content={`Placed ${placement}`}>
          <Button variant="outlined">{placement}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

/** Several items render as a bulleted list in a wider bubble. */
export const List: Story = {
  args: {
    content: ['Needs at least one submission', 'Is not yet graded', 'Due date has passed'],
    children: <Button variant="outlined">Why disabled?</Button>,
  },
};

/** Any non-interactive node works; the bubble stays as wide as the list form. */
export const RichContent: Story = {
  args: {
    content: (
      <>
        <strong>Grading guidance</strong>
        <div>5 points</div>
      </>
    ),
    children: <Button variant="outlined">Help</Button>,
  },
};

/** A host that is described by permanent markup does not get announced twice. */
export const DoesNotDescribeHost: Story = {
  args: { describesHost: false },
};

export const DismissesWithEscape: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const tooltip = await screen.findByRole('tooltip', { name: TEXT });
    const tooltipRemoved = waitForElementToBeRemoved(tooltip);
    await userEvent.keyboard('{Escape}');
    await tooltipRemoved;
    await expect(canvas.getByRole('button', { name: 'Export' })).toHaveFocus();
  },
};

export const Hoverable: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Export' });
    await userEvent.hover(trigger);
    const tooltip = await screen.findByRole('tooltip', { name: TEXT });

    const bounds = tooltip.getBoundingClientRect();
    await userEvent.unhover(trigger);
    // The hint is transparent to pointer events, so the underlying document receives movement over its bounds.
    await userEvent.pointer({
      target: tooltip.ownerDocument.body,
      coords: { clientX: bounds.left + bounds.width / 2, clientY: bounds.top + bounds.height / 2 },
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(tooltip).toBeVisible();

    const tooltipRemoved = waitForElementToBeRemoved(tooltip);
    await userEvent.keyboard('{Escape}');
    await tooltipRemoved;
  },
};
