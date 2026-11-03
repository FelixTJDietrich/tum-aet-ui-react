import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { buttonAttributes, type ButtonProps } from './button';

type LinkArgs = Pick<ButtonProps, 'severity' | 'size' | 'variant' | 'rounded'> & { label: string };

/** Styles a native element like a button, here a link. Stands in for the Angular `tumAetUiButton` directive. */
function ButtonLink({ label, ...style }: LinkArgs) {
  return (
    <a href="#button-directive" {...buttonAttributes(style)}>
      {label}
    </a>
  );
}

const meta = {
  title: 'Actions/Button Directive',
  component: ButtonLink,
  args: { label: 'Native button', severity: 'primary', size: 'default', variant: 'solid', rounded: false },
  argTypes: {
    severity: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'],
    },
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
    variant: { control: 'inline-radio', options: ['solid', 'outlined', 'text'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          '`buttonAttributes({ severity, size, variant, rounded })` returns the class name and `data-*` attributes that style any element (a link, a `<summary>`, a router link) like a `Button`. Spread it on the element: `<a href="/x" {...buttonAttributes({ variant: "text" })}>`.',
      },
    },
  },
} satisfies Meta<typeof ButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Link: Story = { args: { variant: 'text', label: 'Course details' } };

/** A native element using the helper keeps the same keyboard focus treatment as `Button`. */
export const NativeVariantHelper: Story = {
  args: { severity: 'danger', size: 'small', label: 'Delete selection' },
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getByRole('link', { name: 'Delete selection' });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    const style = getComputedStyle(link);
    await expect(style.outlineStyle).not.toBe('none');
    await expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
  },
};
