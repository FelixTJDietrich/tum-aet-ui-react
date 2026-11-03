import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, type TagSeverity } from './tag';

const severities: TagSeverity[] = ['secondary', 'success', 'info', 'warn', 'danger', 'contrast'];

const meta = {
  title: 'Data Display/Tag',
  component: Tag,
  args: { value: 'Draft', severity: 'secondary', size: 'md', rounded: false },
  argTypes: {
    severity: { control: 'select', options: severities },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A small status label. Pass the text as `value` or as children. `sm` is meant for a tag that annotates other content, `md` for a standalone tag.',
      },
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Published: Story = { args: { severity: 'success', value: 'Published' } };
export const InReview: Story = { args: { severity: 'info', value: 'In review' } };
export const DueSoon: Story = { args: { severity: 'warn', value: 'Due soon' } };
export const Overdue: Story = { args: { severity: 'danger', value: 'Overdue' } };
export const Archived: Story = { args: { severity: 'contrast', value: 'Archived' } };

/** Every severity in both sizes, square and rounded. */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      {([false, true] as const).map((rounded) =>
        (['md', 'sm'] as const).map((size) => (
          <div key={`${rounded}-${size}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {severities.map((severity) => (
              <Tag key={severity} {...args} severity={severity} size={size} rounded={rounded} value={severity} />
            ))}
          </div>
        )),
      )}
    </div>
  ),
};

export const WithChildren: Story = {
  args: { value: undefined, severity: 'info' },
  render: (args) => (
    <Tag {...args}>
      <strong>3</strong> new
    </Tag>
  ),
};
