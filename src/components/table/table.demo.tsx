import { useMemo, useState } from 'react';
import { Button } from '../button';
import { DataTable } from './data-table';
import { SortableColumnHeader, Table } from './table';
import type { ColumnDef, TableQuery } from './table-utils';

interface Person {
  id: number;
  name: string;
  role: string;
  team: { name: string };
}
const roles = ['Admin', 'Tutor', 'Student', 'Instructor'];
const all: Person[] = Array.from({ length: 87 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  role: roles[i % 4]!,
  team: { name: `Team ${(i % 5) + 1}` },
}));

const columns: ColumnDef<Person>[] = [
  { field: 'id', header: 'ID', sort: true, width: '5rem' },
  { field: 'name', header: 'Name', sort: true },
  { field: 'role', header: 'Role', sort: true, headerTooltip: 'Role within the course' },
  { field: 'team.name', header: 'Team', hideBelow: 'md' },
  { header: 'Initial', cell: ({ data }) => <strong>{data.name[0]}</strong> },
];

function serverQuery(q: TableQuery) {
  let rows = all.filter((p) => !q.searchTerm || p.name.toLowerCase().includes(q.searchTerm.toLowerCase()));
  if (q.sort) {
    const { field, direction } = q.sort;
    rows = [...rows].sort(
      (a, b) =>
        String((a as never)[field]).localeCompare(String((b as never)[field]), undefined, { numeric: true }) *
        (direction === 'asc' ? 1 : -1),
    );
  }
  return { total: rows.length, rows: rows.slice(q.pageIndex * q.pageSize, (q.pageIndex + 1) * q.pageSize) };
}

export default function TableDemo() {
  const [result, setResult] = useState({ total: 0, rows: [] as Person[] });
  const [sortField, setSortField] = useState('name');
  const [order, setOrder] = useState(1);
  const sorted = useMemo(() => [...all.slice(0, 5)].sort((a, b) => a.name.localeCompare(b.name) * order), [order]);
  return (
    <div style={{ display: 'grid', gap: 32 }}>
      <DataTable
        caption="People"
        columns={columns}
        rows={result.rows}
        totalRecords={result.total}
        pageSize={10}
        striped
        initialSortField="name"
        rowHighlighted={(p) => p.id === 3}
        rowActions={(p) => (
          <Button size="small" variant="text" onClick={() => alert(p.name)}>
            Open
          </Button>
        )}
        onDataRequest={(q) => setResult(serverQuery(q))}
      />
      <Table
        aria-label="Native table"
        striped
        rowHover
        sortField={sortField}
        sortOrder={order}
        onSortChange={(e) => {
          setSortField(e.field);
          setOrder(e.order);
        }}
      >
        <thead>
          <tr>
            <SortableColumnHeader field="name">Name</SortableColumnHeader>
            <th scope="col">Role</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.role}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
