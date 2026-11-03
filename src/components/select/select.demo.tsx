import { useState } from 'react';
import { Select } from './select';

const countries = [
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'it', name: 'Italy' },
  { code: 'es', name: 'Spain' },
  { code: 'pt', name: 'Portugal' },
  { code: 'nl', name: 'Netherlands' },
];

export default function SelectDemo() {
  const [country, setCountry] = useState<unknown>('de');
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 320 }}>
      <Select
        aria-label="Country"
        options={countries}
        optionLabel="name"
        optionValue="code"
        value={country}
        onChange={setCountry}
        showClear
        placeholder="Select a country"
      />
      <Select
        aria-label="Country with filter"
        options={countries}
        optionLabel="name"
        optionValue="code"
        filter
        placeholder="Filterable"
      />
      <Select aria-label="Small" size="small" options={['One', 'Two']} placeholder="Small" />
      <Select aria-label="Large" size="large" options={['One', 'Two']} placeholder="Large" />
      <Select aria-label="Invalid" options={['One', 'Two']} aria-invalid placeholder="Invalid" />
      <Select aria-label="Disabled" options={['One', 'Two']} disabled defaultValue="One" />
      <Select aria-label="Empty" options={[]} placeholder="No options" />
      <p>Selected: {String(country)}</p>
    </div>
  );
}
