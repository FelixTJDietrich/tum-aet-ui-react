import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from './progress-bar';

const meta = {
  title: 'Feedback/Progress Bar',
  component: ProgressBar,
  args: {
    'aria-label': 'Course completion',
    severity: 'primary',
    size: 'default',
    value: 60,
    showValue: true,
    unit: '%',
    indeterminate: false,
  },
  argTypes: {
    severity: { control: 'select', options: ['primary', 'success', 'warn', 'danger', 'info'] },
    size: { control: 'inline-radio', options: ['small', 'default'] },
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A determinate progress bar (`role="progressbar"`, value clamped to 0-100) with an optional inline value label, or an indeterminate bar for work of unknown duration. Always give it an accessible name with `aria-label` or `aria-labelledby`.',
      },
    },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { value: 0 } };
export const Complete: Story = { args: { value: 100 } };
export const Small: Story = { args: { size: 'small', severity: 'success' } };
export const Indeterminate: Story = { args: { indeterminate: true, 'aria-label': 'Loading' } };

export const Severities: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      {(['primary', 'success', 'warn', 'danger', 'info'] as const).map((severity) => (
        <ProgressBar key={severity} {...args} severity={severity} aria-label={severity} />
      ))}
    </div>
  ),
};

export const CustomLabel: Story = {
  args: { showValue: false, value: 30 },
  render: (args) => <ProgressBar {...args}>3 of 10</ProgressBar>,
};

export const CustomUnit: Story = { args: { value: 7, unit: ' pts' } };
