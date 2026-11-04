import { RadioButton, RadioGroup } from './radio-button';

export default function RadioButtonDemo() {
  return (
    <RadioGroup aria-label="Size" defaultValue="m">
      {['s', 'm', 'l'].map((v) => (
        <label key={v} htmlFor={`radio-demo-${v}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <RadioButton id={`radio-demo-${v}`} value={v} /> Size {v.toUpperCase()}
        </label>
      ))}
      <label htmlFor="radio-demo-xl" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioButton id="radio-demo-xl" value="xl" disabled /> Disabled
      </label>
    </RadioGroup>
  );
}
