import { useState } from 'react';
import { SearchField } from './search-field';

export default function SearchFieldDemo() {
  const [term, setTerm] = useState('');
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <SearchField value={term} onChange={setTerm} />
      <SearchField size="small" placeholder="Small" />
      <SearchField size="large" placeholder="Large" />
      <SearchField disabled defaultValue="Disabled" />
      <span>Term: {term}</span>
    </div>
  );
}
