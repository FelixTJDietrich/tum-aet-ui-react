import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from './tag';

const meta = { title: 'Data display/Tag', component: Tag, args: { children: 'Active' } } satisfies Meta<typeof Tag>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Severities: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['success', 'info', 'warn', 'danger', 'secondary', 'contrast'] as const).map((severity) => (
        <Tag key={severity} {...args} severity={severity}>{severity}</Tag>
      ))}
    </div>
  ),
};
