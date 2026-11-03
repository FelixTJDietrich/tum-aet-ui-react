import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressSpinner } from './progress-spinner';

const meta = {
  title: 'Feedback/Progress Spinner',
  component: ProgressSpinner,
  args: { 'aria-label': 'Loading course data' },
  parameters: {
    docs: {
      description: {
        component:
          'An indeterminate loading spinner exposed as a busy status region. Give it an accessible name with `aria-label`. The animation stops when the user prefers reduced motion. The default size is 100px; set `width` and `height` through `style` or `className` to change it.',
      },
    },
  },
} satisfies Meta<typeof ProgressSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { style: { width: 32, height: 32 } } };
