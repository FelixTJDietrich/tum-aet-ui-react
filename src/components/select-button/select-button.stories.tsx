import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { SelectButton, type SelectButtonSingleProps } from './select-button';

interface IntervalOption {
  label: string;
  value: string;
  abbreviation: string;
}

const OPTIONS: readonly IntervalOption[] = [
  { label: 'Day', value: 'day', abbreviation: 'D' },
  { label: 'Week', value: 'week', abbreviation: 'W' },
  { label: 'Month', value: 'month', abbreviation: 'M' },
];

const FormLayout: Decorator = (Story) => (
  <div style={{ display: 'grid', gap: 'calc(var(--tumaet-ui-spacing) * 2)', width: 'min(20rem, calc(100vw - 2rem))' }}>
    <Story />
  </div>
);

const labelStyle = { fontWeight: 600 } as const;

const meta = {
  title: 'Forms/Select Button',
  component: SelectButton,
  parameters: {
    docs: {
      description: {
        component:
          'Segmented group of toggle buttons for a small, persistent set of choices. One option can be on (the default), or several with `multiple`. ' +
          'Options are primitives, or objects read through `optionLabel` and `optionValue`; options without a label and without `itemTemplate` are omitted. ' +
          'The buttons carry `aria-pressed` inside a `role="group"` that needs an accessible name. Keyboard: Tab enters the group at the selected option, ' +
          'arrow keys, Home and End move focus, Space and Enter toggle. With `allowEmpty` (the default) a second click on the selected option clears it, and `onChange` receives `null`.',
      },
    },
  },
  args: {
    options: OPTIONS,
    optionLabel: 'label',
    optionValue: 'value',
    value: 'day',
    size: 'default',
    allowEmpty: false,
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    onChange: { control: false },
    options: { control: 'object' },
    value: { control: 'inline-radio', options: [null, ...OPTIONS.map((option) => option.value)] },
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
    multiple: { control: false },
    itemTemplate: { control: false },
  },
  decorators: [FormLayout],
  render: function Render({ value, onChange, ...args }) {
    const single = args as SelectButtonSingleProps;
    const [selected, setSelected] = useState<unknown>(value);
    const [seen, setSeen] = useState<unknown>(value);
    if (seen !== value) {
      // The Controls panel changed the arg: follow it.
      setSeen(value);
      setSelected(value);
    }
    return (
      <>
        <span id="interval-label" style={labelStyle}>
          Reporting interval
        </span>
        <SelectButton
          {...single}
          aria-labelledby="interval-label"
          value={selected}
          onChange={(next) => {
            setSelected(next);
            (onChange as ((v: unknown) => void) | undefined)?.(next);
          }}
        />
      </>
    );
  },
} satisfies Meta<typeof SelectButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'small' },
};

export const Large: Story = {
  args: { size: 'large' },
};

export const Disabled: Story = {
  args: { value: 'week', disabled: true },
};

export const AllowEmpty: Story = {
  args: { allowEmpty: true, value: 'week' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Week' }));
    await expect(canvas.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onChange).toHaveBeenCalledWith(null);
  },
};

export const PrimitiveOptions: Story = {
  args: { options: ['List', 'Grid', 'Table'], optionLabel: undefined, optionValue: undefined, value: 'Grid' },
};

export const KeyboardInteraction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, userEvent }) => {
    const day = canvas.getByRole('button', { name: 'Day' });
    const week = canvas.getByRole('button', { name: 'Week' });
    const month = canvas.getByRole('button', { name: 'Month' });

    // One tab stop, on the selected option; the arrow keys move focus inside the group.
    await userEvent.tab();
    await expect(day).toHaveFocus();
    await expect(day).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('{ArrowRight}');
    await expect(week).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(day).toHaveAttribute('aria-pressed', 'false');
    await expect(week).toHaveAttribute('aria-pressed', 'true');
    await expect(args.onChange).toHaveBeenCalledWith('week');
    await userEvent.keyboard('{End}');
    await expect(month).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(month).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Multiple: Story = {
  render: () => {
    const [days, setDays] = useState<unknown[]>(['mon']);
    return (
      <>
        <span id="days-label" style={labelStyle}>
          Days
        </span>
        <SelectButton
          multiple
          aria-labelledby="days-label"
          options={[
            { label: 'Mon', value: 'mon' },
            { label: 'Tue', value: 'tue' },
            { label: 'Wed', value: 'wed' },
          ]}
          optionLabel="label"
          optionValue="value"
          value={days}
          onChange={setDays}
        />
      </>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Wed' }));
    await expect(canvas.getByRole('button', { name: 'Mon' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Wed' })).toHaveAttribute('aria-pressed', 'true');
  },
};

/** An item template replaces the label; icon-only content still needs an accessible name. */
export const CustomItemTemplate: Story = {
  args: {
    itemTemplate: (option) => {
      const { abbreviation, label } = option as IntervalOption;
      return (
        <>
          <span aria-hidden="true">{abbreviation}</span>
          <span className="tumaet-ui-sr-only">{label}</span>
        </>
      );
    },
  },
};

export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl">
      <SelectButton {...(args as SelectButtonSingleProps)} aria-label="Reporting interval" />
    </div>
  ),
};
