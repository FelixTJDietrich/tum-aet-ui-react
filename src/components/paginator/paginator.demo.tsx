import { useState } from 'react';
import { Paginator } from './paginator';

export default function PaginatorDemo() {
  const [page, setPage] = useState(2);
  const [size, setSize] = useState(10);
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <Paginator
        totalRecords={247}
        page={page}
        pageSize={size}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
      />
      <Paginator
        totalRecords={30}
        defaultPageSize={10}
        showRowsPerPage={false}
        aria-label="Uncontrolled, no rows per page"
      />
      <Paginator totalRecords={100} defaultPageSize={10} disabled aria-label="Disabled" />
    </div>
  );
}
