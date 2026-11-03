import { ProgressBar } from './progress-bar';

export default function ProgressBarDemo() {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
      <ProgressBar aria-label="Primary" value={60} />
      <ProgressBar aria-label="Success" value={100} severity="success" />
      <ProgressBar aria-label="Warn" value={35} severity="warn" />
      <ProgressBar aria-label="Danger" value={15} severity="danger" />
      <ProgressBar aria-label="Info" value={75} severity="info" unit=" of 100" />
      <ProgressBar aria-label="Small" value={50} size="small" />
      <ProgressBar aria-label="No value" value={50} showValue={false} />
      <ProgressBar aria-label="Indeterminate" indeterminate />
    </div>
  );
}
