import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Chip } from './chip';

const meta = {
  title: 'Data Display/Chip',
  component: Chip,
  args: {
    label: 'Machine Learning',
    removable: false,
    removeLabel: 'Remove Machine Learning',
    onRemove: fn(),
  },
  argTypes: { size: { control: 'inline-radio', options: [undefined, 'small'] } },
  parameters: {
    docs: {
      description: {
        component:
          'A compact, optionally removable label such as a selected filter or tag. The remove button is keyboard operable: Enter and Space activate it, and Backspace or Delete remove the chip while it is focused.',
      },
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Removable: Story = {
  args: { removable: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Remove Machine Learning' });
    button.focus();
    await userEvent.keyboard('{Backspace}');
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

export const Compact: Story = { args: { label: 'Compact', size: 'small' } };

export const CompactRemovable: Story = { args: { label: 'Compact', size: 'small', removable: true } };

export const WithChildren: Story = {
  args: { label: undefined, removable: true, removeLabel: 'Remove Alpha Group' },
  render: (args) => (
    <Chip {...args}>
      <b>Alpha</b> Group
    </Chip>
  ),
};

export const LongLabel: Story = {
  args: {
    label: 'A very long label that has to be truncated with an ellipsis',
    removable: true,
    removeLabel: 'Remove long label',
  },
  render: (args) => (
    <div style={{ width: 220 }}>
      <Chip {...args} />
    </div>
  ),
};

/** The host removes the chip in `onRemove`. */
export const RemovableList: Story = {
  render: () => {
    const [items, setItems] = useState(['Algorithms', 'Databases', 'Networks']);
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {items.map((item) => (
          <Chip
            key={item}
            label={item}
            removable
            removeLabel={`Remove ${item}`}
            onRemove={() => setItems((current) => current.filter((value) => value !== item))}
          />
        ))}
      </div>
    );
  },
};
