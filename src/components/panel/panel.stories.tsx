import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Panel } from './panel';

const meta = {
  title: 'Data Display/Panel',
  component: Panel,
  args: {
    header: 'Exercise details',
    children: <p style={{ margin: 0 }}>Review the problem statement, due date, and grading criteria.</p>,
    toggleable: false,
  },
  argTypes: { children: { control: false }, footer: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(28rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A bordered container with a header. When `toggleable`, the header gets a toggle button that follows the disclosure pattern (`aria-expanded`, `aria-controls`); collapsed content is inert and hidden from assistive technology. The collapsed state can be controlled (`collapsed` and `onCollapsedChange`) or uncontrolled (`defaultCollapsed`).',
      },
    },
  },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Toggleable: Story = {
  args: { toggleable: true },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('button', { name: 'Exercise details' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  },
};

export const Collapsed: Story = { args: { toggleable: true, defaultCollapsed: true } };

export const WithFooter: Story = {
  args: { toggleable: true, footer: <p style={{ margin: 0, padding: '0 1.125rem 1.125rem' }}>Footer</p> },
};

export const WithoutHeader: Story = { args: { header: undefined, toggleable: true } };

export const CustomToggleLabel: Story = {
  args: {
    header: <span>Quiz exercises (2)</span>,
    toggleable: true,
    toggleLabel: 'Quiz exercises',
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [collapsed, setCollapsed] = useState(true);
    return <Panel {...args} toggleable collapsed={collapsed} onCollapsedChange={setCollapsed} />;
  },
};
