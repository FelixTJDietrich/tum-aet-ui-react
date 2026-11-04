import type { SVGProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlusIcon, SearchIcon } from '../../internal/icons';
import { Button } from '../button/button';
import { EmptyState } from './empty-state';

// Font Awesome Free solid paths (CC BY 4.0), only used by these stories.
function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="tumaet-ui-icon"
      viewBox="0 0 512 512"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z" />
    </svg>
  );
}
function FileImportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="tumaet-ui-icon"
      viewBox="0 0 384 512"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M64 0C28.7 0 0 28.7 0 64l0 240 182.1 0-31-31c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l72 72c9.4 9.4 9.4 24.6 0 33.9l-72 72c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l31-31-182.1 0 0 96c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-277.5c0-17-6.7-33.3-18.7-45.3L258.7 18.7C246.7 6.7 230.5 0 213.5 0L64 0zM325.5 176L232 176c-13.3 0-24-10.7-24-24L208 58.5 325.5 176z" />
    </svg>
  );
}

const actions = (
  <>
    <Button icon={<PlusIcon />}>Add exercise</Button>
    <Button icon={<FileImportIcon />} variant="outlined">
      Import from course
    </Button>
  </>
);

const documentation = (
  <a href="https://docs.artemis.tum.de/instructor/exercises/intro" target="_blank" rel="noopener noreferrer">
    Learn about exercises
  </a>
);

const meta = {
  title: 'Data Display/Empty State',
  component: EmptyState,
  args: {
    title: 'No exercises yet',
    description:
      'Exercises you create for this course will be listed here. You can also import exercises from an existing course.',
    variant: 'outlined',
    icon: <ListIcon />,
  },
  argTypes: {
    variant: { control: 'select', options: ['outlined', 'solid', 'plain'] },
    icon: { control: false },
    actions: { control: false, description: 'Optional actions (buttons, links) below the description.' },
    documentation: { control: false, description: 'Optional documentation link below the actions.' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A consistent empty state for views without content, including empty search results. Actions and documentation links are provided by the host application through the optional `actions` and `documentation` props.',
      },
    },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Solid: Story = { args: { variant: 'solid' } };
export const Plain: Story = { args: { variant: 'plain' } };
export const EmptySearchResults: Story = {
  args: {
    title: 'No matching exercises',
    description: 'Try adjusting your search or filters to find what you are looking for.',
    icon: <SearchIcon />,
  },
};
export const WithActions: Story = { args: { actions } };
export const WithDocumentation: Story = { args: { documentation } };
export const WithActionsAndDocumentation: Story = {
  name: 'With Actions & Documentation',
  args: { actions, documentation },
};
export const WithoutIconOrDescription: Story = { args: { icon: undefined, description: undefined } };
