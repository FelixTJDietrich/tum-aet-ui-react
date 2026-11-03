import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { SortableColumnHeader, Table, type TableProps, type TableSortEvent } from './table';

function Participants({ sortField: initialField, sortOrder: initialOrder, onSortChange, ...rest }: TableProps) {
  const [sort, setSort] = useState({ field: initialField, order: initialOrder ?? 1 });
  return (
    <Table
      aria-label="Participants"
      {...rest}
      sortField={sort.field}
      sortOrder={sort.order}
      onSortChange={(event: TableSortEvent) => {
        setSort({ field: event.field, order: event.order });
        onSortChange?.(event);
      }}
    >
      <thead>
        <tr>
          <SortableColumnHeader field="name">Participant</SortableColumnHeader>
          <SortableColumnHeader field="score">Score</SortableColumnHeader>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Ada Lovelace</td>
          <td>98</td>
          <td>Submitted</td>
        </tr>
        <tr>
          <td>Grace Hopper</td>
          <td>94</td>
          <td>Submitted</td>
        </tr>
        <tr>
          <td>Margaret Hamilton</td>
          <td>91</td>
          <td>In review</td>
        </tr>
      </tbody>
    </Table>
  );
}

const meta = {
  title: 'Data Display/Native Table',
  component: Table,
  subcomponents: { SortableColumnHeader },
  args: {
    rowHover: true,
    size: 'normal',
    sortField: 'name',
    sortOrder: 1,
    striped: true,
    onSortChange: fn(),
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'normal', 'large'] },
    sortOrder: { control: 'inline-radio', options: [1, -1] },
    onSortChange: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Styles a plain native `<table>`. Give it a caption or `aria-label` and use `<th scope="col">` for headings. `SortableColumnHeader` renders a `<th>` with a button, sets `aria-sort` from the table\'s `sortField` / `sortOrder` (`1` ascending, `-1` descending) and requests the next order through `onSortChange`. The consumer sorts the rows.',
      },
    },
  },
  render: (args) => <Participants {...args} />,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const participantHeader = canvas.getByRole('columnheader', { name: /Participant/ });
    await expect(participantHeader).toHaveAttribute('aria-sort', 'ascending');
  },
};

export const Small: Story = { args: { size: 'small' } };

export const Large: Story = { args: { size: 'large' } };

/** The header row stays at the top of a scrolling parent. */
export const Scrollable: Story = {
  args: { scrollable: true },
  render: (args) => (
    <div style={{ maxHeight: '8rem', overflow: 'auto' }}>
      <Participants {...args} />
    </div>
  ),
};
