import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Input } from '../input/input';
import { Select } from '../select/select';
import { FormField } from './form-field';

function FormLayout(Story: Parameters<Decorator>[0]) {
  return (
    <div style={{ width: 'min(24rem, calc(100vw - 2rem))' }}>
      <Story />
    </div>
  );
}

const meta = {
  title: 'Forms/Form Field',
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          'Labelled wrapper around a single control. It owns the label, the required marker, and the hint and error text, ' +
          'and wires `for`, `aria-describedby` and the invalid state to the control it wraps, so a minimal field needs no ids. ' +
          'The error region is always rendered so its `role="alert"` announces when it appears; it stays hidden, and out of ' +
          'the control description, while `invalid` is false. An error replaces the hint as the description. ' +
          'Controls built on `useFormFieldControl` (`Input`, `Textarea`, `InputNumber`, `Checkbox`, `RadioButton`, `ToggleSwitch`, `SearchField`, ...) adopt it.',
      },
    },
  },
  args: {
    label: 'Login',
    required: false,
    invalid: false,
    error: 'Enter a login',
  },
  decorators: [FormLayout],
  render: (args) => (
    <FormField {...args}>
      <Input placeholder="ab12cde" />
    </FormField>
  ),
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const WithHint: Story = {
  args: { hint: 'Your TUM identifier, for example ab12cde.' },
};

export const Invalid: Story = {
  args: { invalid: true, required: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: /Login/ });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Enter a login');
  },
};

export const InvalidReplacesTheHint: Story = {
  args: { invalid: true, hint: 'Your TUM identifier, for example ab12cde.' },
};

/** A select adopts the field's id and description exactly as a native input does. */
export const WrappingASelect: Story = {
  args: { label: 'Language', error: 'Pick a language' },
  render: (args) => (
    <FormField {...args}>
      <Select options={['English', 'German']} placeholder="Select a language" />
    </FormField>
  ),
};
