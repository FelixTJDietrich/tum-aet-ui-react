import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from '../button/button';
import { DataTable } from './data-table';
import type { ColumnDef } from './table-utils';

interface Participant {
  id: number;
  name: string;
  score: number;
  status: string;
}

const columns: Array<ColumnDef<Participant>> = [
  { field: 'name', header: 'Participant', sort: true, width: '14rem' },
  { field: 'score', header: 'Score', sort: true },
  { field: 'status', header: 'Status', hideBelow: 'sm' },
];

const rows: Participant[] = [
  { id: 1, name: 'Ada Lovelace', score: 98, status: 'Submitted' },
  { id: 2, name: 'Grace Hopper', score: 94, status: 'Submitted' },
  { id: 3, name: 'Margaret Hamilton', score: 91, status: 'In review' },
];

const meta = {
  title: 'Data Display/Table',
  component: DataTable<Participant>,
  args: {
    columns,
    rows,
    pageSize: 20,
    striped: true,
    totalRecords: 128,
    caption: 'Participants',
    onDataRequest: fn(),
  },
  argTypes: {
    rowActions: { control: false },
    rowHighlighted: { control: false },
    getRowKey: { control: false },
    apiRef: { control: false },
    onDataRequest: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Server-driven table: the consumer owns the rows and answers `onDataRequest`, which fires on mount and whenever the page, page size, sort or (300 ms debounced) search term changes. Sorting, searching and paging never touch the rows locally. Columns can sort, hide below a breakpoint, wrap their heading, show a help hint and render custom cells. States: loading (busy overlay, paginator disabled), empty, highlighted rows. `apiRef.resetPage()` returns to the first page for consumers that filter on their own.',
      },
    },
  },
} satisfies Meta<typeof DataTable<Participant>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RowActions: Story = {
  args: {
    rowActions: (participant) => (
      <Button size="small" type="button" aria-label={`Inspect ${participant.name}`}>
        Inspect
      </Button>
    ),
  },
};

export const InitiallySorted: Story = {
  args: { initialSortDirection: 'asc', initialSortField: 'name' },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Empty: Story = {
  args: { rows: [], totalRecords: 0 },
};

/** One row singled out by more than colour: a tinted background and a heavier weight. */
export const HighlightedRow: Story = {
  args: { rowHighlighted: (participant) => participant.id === 2 },
};

/** A help icon with a tooltip explains a column whose heading alone is ambiguous. */
export const HeaderHint: Story = {
  args: {
    columns: [
      { field: 'name', header: 'Participant', sort: true },
      { field: 'score', header: 'Score', sort: true, headerTooltip: 'Points out of 100, rounded to a whole number' },
      { field: 'status', header: 'Status' },
    ],
  },
};

/** Scrolls inside a bounded area and keeps the header row in view. */
export const Scrollable: Story = {
  args: {
    scrollable: true,
    scrollHeight: '12rem',
    rows: Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      name: `Participant ${index + 1}`,
      score: 100 - index,
      status: index % 2 ? 'In review' : 'Submitted',
    })),
  },
};

export const CompactViewport: Story = {
  parameters: {
    viewport: { options: { compact: { name: 'Compact', styles: { width: '360px', height: '640px' } } } },
  },
  globals: { viewport: { value: 'compact', isRotated: false } },
};
