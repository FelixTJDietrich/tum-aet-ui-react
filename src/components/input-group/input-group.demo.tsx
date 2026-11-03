import { Input } from '../input/input';
import { InputNumber } from '../input-number/input-number';
import { InputGroup, InputGroupAddon } from './input-group';

export default function InputGroupDemo() {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <InputGroup>
        <InputGroupAddon>€</InputGroupAddon>
        <Input aria-label="Budget" inputMode="decimal" placeholder="0" />
        <InputGroupAddon>EUR</InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <Input aria-label="Host" placeholder="example.org" />
      </InputGroup>
      <InputGroup>
        <InputNumber aria-label="Amount" showButtons />
        <InputGroupAddon>kg</InputGroupAddon>
      </InputGroup>
    </div>
  );
}
