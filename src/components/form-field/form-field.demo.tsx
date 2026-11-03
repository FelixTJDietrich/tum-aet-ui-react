import { useState } from 'react';
import { Checkbox } from '../checkbox/checkbox';
import { Input } from '../input/input';
import { InputNumber } from '../input-number/input-number';
import { FormField } from './form-field';

export default function FormFieldDemo() {
  const [login, setLogin] = useState('');
  const invalid = login.length > 0 && login.length < 3;
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
      <FormField label="Login" required hint="At least 3 characters" invalid={invalid} error="Too short">
        <Input value={login} onChange={(e) => setLogin(e.target.value)} required />
      </FormField>
      <FormField label="Points" hint="Between 0 and 100">
        <InputNumber min={0} max={100} />
      </FormField>
      <FormField label="Accept terms">
        <Checkbox />
      </FormField>
    </div>
  );
}
