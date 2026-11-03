import { Button } from '../button/button';
import { SearchIcon } from '../../internal/icons';
import { EmptyState } from './empty-state';

export default function EmptyStateDemo() {
  return (
    <div style={{ display: 'grid', gap: 32 }}>
      {(['outlined', 'solid', 'plain'] as const).map((variant) => (
        <EmptyState
          key={variant}
          variant={variant}
          icon={<SearchIcon />}
          title={`No results (${variant})`}
          description="Try another search term or reset the filters."
          actions={<Button>Reset filters</Button>}
          documentation={<a href="https://example.com/docs">Read the documentation</a>}
        />
      ))}
      <EmptyState title="Nothing here yet" />
    </div>
  );
}
