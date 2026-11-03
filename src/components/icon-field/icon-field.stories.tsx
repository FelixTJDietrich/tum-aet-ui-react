import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { SearchIcon } from '../../internal/icons';
import { Input } from '../input/input';
import { IconField } from './icon-field';

const FormLayout: Decorator = (Story) => (
  <div style={{ display: 'grid', gap: 'calc(var(--tumaet-ui-spacing) * 2)', width: 'min(20rem, calc(100vw - 2rem))' }}>
    <Story />
  </div>
);

const meta = {
  title: 'Forms/Icon Field',
  component: IconField,
  parameters: {
    docs: {
      description: {
        component:
          'Wraps an `Input` and overlays a decorative icon (hidden from assistive technology) at its start or end. ' +
          'The input gets matching padding, and the icon follows the writing direction, so `left` and `right` mean start and end in RTL.',
      },
    },
  },
  args: {
    icon: <SearchIcon />,
    iconPosition: 'left',
  },
  argTypes: {
    iconPosition: { control: 'inline-radio', options: ['left', 'right'] },
    icon: { control: false },
  },
  decorators: [FormLayout],
  render: (args) => (
    <>
      <label htmlFor="course-search" style={{ fontWeight: 600 }}>
        Search courses
      </label>
      <IconField {...args}>
        <Input id="course-search" type="search" placeholder="Course name or identifier" />
      </IconField>
    </>
  ),
} satisfies Meta<typeof IconField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Trailing: Story = {
  args: { iconPosition: 'right' },
};

export const WithoutIcon: Story = {
  args: { icon: undefined },
};

export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl">
      <label htmlFor="course-search-rtl" style={{ fontWeight: 600 }}>
        Search courses
      </label>
      <IconField {...args}>
        <Input id="course-search-rtl" type="search" placeholder="Course name or identifier" />
      </IconField>
    </div>
  ),
};
