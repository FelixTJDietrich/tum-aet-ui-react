import { ProgressSpinner } from './progress-spinner';

export default function ProgressSpinnerDemo() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <ProgressSpinner aria-label="Loading" />
      <ProgressSpinner aria-label="Loading small" style={{ width: 32, height: 32 }} />
    </div>
  );
}
