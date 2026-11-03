import { useState } from 'react';
import { InputNumber } from './input-number';

export default function InputNumberDemo() {
  const [value, setValue] = useState<number | null>(1234);
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <InputNumber aria-label="Integer" value={value} onChange={setValue} />
      <InputNumber aria-label="Stepper" showButtons min={0} max={10} defaultValue={5} />
      <InputNumber aria-label="Price" maxFractionDigits={2} prefix="€ " defaultValue={12.5} />
      <InputNumber aria-label="Weight" suffix=" kg" locale="de-DE" maxFractionDigits={1} defaultValue={70.5} />
      <InputNumber aria-label="Invalid" invalid defaultValue={1} />
      <InputNumber aria-label="Disabled" disabled defaultValue={1} />
      <InputNumber aria-label="Fluid" fluid showButtons />
      <span>Value: {String(value)}</span>
    </div>
  );
}
