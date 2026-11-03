import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { InfoIcon } from '../../internal/icons';
import { Message, type MessageSeverity } from './message';

const severities: MessageSeverity[] = ['info', 'success', 'warn', 'error', 'secondary', 'contrast'];

const meta = {
  title: 'Feedback/Message',
  component: Message,
  args: {
    children: 'The exercise opens tomorrow.',
    severity: 'info',
    icon: <InfoIcon />,
    dismissible: false,
    onDismiss: fn(),
  },
  argTypes: {
    icon: { control: false },
    severity: { control: 'select', options: severities },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Inline feedback for the current view. Informational severities are announced politely (`role="status"`), `error` is announced as an alert. A dismissible message does not hide itself: remove it in `onDismiss`.',
      },
    },
  },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Success: Story = {
  args: { icon: undefined, severity: 'success', children: 'Your changes have been saved.' },
};
export const Dismissible: Story = {
  args: {
    icon: undefined,
    severity: 'success',
    children: 'The lecture was created. You can now edit its details.',
    dismissible: true,
  },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Dismiss' }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};
export const Warning: Story = {
  args: { icon: undefined, severity: 'warn', children: 'The submission deadline is approaching.' },
};
export const Error: Story = {
  args: { icon: undefined, severity: 'error', children: 'The submission could not be uploaded.' },
};
export const Secondary: Story = {
  args: { icon: undefined, severity: 'secondary', children: 'No assessment is available yet.' },
};
export const Contrast: Story = {
  args: { icon: undefined, severity: 'contrast', children: 'Maintenance starts at 22:00.' },
};

export const AllSeverities: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12, width: 420 }}>
      {severities.map((severity) => (
        <Message key={severity} {...args} severity={severity} dismissible>
          {`This is a ${severity} message.`}
        </Message>
      ))}
    </div>
  ),
};

export const DismissedByHost: Story = {
  render: (args) => {
    const [visible, setVisible] = useState(true);
    return visible ? (
      <Message {...args} dismissible onDismiss={() => setVisible(false)}>
        Dismiss me.
      </Message>
    ) : (
      <button type="button" onClick={() => setVisible(true)}>
        Show message again
      </button>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};
