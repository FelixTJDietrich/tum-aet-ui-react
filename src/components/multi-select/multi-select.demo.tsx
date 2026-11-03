import { useState } from 'react';
import { MultiSelect } from './multi-select';

const cities = ['Munich', 'Berlin', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart'];

export default function MultiSelectDemo() {
  const [value, setValue] = useState<unknown[]>(['Munich', 'Berlin']);
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 320 }}>
      <MultiSelect aria-label="Cities" options={cities} value={value} onChange={setValue} placeholder="Select cities" />
      <MultiSelect aria-label="Many" options={cities} defaultValue={cities.slice(0, 4)} />
      <MultiSelect aria-label="Outlined" variant="outlined" options={cities} placeholder="Outlined" />
      <MultiSelect aria-label="Small" size="small" options={cities} placeholder="Small" />
      <MultiSelect aria-label="Large" size="large" options={cities} placeholder="Large" />
      <MultiSelect aria-label="Invalid" aria-invalid options={cities} placeholder="Invalid" />
      <MultiSelect aria-label="Disabled" disabled options={cities} defaultValue={['Munich']} />
      <p>Selected: {value.join(', ')}</p>
    </div>
  );
}
