import type { HTMLAttributes } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from '../components/button/button';
import { FormField } from '../components/form-field/form-field';
import { Input } from '../components/input/input';
import { cx } from '../internal/cx';
import './theming.stories.css';

function ThemeSample({ label, className, children, ...rest }: HTMLAttributes<HTMLElement> & { label: string }) {
  return (
    <section {...rest} aria-label={label} className={cx('tumaet-ui-root', 'tumaet-ui-theme-demo-surface', className)}>
      <h2>{label}</h2>
      <FormField label="Course name">
        <Input placeholder="Introduction to programming" />
      </FormField>
      <div className="tumaet-ui-theme-demo-controls">
        <Button>Continue</Button>
        <Button variant="outlined">Cancel</Button>
      </div>
      {children}
    </section>
  );
}

async function expectTheme(region: HTMLElement, theme: 'light' | 'dark') {
  await expect(getComputedStyle(region).colorScheme).toBe(theme);
  const primary = getComputedStyle(region).getPropertyValue('--tumaet-ui-primary-color').trim();
  const surface = getComputedStyle(region).backgroundColor;
  await expect(primary).toBe(theme === 'light' ? '#3779b4' : '#65a1d6');
  await expect(surface).toBe(theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(22, 25, 29)');
}

const meta = {
  title: 'Foundation/Theming',
  component: ThemeSample,
  args: { label: 'Inherited page theme' },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tokens, base and components share the tumaet-ui cascade layer. Light is the default. Explicit data-theme wins over class aliases on the same element; .light wins over .dark when both classes are present. Each nested marker establishes its own theme. See the Theming guide for layer ordering and the current scoped-portal limitation.',
      },
    },
  },
} satisfies Meta<typeof ThemeSample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PageTheme: Story = {};

export const NestedThemes: Story = {
  render: () => (
    <div className="tumaet-ui-theme-demo-stack">
      <ThemeSample label="Light outer" data-theme="light">
        <ThemeSample label="Dark middle" className="dark">
          <ThemeSample label="Light inner" className="light" />
        </ThemeSample>
      </ThemeSample>
      <ThemeSample label="Dark outer" data-theme="dark">
        <ThemeSample label="Light middle" className="light">
          <ThemeSample label="Dark inner" className="dark" />
        </ThemeSample>
      </ThemeSample>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const name of ['Light outer', 'Light middle', 'Light inner']) {
      await expectTheme(canvas.getByRole('region', { name }), 'light');
    }
    for (const name of ['Dark outer', 'Dark middle', 'Dark inner']) {
      await expectTheme(canvas.getByRole('region', { name }), 'dark');
    }
  },
};

export const MarkerPrecedence: Story = {
  render: () => (
    <div className="tumaet-ui-theme-demo-stack">
      <ThemeSample label="Dark attribute beats light class" data-theme="dark" className="light" />
      <ThemeSample label="Light attribute beats dark class" data-theme="light" className="dark" />
      <ThemeSample label="Both classes choose light" className="dark light" />
      <ThemeSample label="Invalid attribute leaves dark alias active" data-theme="other" className="dark" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expectTheme(canvas.getByRole('region', { name: 'Dark attribute beats light class' }), 'dark');
    await expectTheme(canvas.getByRole('region', { name: 'Light attribute beats dark class' }), 'light');
    await expectTheme(canvas.getByRole('region', { name: 'Both classes choose light' }), 'light');
    await expectTheme(canvas.getByRole('region', { name: 'Invalid attribute leaves dark alias active' }), 'dark');
  },
};

export const ApplicationOverrides: Story = {
  render: () => (
    <div className="tumaet-ui-root tumaet-ui-theme-demo-stack">
      <p>Each small button gets wider padding from a single application class.</p>
      <div className="tumaet-ui-theme-demo-controls">
        <Button size="small">Library default</Button>
        <Button size="small" className="tumaet-ui-theme-demo-unlayered">
          Unlayered CSS
        </Button>
        <Button size="small" className="tumaet-ui-theme-demo-layered">
          App layer
        </Button>
        <Button size="small" className="tumaet-ui-theme-demo-utility">
          Utility layer
        </Button>
      </div>
      <ThemeSample label="Scoped token override" className="tumaet-ui-theme-demo-brand" />
    </div>
  ),
  play: async ({ canvas }) => {
    for (const [name, padding] of [
      ['Unlayered CSS', '32px'],
      ['App layer', '40px'],
      ['Utility layer', '48px'],
    ]) {
      await expect(getComputedStyle(canvas.getByRole('button', { name })).paddingInlineStart).toBe(padding);
    }
  },
};
