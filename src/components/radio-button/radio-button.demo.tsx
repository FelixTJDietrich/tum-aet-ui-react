import { RadioButton, RadioGroup } from './radio-button';

export default function RadioButtonDemo() {
  return (
    <RadioGroup aria-label="Size" defaultValue="m">
      {['s', 'm', 'l'].map((v) => (
        <label key={v} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <RadioButton value={v} /> Size {v.toUpperCase()}
        </label>
      ))}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioButton value="xl" disabled /> Disabled
      </label>
    </RadioGroup>
  );
}
