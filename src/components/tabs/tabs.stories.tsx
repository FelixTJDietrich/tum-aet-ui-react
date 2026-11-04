import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Tab, TabList, TabPanel, TabPanels, Tabs, type TabsProps } from './tabs';

function CourseTabs({ value: initial, onChange, ...rest }: TabsProps) {
  const [value, setValue] = useState(initial);
  return (
    <Tabs
      {...rest}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    >
      <TabList aria-label="Course">
        <Tab value="overview">Overview</Tab>
        <Tab value="exercises">Exercises</Tab>
        <Tab value="grading" disabled>
          Grading
        </Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="overview">Course overview</TabPanel>
        <TabPanel value="exercises">Exercise list</TabPanel>
        <TabPanel value="grading">Grading configuration</TabPanel>
        <TabPanel value="settings">Course settings</TabPanel>
      </TabPanels>
    </Tabs>
  );
}

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  subcomponents: { TabList, Tab, TabPanels, TabPanel },
  args: { value: 'overview', onChange: fn() },
  argTypes: {
    value: { control: 'inline-radio', options: ['overview', 'exercises', 'settings'] },
    onChange: { control: false },
    activation: { control: 'inline-radio', options: ['automatic', 'manual'] },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Accessible tabs (WAI-ARIA tabs pattern). `TabList` owns the `tablist` role and the keyboard model: arrow keys move between tabs following the text direction and wrapping at both ends, Home and End jump to the first and last tab, and focusing a tab selects it (`activation="manual"` selects on Enter, Space or click instead). A disabled tab can be reached with the arrow keys and is announced as unavailable, but is never selected. When the value names no enabled tab, the first enabled tab is selected and reported through `onChange`. Panels are optional: without them the tab list switches a view the host renders itself.',
      },
    },
  },
  render: (args) => <CourseTabs {...args} />,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole('tab', { name: 'Overview' });
    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{End}');

    const settings = canvas.getByRole('tab', { name: 'Settings' });
    await expect(settings).toHaveFocus();
    await waitFor(async () => expect(settings).toHaveAttribute('aria-selected', 'true'));
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Course settings');
    await expect(args.onChange).toHaveBeenCalledWith('settings');

    await userEvent.keyboard('{ArrowRight}');
    await expect(overview).toHaveFocus();

    // A disabled tab takes focus, so it can be discovered and is announced as unavailable, but is not selected.
    await userEvent.keyboard('{ArrowLeft}');
    await userEvent.keyboard('{ArrowLeft}');
    const grading = canvas.getByRole('tab', { name: 'Grading' });
    await expect(grading).toHaveFocus();
    await expect(grading).toHaveAttribute('aria-disabled', 'true');
    await expect(grading).toHaveAttribute('aria-selected', 'false');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Course settings');
  },
};

/** Arrow keys only move focus; Enter or Space selects. */
export const ManualActivation: Story = {
  args: { activation: 'manual' },
};

/** Height-bound editors and chats keep their own scroll area and a visible composer. */
export const BoundedContent: Story = {
  render: () => {
    const messages = Array.from({ length: 50 }, (_, index) => `Message ${index + 1}`);
    return <BoundedTabs messages={messages} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bounds = canvas.getByTestId('bounded-tabs');
    const chat = canvas.getByRole('region', { name: 'Chat conversation' });
    const messages = canvas.getByRole('log', { name: 'Messages' });
    const composer = canvas.getByRole('textbox', { name: 'Message' });

    await waitFor(async () => {
      await expect(chat.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        bounds.getBoundingClientRect().bottom + 0.5,
      );
      await expect(chat.getBoundingClientRect().height).toBeGreaterThan(0);
      await expect(chat.getBoundingClientRect().height).toBeLessThan(bounds.getBoundingClientRect().height);
      await expect(composer.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        bounds.getBoundingClientRect().bottom + 0.5,
      );
      await expect(messages.scrollHeight).toBeGreaterThan(messages.clientHeight);
    });
    await userEvent.type(composer, 'Unsaved draft');
    const composerTop = composer.getBoundingClientRect().top;
    messages.scrollTop = messages.scrollHeight;
    await expect(composer.getBoundingClientRect().top).toBeCloseTo(composerTop, 1);

    await userEvent.click(canvas.getByRole('tab', { name: 'Notes' }));
    await waitFor(async () => expect(chat).not.toBeVisible());
    await userEvent.click(canvas.getByRole('tab', { name: 'Chat' }));
    await waitFor(async () => expect(chat).toBeVisible());
    await expect(canvas.getByRole('textbox', { name: 'Message' })).toBe(composer);
    await expect(composer).toHaveValue('Unsaved draft');
  },
};

function BoundedTabs({ messages }: { messages: string[] }) {
  const [value, setValue] = useState<number | string>('chat');
  return (
    <div data-testid="bounded-tabs" style={{ height: '20rem', width: 'min(36rem, 100%)' }}>
      <Tabs value={value} onChange={setValue} style={{ height: '100%', minHeight: 0 }}>
        <TabList aria-label="Workspace" style={{ flexShrink: 0 }}>
          <Tab value="chat">Chat</Tab>
          <Tab value="notes">Notes</Tab>
        </TabList>
        <TabPanels style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'auto' }}>
          <TabPanel value="chat" preserveContent fill>
            <section
              aria-label="Chat conversation"
              style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard focusable so it can be scrolled */}
              <div role="log" aria-label="Messages" tabIndex={0} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {messages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
              <label style={{ flexShrink: 0 }}>
                Message
                <textarea aria-label="Message" style={{ display: 'block' }} />
              </label>
            </section>
          </TabPanel>
          <TabPanel value="notes">Workspace notes</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
