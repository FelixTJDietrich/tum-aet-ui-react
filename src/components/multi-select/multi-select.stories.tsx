import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, screen } from 'storybook/test';
import { MultiSelect, type MultiSelectProps } from './multi-select';

const eventTypes = [
  { code: 'lectures', label: 'Lectures' },
  { code: 'exercises', label: 'Exercises' },
  { code: 'tutorials', label: 'Tutorials' },
  { code: 'exams', label: 'Exams' },
];

/** Keeps the chosen values in state, as a form would, and forwards every change to the `onChange` spy. */
function StatefulMultiSelect({ value: initial, onChange, ...props }: MultiSelectProps) {
  const [value, setValue] = useState<readonly unknown[]>(initial ?? []);
  return (
    <MultiSelect
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const meta = {
  title: 'Forms/Multi Select',
  component: MultiSelect,
  render: (args) => <StatefulMultiSelect {...args} />,
  decorators: [
    (Story) => (
      <div style={{ width: 'min(20rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    'aria-label': 'Event types',
    onChange: fn(),
    optionLabel: 'label',
    optionValue: 'code',
    options: eventTypes,
    placeholder: 'Choose event types',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
    variant: { control: 'inline-radio', options: ['default', 'outlined'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Chooses any number of values from a listbox popup that stays open while options are toggled. The value is an array of the `optionValue` property of the chosen options (the options themselves when omitted). Keyboard: Enter, Space or the arrow keys open it, the arrows, Home and End move, Enter or Space toggle, Escape closes and returns focus, Tab closes. `renderSelectedItems` replaces the summary in the trigger and may contain interactive content such as remove buttons; `renderOption` replaces the label of an option row.',
      },
    },
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ChoosesSeveralOptions: Story = {
  parameters: { docs: { story: { autoplay: true } } },
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Event types' });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Lectures' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Exams' }));

    await expect(trigger).toHaveTextContent('Lectures, Exams');
    await expect(args.onChange).toHaveBeenLastCalledWith(['lectures', 'exams']);
    await expect(await screen.findByRole('listbox', { name: 'Event types' })).toHaveAttribute(
      'aria-multiselectable',
      'true',
    );
  },
};

export const CountsBeyondTheLabelLimit: Story = {
  args: { maxSelectedLabels: 1 },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Event types' });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Lectures' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Exercises' }));

    await expect(trigger).toHaveTextContent('2 selected');
  },
};

export const Outlined: Story = {
  args: { variant: 'outlined', size: 'small' },
};

export const Sizes: Story = {
  parameters: { docs: { description: { story: 'Small, default and large triggers.' } } },
  render: (args) => (
    <div style={{ display: 'grid', gap: 8 }}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <StatefulMultiSelect
          key={size}
          {...args}
          size={size}
          aria-label={`${size} multi select`}
          placeholder={`${size} size`}
          value={['lectures']}
        />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, value: ['lectures', 'exams'] },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, required: true },
  parameters: {
    docs: {
      description: {
        story: 'The danger border follows `aria-invalid`; `required` is announced to assistive technology.',
      },
    },
  },
};

export const Empty: Story = {
  args: { options: [], emptyMessage: 'No event types available' },
  tags: ['!autodocs'],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Event types' }));
    await expect(await screen.findByText('No event types available')).toBeVisible();
  },
};

export const CustomContent: Story = {
  parameters: {
    docs: {
      description: {
        story: '`renderOption` and `renderSelectedItems` replace the option label and the trigger summary.',
      },
    },
  },
  args: {
    value: ['lectures', 'exams'],
    renderOption: (option, { selected }) => (
      <span style={{ flex: 1, fontWeight: selected ? 600 : 400 }}>{(option as (typeof eventTypes)[number]).label}</span>
    ),
    renderSelectedItems: (chosen) => (
      <span style={{ flex: 1 }}>{(chosen as typeof eventTypes).map((o) => o.label.toUpperCase()).join(' + ')}</span>
    ),
  },
};

export const RightToLeft: Story = {
  parameters: {
    docs: { description: { story: 'Padding and chevron use logical properties and mirror in right-to-left text.' } },
  },
  render: (args) => (
    <div dir="rtl">
      <StatefulMultiSelect {...args} value={['lectures']} />
    </div>
  ),
};
