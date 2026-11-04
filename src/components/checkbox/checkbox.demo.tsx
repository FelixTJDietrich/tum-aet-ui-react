import { useState } from 'react';
import { Checkbox } from './checkbox';

export default function CheckboxDemo() {
  const [items, setItems] = useState([
    { id: 'a', checked: true },
    { id: 'b', checked: false },
    { id: 'c', checked: false },
  ]);
  const all = items.every((item) => item.checked);
  const some = items.some((item) => item.checked);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label htmlFor="checkbox-demo-all" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox
          id="checkbox-demo-all"
          checked={all}
          indeterminate={some ? !all : false}
          onChange={(c) => setItems(items.map((item) => ({ ...item, checked: c })))}
        />{' '}
        All
      </label>
      {items.map(({ id, checked }, i) => (
        <label
          key={id}
          htmlFor={`checkbox-demo-${id}`}
          style={{ display: 'flex', gap: 8, alignItems: 'center', marginInlineStart: 24 }}
        >
          <Checkbox
            id={`checkbox-demo-${id}`}
            checked={checked}
            onChange={(c) => setItems(items.map((item, j) => (j === i ? { ...item, checked: c } : item)))}
          />{' '}
          Item {i + 1}
        </label>
      ))}
      <label htmlFor="checkbox-demo-disabled" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox id="checkbox-demo-disabled" disabled /> Disabled
      </label>
      <label htmlFor="checkbox-demo-disabled-checked" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox id="checkbox-demo-disabled-checked" disabled defaultChecked /> Disabled checked
      </label>
      <label htmlFor="checkbox-demo-invalid" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox id="checkbox-demo-invalid" invalid /> Invalid
      </label>
    </div>
  );
}
