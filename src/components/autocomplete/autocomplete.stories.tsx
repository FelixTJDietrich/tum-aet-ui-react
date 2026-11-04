import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, screen, waitFor } from 'storybook/test';
import { Autocomplete, type AutocompleteProps } from './autocomplete';

/** Keeps the value in state, as a form would, and forwards every change to the `onChange` spy. */
function StatefulAutocomplete({ value: initial, onChange, ...props }: AutocompleteProps) {
  const [value, setValue] = useState<unknown>(initial ?? (props.multiple === true ? [] : null));
  return (
    <Autocomplete
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
  title: 'Forms/Autocomplete',
  component: Autocomplete,
  render: (args) => <StatefulAutocomplete {...args} />,
  decorators: [
    (Story) => (
      <div style={{ width: 'min(20rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    'aria-label': 'Assignee',
    onSearch: fn(),
    completeOnFocus: true,
    debounceMs: 0,
    emptyMessage: 'No matching people',
    onOptionSelect: fn(),
    onOptionRemove: fn(),
    placeholder: 'Search people',
    suggestions: ['Ada Lovelace', 'Grace Hopper', 'Margaret Hamilton'],
  },
  argTypes: {
    debounceMs: { control: { type: 'number', min: 0, step: 50 } },
    minLength: { control: { type: 'number', min: 0, step: 1 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Text input with consumer-supplied suggestions. The component does not filter: it calls `onSearch` (debounced, from `minLength` characters, or on focus with `completeOnFocus`) and shows the `suggestions` the consumer passes in response. In single mode the value is the chosen suggestion, or the typed text while nothing was chosen; with `multiple` the value is an array shown as chips, and Backspace in the empty input removes the last chip. Keyboard: the arrows move through the suggestions (disabled ones are skipped), Enter picks, Escape dismisses.',
      },
    },
  },
} satisfies Meta<typeof Autocomplete>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SelectsSuggestion: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('combobox', { name: 'Assignee' });
    await userEvent.click(input);
    const focusEvent: unknown = expect.any(FocusEvent);
    await expect(args.onSearch).toHaveBeenCalledWith({ originalEvent: focusEvent, query: '' });
    const wrapper = input.parentElement;
    if (wrapper === null) {
      throw new Error('The combobox input has no wrapper element.');
    }
    await expect(getComputedStyle(wrapper).outlineWidth).toBe('2px');

    const listbox = await screen.findByRole('listbox', { name: 'Assignee' });
    await userEvent.keyboard('{ArrowDown}{Enter}');

    await expect(input).toHaveValue('Ada Lovelace');
    const keyboardEvent: unknown = expect.any(KeyboardEvent);
    await expect(args.onOptionSelect).toHaveBeenCalledWith({
      originalEvent: keyboardEvent,
      value: 'Ada Lovelace',
    });
    await waitFor(async () => expect(listbox).not.toBeInTheDocument());
  },
};

export const NoResults: Story = {
  args: { suggestions: [] },
  tags: ['!autodocs'],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Assignee' }));
    await expect(await screen.findByText('No matching people')).toBeVisible();
  },
};

export const Multiple: Story = {
  args: { multiple: true, value: ['Ada Lovelace'] },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledWithChips: Story = {
  args: { disabled: true, multiple: true, value: ['Ada Lovelace', 'Grace Hopper'] },
  parameters: { docs: { description: { story: 'Chips have no remove buttons while disabled.' } } },
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

export const DisabledSuggestions: Story = {
  args: {
    optionLabel: 'name',
    optionDisabled: 'assigned',
    suggestions: [
      { name: 'Ada Lovelace', assigned: true },
      { name: 'Grace Hopper', assigned: false },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Suggestions flagged by `optionDisabled` stay visible but cannot be chosen; the keyboard skips them.',
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Assignee' }));
    await expect(await screen.findByRole('option', { name: 'Ada Lovelace' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.getByRole('combobox', { name: 'Assignee' })).toHaveValue('Grace Hopper');
  },
};

export const RightToLeft: Story = {
  args: { multiple: true, value: ['Ada Lovelace'] },
  render: (args) => (
    <div dir="rtl">
      <StatefulAutocomplete {...args} />
    </div>
  ),
};
