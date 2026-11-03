import type { Meta, StoryObj } from '@storybook/react-vite';
import { List, ListItem, ListItemAction } from './list';
import { ToggleSwitch } from '../toggle-switch/toggle-switch';

const meta = {
  title: 'Data Display/List',
  component: List,
  subcomponents: { ListItem, ListItemAction },
  parameters: {
    docs: {
      description: {
        component:
          'Bordered, vertically stacked list of `ListItem` rows for a settings section, a navigation column or a short record of label / value rows. The list owns the outer border and radius and the rows own the divider between them. Put a `ListItemAction` (a link or a button) inside a row to make the whole row the click and focus target. Use `DataTable` or `Table` instead when the content is tabular.',
      },
    },
  },
  render: (args) => (
    <List aria-label="Account information" style={{ width: 'min(28rem, 100%)' }} {...args}>
      <ListItem>
        <span style={{ fontWeight: 600 }}>Full name</span>
        <span>Ada Lovelace</span>
      </ListItem>
      <ListItem>
        <span style={{ fontWeight: 600 }}>Login</span>
        <span>ab12cde</span>
      </ListItem>
      <ListItem>
        <span style={{ fontWeight: 600 }}>Joined Artemis</span>
        <span>17 May 2021</span>
      </ListItem>
    </List>
  ),
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A row whose action fills it: the whole row is the link, and the current one is marked `aria-current`. */
export const Navigation: Story = {
  render: () => (
    <List aria-label="User settings" style={{ width: 'min(20rem, 100%)' }}>
      <ListItem>
        <ListItemAction href="#account" active>
          Account information
        </ListItemAction>
      </ListItem>
      <ListItem>
        <ListItemAction href="#ssh">SSH keys</ListItemAction>
      </ListItem>
      <ListItem>
        <ListItemAction href="#passkeys">Passkeys</ListItemAction>
      </ListItem>
    </List>
  ),
};

/** The same rows as buttons, for actions that do not navigate. */
export const ButtonActions: Story = {
  render: () => (
    <List aria-label="Actions" style={{ width: 'min(20rem, 100%)' }}>
      <ListItem>
        <ListItemAction onClick={() => undefined}>Export data</ListItemAction>
      </ListItem>
      <ListItem>
        <ListItemAction onClick={() => undefined} active>
          Current view
        </ListItemAction>
      </ListItem>
    </List>
  ),
};

/** Rows compose with any control; the list only supplies the frame and the dividers. */
export const WithControls: Story = {
  render: () => (
    <List aria-label="Notification settings" style={{ width: 'min(28rem, 100%)' }}>
      <ListItem inline>
        <span>Exercise released</span>
        <ToggleSwitch aria-label="Exercise released" />
      </ListItem>
      <ListItem inline>
        <span>New reply in a thread you follow</span>
        <ToggleSwitch aria-label="New reply in a thread you follow" />
      </ListItem>
    </List>
  ),
};
