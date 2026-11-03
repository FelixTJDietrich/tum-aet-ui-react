import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button, type ButtonSeverity, type ButtonVariant } from './button';
import { DownloadIcon } from './icons';

const severities: ButtonSeverity[] = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'];
const variants: ButtonVariant[] = ['solid', 'outlined', 'text'];

const meta = {
  title: 'Actions/Button',
  component: Button,
  args: {
    children: 'Continue',
    severity: 'primary',
    size: 'default',
    variant: 'solid',
    disabled: false,
    rounded: false,
    loading: false,
    onClick: fn(),
  },
  argTypes: {
    severity: { control: 'select', options: severities },
    size: { control: 'select', options: ['small', 'default', 'large'] },
    variant: { control: 'select', options: variants },
    icon: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Native `<button>` with seven severities, three variants (`solid`, `outlined`, `text`) and three sizes, mirroring `tumaet-ui-button`. `loading` replaces the icon with a spinner, disables the button and sets `aria-busy`; the spinner stops under `prefers-reduced-motion`. The icon is decorative, so an icon-only button needs an `aria-label`. `type` defaults to `button`. To style a link like a button, spread `buttonAttributes()` on an `<a>` (the counterpart of the Angular `tumAetUiButton` directive).',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outlined: Story = { args: { variant: 'outlined' } };

export const Text: Story = { args: { variant: 'text' } };

export const Disabled: Story = { args: { disabled: true } };

export const Loading: Story = { args: { loading: true } };

export const IconOnly: Story = {
  args: {
    'aria-label': 'Download results',
    icon: <DownloadIcon />,
    children: undefined,
    rounded: true,
  },
};

export const WithIcon: Story = { args: { icon: <DownloadIcon />, children: 'Download' } };

export const Rounded: Story = { args: { rounded: true, children: 'Rounded' } };

/** Every severity in every variant, enabled, disabled and loading. */
export const SeveritiesAndVariants: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      {(['enabled', 'disabled', 'loading'] as const).map((state) => (
        <div key={state} style={{ display: 'grid', gap: 8 }}>
          <strong>{state}</strong>
          {variants.map((variant) => (
            <div key={variant} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {severities.map((severity) => (
                <Button
                  key={severity}
                  {...args}
                  severity={severity}
                  variant={variant}
                  disabled={state === 'disabled'}
                  loading={state === 'loading'}
                >
                  {severity}
                </Button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <Button key={size} {...args} size={size} icon={<DownloadIcon />}>
          {size}
        </Button>
      ))}
    </div>
  ),
};
