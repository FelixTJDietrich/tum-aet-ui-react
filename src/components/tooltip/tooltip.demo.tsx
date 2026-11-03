import { Button } from '../button';
import { Tooltip } from './tooltip';

export default function TooltipDemo() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: 60, flexWrap: 'wrap' }}>
      {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
        <Tooltip key={placement} content={`Tooltip on the ${placement}`} placement={placement}>
          <Button variant="outlined">{placement}</Button>
        </Tooltip>
      ))}
      <Tooltip content={['Name is required', 'Email must be valid', 'Password is too short']}>
        <Button severity="secondary">List</Button>
      </Tooltip>
      <Tooltip content={<strong>Rich node</strong>}>
        <Button severity="secondary">Node</Button>
      </Tooltip>
      <Tooltip content="Instant" showDelay={0} hideDelay={0}>
        <Button severity="secondary">No delay</Button>
      </Tooltip>
    </div>
  );
}
