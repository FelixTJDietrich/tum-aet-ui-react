import { useState } from 'react';
import { Chip } from './chip';

export default function ChipDemo() {
  const [items, setItems] = useState(['Angular', 'React', 'Vue']);
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Chip label="Plain" />
        <Chip size="small">Small</Chip>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {items.map((item) => (
          <Chip
            key={item}
            label={item}
            removable
            removeLabel={`Remove ${item}`}
            onRemove={() => setItems((all) => all.filter((i) => i !== item))}
          />
        ))}
        {items.map((item) => (
          <Chip key={`s-${item}`} size="small" label={item} removable removeLabel={`Remove small ${item}`} />
        ))}
      </div>
    </>
  );
}
