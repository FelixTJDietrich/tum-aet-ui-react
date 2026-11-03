import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from './button';
import { ButtonGroup } from './button-group';

interface GroupArgs {
  firstLabel: string;
  secondLabel: string;
  thirdLabel: string;
  dir?: 'ltr' | 'rtl';
}

/** Date navigation group used by every story. */
function DateNavigation({ firstLabel, secondLabel, thirdLabel, dir }: GroupArgs) {
  return (
    <ButtonGroup aria-label="Date navigation" dir={dir}>
      <Button severity="secondary">{firstLabel}</Button>
      <Button severity="secondary">{secondLabel}</Button>
      <Button severity="secondary">{thirdLabel}</Button>
    </ButtonGroup>
  );
}

const meta = {
  title: 'Actions/Button Group',
  component: DateNavigation,
  subcomponents: { Button },
  args: { firstLabel: 'Previous', secondLabel: 'Today', thirdLabel: 'Next' },
  parameters: {
    docs: {
      description: {
        component:
          '`ButtonGroup` (`role="group"`, give it an `aria-label`) joins adjacent `Button`s into one segmented control: only the outer corners stay rounded and neighbouring borders collapse. It uses logical properties, so it mirrors in right-to-left layouts.',
      },
    },
  },
} satisfies Meta<typeof DateNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

const checkJoined: Story['play'] = async ({ canvas }) => {
  const [first, middle, last] = canvas.getAllByRole('button').map((button) => getComputedStyle(button));
  await expect(first!.borderStartStartRadius).not.toBe('0px');
  await expect(first!.borderStartEndRadius).toBe('0px');
  await expect(first!.borderEndEndRadius).toBe('0px');
  await expect(first!.borderInlineEndWidth).toBe('0px');
  await expect(middle!.borderRadius).toBe('0px');
  await expect(middle!.borderInlineEndWidth).toBe('0px');
  await expect(last!.borderStartStartRadius).toBe('0px');
  await expect(last!.borderEndStartRadius).toBe('0px');
  await expect(last!.borderStartEndRadius).not.toBe('0px');
  await expect(last!.borderInlineEndWidth).not.toBe('0px');
};

export const Default: Story = { play: checkJoined };

/** Other variants and a single button: a group of one keeps all four corners rounded. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      {(['solid', 'outlined', 'text'] as const).map((variant) => (
        <ButtonGroup key={variant} aria-label={`${variant} group`}>
          <Button variant={variant}>One</Button>
          <Button variant={variant}>Two</Button>
          <Button variant={variant}>Three</Button>
        </ButtonGroup>
      ))}
      <ButtonGroup aria-label="Single">
        <Button>Only</Button>
      </ButtonGroup>
    </div>
  ),
};

export const NativeButtons: Story = {
  render: ({ firstLabel, secondLabel, thirdLabel }) => (
    <ButtonGroup aria-label="Date navigation">
      {[firstLabel, secondLabel, thirdLabel].map((label) => (
        <button
          key={label}
          type="button"
          className="tumaet-ui-btn"
          data-severity="secondary"
          data-variant="solid"
          data-size="default"
        >
          {label}
        </button>
      ))}
    </ButtonGroup>
  ),
  play: checkJoined,
};

export const NativeButtonsRtl: Story = {
  args: { dir: 'rtl' },
  play: checkJoined,
};
