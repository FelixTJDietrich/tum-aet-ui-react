import { useState } from 'react';
import { Checkbox } from './checkbox';

export default function CheckboxDemo() {
  const [items, setItems] = useState([true, false, false]);
  const all = items.every(Boolean);
  const some = items.some(Boolean);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox checked={all} indeterminate={some && !all} onChange={(c) => setItems(items.map(() => c))} /> All
      </label>
      {items.map((checked, i) => (
        <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginInlineStart: 24 }}>
          <Checkbox checked={checked} onChange={(c) => setItems(items.map((v, j) => (j === i ? c : v)))} /> Item {i + 1}
        </label>
      ))}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox disabled /> Disabled
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox disabled defaultChecked /> Disabled checked
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox invalid /> Invalid
      </label>
    </div>
  );
}
