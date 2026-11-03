import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { DataTable } from './data-table';
import { SortableColumnHeader, Table } from './table';
import { ariaSortFor, formatCellValue, getByPath, lastPageIndex, nextSort, type ColumnDef } from './table-utils';

interface Row {
  id: number;
  name: string;
  owner: { name: string };
}
const rows: Row[] = [
  { id: 1, name: 'Alpha', owner: { name: 'Ada' } },
  { id: 2, name: 'Beta', owner: { name: 'Bob' } },
];
const columns: ColumnDef<Row>[] = [
  { field: 'id', header: 'ID', sort: true },
  { field: 'name', header: 'Name', sort: true },
  { field: 'owner.name', header: 'Owner', headerTooltip: 'Who owns it' },
];

describe('table utils', () => {
  it('reads nested paths', () => {
    expect(getByPath({ a: { b: [{ c: 5 }] } }, 'a.b[0].c')).toBe(5);
    expect(getByPath({ a: null }, 'a.b')).toBeUndefined();
  });
  it('toggles sort direction and restarts on a new field', () => {
    const asc = nextSort(undefined, 'a');
    expect(asc).toEqual({ field: 'a', direction: 'asc' });
    const desc = nextSort(asc, 'a');
    expect(desc.direction).toBe('desc');
    expect(nextSort(desc, 'a').direction).toBe('asc');
    expect(nextSort(desc, 'b')).toEqual({ field: 'b', direction: 'asc' });
    expect(ariaSortFor(desc, 'a')).toBe('descending');
    expect(ariaSortFor(asc, 'a')).toBe('ascending');
    expect(ariaSortFor(asc, 'b')).toBe('none');
  });
  it('computes the last page and formats values', () => {
    expect(lastPageIndex(0, 10)).toBe(0);
    expect(lastPageIndex(101, 10)).toBe(10);
    expect(lastPageIndex(5, 0)).toBe(4);
    expect(formatCellValue(null)).toBe('');
    expect(formatCellValue(3)).toBe('3');
  });
});

describe('DataTable', () => {
  it('renders headers with scope, nested values, caption and the empty state', () => {
    const { rerender } = render(<DataTable caption="Things" columns={columns} rows={rows} totalRecords={2} />);
    expect(screen.getByRole('table', { name: 'Things' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('scope', 'col');
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
    rerender(<DataTable caption="Things" columns={columns} rows={[]} totalRecords={0} />);
    expect(screen.getAllByText('No results found')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('No results found');
  });

  it('requests data on mount with the initial sort and then on sort clicks, keyboard operable', async () => {
    const onDataRequest = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        totalRecords={2}
        initialSortField="name"
        initialSortDirection="desc"
        onDataRequest={onDataRequest}
      />,
    );
    expect(onDataRequest).toHaveBeenCalledTimes(1);
    expect(onDataRequest).toHaveBeenLastCalledWith({
      pageIndex: 0,
      pageSize: 50,
      sort: { field: 'name', direction: 'desc' },
      searchTerm: undefined,
    });
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveAttribute('aria-sort', 'none');
    expect(screen.getByRole('columnheader', { name: /Owner/ })).not.toHaveAttribute('aria-sort');

    await userEvent.click(within(nameHeader).getByRole('button'));
    expect(onDataRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: { field: 'name', direction: 'asc' } }),
    );
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    within(screen.getByRole('columnheader', { name: 'ID' }))
      .getByRole('button')
      .focus();
    await userEvent.keyboard('{Enter}');
    expect(onDataRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: { field: 'id', direction: 'asc' } }),
    );
  });

  it('pages and resets to the first page when sorting or changing the page size', async () => {
    const onDataRequest = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        totalRecords={95}
        pageSize={10}
        onDataRequest={onDataRequest}
        showSearch={false}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onDataRequest).toHaveBeenLastCalledWith(expect.objectContaining({ pageIndex: 1, pageSize: 10 }));
    await userEvent.click(screen.getByRole('button', { name: 'Last page' }));
    expect(onDataRequest).toHaveBeenLastCalledWith(expect.objectContaining({ pageIndex: 9 }));
    await userEvent.click(within(screen.getByRole('columnheader', { name: 'ID' })).getByRole('button'));
    expect(onDataRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageIndex: 0, sort: { field: 'id', direction: 'asc' } }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '20');
    expect(onDataRequest).toHaveBeenLastCalledWith(expect.objectContaining({ pageIndex: 0, pageSize: 20 }));
    expect(screen.getByText('Showing 1 to 20 of 95')).toBeInTheDocument();
  });

  it('debounces the search and trims the term', () => {
    vi.useFakeTimers();
    try {
      const onDataRequest = vi.fn();
      render(<DataTable columns={columns} rows={rows} totalRecords={2} onDataRequest={onDataRequest} />);
      onDataRequest.mockClear();
      const input = screen.getByRole('searchbox', { name: 'Search' });
      fireEvent.change(input, { target: { value: ' al' } });
      fireEvent.change(input, { target: { value: ' alp ' } });
      act(() => void vi.advanceTimersByTime(299));
      expect(onDataRequest).not.toHaveBeenCalled();
      act(() => void vi.advanceTimersByTime(1));
      expect(onDataRequest).toHaveBeenCalledTimes(1);
      expect(onDataRequest).toHaveBeenLastCalledWith(expect.objectContaining({ searchTerm: 'alp', pageIndex: 0 }));
    } finally {
      vi.useRealTimers();
    }
  });

  it('steps back when the result set shrinks below the current page', async () => {
    const onDataRequest = vi.fn();
    const { rerender } = render(
      <DataTable columns={columns} rows={rows} totalRecords={95} pageSize={10} onDataRequest={onDataRequest} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Last page' }));
    rerender(<DataTable columns={columns} rows={rows} totalRecords={25} pageSize={10} onDataRequest={onDataRequest} />);
    expect(onDataRequest).toHaveBeenLastCalledWith(expect.objectContaining({ pageIndex: 2 }));
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  it('supports custom cells, row actions, highlighting and the loading state', () => {
    render(
      <DataTable
        columns={[
          { field: 'name', header: 'Name', cell: ({ value, rowIndex }) => <em>{`${rowIndex}:${String(value)}`}</em> },
        ]}
        rows={rows}
        totalRecords={2}
        rowActions={(row) => <button>Edit {row.name}</button>}
        rowHighlighted={(row) => row.id === 2}
        loading
      />,
    );
    expect(screen.getByText('1:Beta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByText('1:Beta').closest('tr')).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('exposes the help hint as title and name', () => {
    render(<DataTable columns={columns} rows={rows} totalRecords={2} />);
    expect(screen.getByRole('button', { name: 'Who owns it' })).toHaveAttribute('title', 'Who owns it');
  });

  it('can reset the page through apiRef', async () => {
    const onDataRequest = vi.fn();
    let api: { resetPage: () => void } | null = null;
    render(
      <DataTable
        apiRef={(a) => {
          api = a;
        }}
        columns={columns}
        rows={rows}
        totalRecords={95}
        pageSize={10}
        onDataRequest={onDataRequest}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    act(() => api!.resetPage());
    expect(onDataRequest).toHaveBeenLastCalledWith(expect.objectContaining({ pageIndex: 0 }));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <DataTable
        caption="Things"
        columns={columns}
        rows={rows}
        totalRecords={2}
        rowActions={() => <button>Go</button>}
      />,
    );
    await expectNoA11yViolations(container);
  });
});

describe('Table and SortableColumnHeader', () => {
  it('sets aria-sort from the table and requests the toggled order', async () => {
    const onSortChange = vi.fn();
    render(
      <Table aria-label="Native" sortField="name" sortOrder={1} defaultSortOrder={-1} onSortChange={onSortChange}>
        <thead>
          <tr>
            <SortableColumnHeader field="name">Name</SortableColumnHeader>
            <SortableColumnHeader field="age">Age</SortableColumnHeader>
            <SortableColumnHeader field="x" disabled>
              Locked
            </SortableColumnHeader>
          </tr>
        </thead>
        <tbody />
      </Table>,
    );
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Age' })).toHaveAttribute('aria-sort', 'none');
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(onSortChange).toHaveBeenLastCalledWith({ field: 'name', order: -1 });
    await userEvent.click(screen.getByRole('button', { name: 'Age' }));
    expect(onSortChange).toHaveBeenLastCalledWith({ field: 'age', order: -1 });
    expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled();
  });

  it('reports descending and exposes style variants as data attributes', () => {
    render(
      <Table aria-label="Native" size="small" striped rowHover scrollable sortField="a" sortOrder={-1}>
        <thead>
          <tr>
            <SortableColumnHeader field="a">A</SortableColumnHeader>
          </tr>
        </thead>
      </Table>,
    );
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('table')).toMatchObject({
      dataset: { size: 'small', striped: 'true', rowHover: 'true', scrollable: 'true' },
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Table aria-label="Native" sortField="a">
        <thead>
          <tr>
            <SortableColumnHeader field="a">A</SortableColumnHeader>
            <th scope="col">B</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>2</td>
          </tr>
        </tbody>
      </Table>,
    );
    await expectNoA11yViolations(container);
  });
});
