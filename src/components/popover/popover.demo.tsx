import { Button } from '../button';
import { Popover } from './popover';

export default function PopoverDemo() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: 80, flexWrap: 'wrap' }}>
      {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
        <Popover
          key={placement}
          placement={placement}
          aria-label={`Details (${placement})`}
          trigger={<Button variant="outlined">{placement}</Button>}
        >
          <p style={{ margin: 0 }}>Rich content with an action.</p>
          <Button size="small" style={{ marginTop: 8 }}>
            Do it
          </Button>
        </Popover>
      ))}
      <Popover padding="none" aria-label="Unpadded" trigger={<Button variant="text">No padding</Button>}>
        <div style={{ padding: 8 }}>Content without panel padding</div>
      </Popover>
    </div>
  );
}
