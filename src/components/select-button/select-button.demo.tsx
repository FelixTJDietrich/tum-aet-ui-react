import { SelectButton } from './select-button';

export default function SelectButtonDemo() {
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <SelectButton aria-label="View" options={['List', 'Grid', 'Table']} defaultValue="List" />
      <SelectButton
        aria-label="Required choice"
        size="small"
        allowEmpty={false}
        options={['Day', 'Week', 'Month']}
        defaultValue="Week"
      />
      <SelectButton
        aria-label="Days"
        size="large"
        multiple
        options={[
          { label: 'Mon', value: 1 },
          { label: 'Tue', value: 2 },
          { label: 'Wed', value: 3 },
        ]}
        optionLabel="label"
        optionValue="value"
        defaultValue={[1]}
      />
      <SelectButton aria-label="Disabled" disabled options={['A', 'B']} />
    </div>
  );
}
