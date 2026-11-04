import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import { Select, type SelectProps } from './select';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
];

/** Keeps the selected value in state, as a form would, and forwards every change to the `onChange` spy. */
function StatefulSelect({ value: initial, onChange, ...props }: SelectProps) {
  const [value, setValue] = useState<unknown>(initial ?? null);
  return (
    <Select
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
  title: 'Forms/Select',
  component: Select,
  render: (args) => <StatefulSelect {...args} />,
  decorators: [
    (Story) => (
      <div style={{ width: 'min(20rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    'aria-label': 'Course language',
    onChange: fn(),
    optionLabel: 'label',
    optionValue: 'code',
    options: languages,
    placeholder: 'Choose a language',
    showClear: true,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Single-value select with a listbox popup. Keyboard: Enter, Space or the arrow keys open it, Home and End jump to the first and last option, typing a letter jumps to a matching option, Enter or Space picks, Tab picks the active option and moves on, Escape closes and returns focus to the trigger. Pass `value`/`onChange` to control it, or `defaultValue` to leave the state to the component. The value is the `optionValue` property of the chosen option (the option itself when omitted) and `null` after clearing.',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  parameters: { docs: { story: { autoplay: true } } },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Course language' });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'German' }));
    await expect(trigger).toHaveTextContent('German');
  },
};

export const SelectsOption: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Course language' });
    await userEvent.click(trigger);

    const listbox = await screen.findByRole('listbox', { name: 'Course language' });
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{End}{Enter}');

    await expect(trigger).toHaveTextContent('Spanish');
    await expect(args.onChange).toHaveBeenCalledWith('es');
    await waitFor(async () => expect(listbox).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();

    await userEvent.tab();
    const clear = canvas.getByRole('button', { name: 'Clear selection' });
    await expect(clear).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveTextContent('Choose a language');
  },
};

export const Empty: Story = {
  args: { emptyMessage: 'No languages available', options: [] },
  tags: ['!autodocs'],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Course language' }));
    await expect(await screen.findByText('No languages available')).toBeVisible();
  },
};

export const Filterable: Story = {
  args: {
    filter: true,
    options: [
      { code: 'en', label: 'English' },
      { code: 'de', label: 'German' },
      { code: 'es', label: 'Spanish' },
      { code: 'fr', label: 'French' },
      { code: 'it', label: 'Italian' },
      { code: 'pt', label: 'Portuguese' },
    ],
    showClear: false,
  },
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Course language' });
    await userEvent.click(trigger);

    // Focus moves to the search field, so what the user types filters instead of running the type-ahead.
    const search = await screen.findByRole('textbox', { name: 'Filter options' });
    await expect(search).toHaveFocus();

    await userEvent.type(search, 'ish');
    const listbox = await screen.findByRole('listbox', { name: 'Course language' });
    await expect(within(listbox).getAllByRole('option')).toHaveLength(2);

    await userEvent.click(within(listbox).getByText('Spanish'));
    await expect(trigger).toHaveTextContent('Spanish');
    await expect(args.onChange).toHaveBeenCalledWith('es');
  },
};

export const FilterWithoutMatches: Story = {
  args: { filter: true },
  tags: ['!autodocs'],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Course language' }));
    await userEvent.type(await screen.findByRole('textbox', { name: 'Filter options' }), 'zzz');
    await expect(await screen.findByText('No matching options')).toBeVisible();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Sizes: Story = {
  parameters: { docs: { description: { story: 'Small, default and large triggers.' } } },
  render: (args) => (
    <div style={{ display: 'grid', gap: 8 }}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <StatefulSelect key={size} {...args} size={size} aria-label={`${size} select`} placeholder={`${size} size`} />
      ))}
    </div>
  ),
};

export const WithValue: Story = {
  args: { value: 'de' },
  parameters: { docs: { description: { story: 'A preselected value with the clear button.' } } },
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

export const PrimitiveOptions: Story = {
  args: {
    options: ['Apple', 'Banana', 'Cherry'],
    optionLabel: undefined,
    optionValue: undefined,
    placeholder: 'Choose a fruit',
    'aria-label': 'Fruit',
  },
  parameters: {
    docs: {
      description: { story: 'Without `optionLabel` and `optionValue` the options themselves are label and value.' },
    },
  },
};

export const RightToLeft: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Padding, chevron and clear button use logical properties and mirror in right-to-left text.',
      },
    },
  },
  render: (args) => (
    <div dir="rtl">
      <StatefulSelect {...args} value="de" />
    </div>
  ),
};
