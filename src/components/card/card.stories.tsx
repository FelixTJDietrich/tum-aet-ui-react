import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './card';

const meta = {
  title: 'Data Display/Card',
  component: Card,
  args: {
    header: 'Course progress',
    subheader: 'Software Engineering',
    children: <p style={{ margin: 0 }}>You completed 8 of 12 exercises.</p>,
    footer: <small style={{ color: 'var(--tumaet-ui-muted-color)' }}>Updated a few seconds ago</small>,
  },
  argTypes: { children: { control: false }, footer: { control: false }, media: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A surface that groups related content. `header` and `subheader` form the caption, children are the content, `footer` sits below the content, and `media` is rendered full width above the body.',
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ContentOnly: Story = { args: { header: undefined, subheader: undefined, footer: undefined } };

export const WithMedia: Story = {
  args: {
    media: (
      <div
        role="img"
        aria-label="Placeholder illustration"
        style={{
          height: '8rem',
          borderRadius: 'var(--tumaet-ui-radius-xl) var(--tumaet-ui-radius-xl) 0 0',
          background: 'var(--tumaet-ui-hover-background)',
        }}
      />
    ),
  },
};
