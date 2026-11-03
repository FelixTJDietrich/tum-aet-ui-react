import { useState } from 'react';
import { Button } from '../button';
import { Dialog, type DialogSize } from './dialog';

export default function DialogDemo() {
  const [size, setSize] = useState<DialogSize | 'content' | null>(null);
  const close = () => setSize(null);
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['content', 'small', 'medium', 'large', 'full'] as const).map((s) => (
          <Button key={s} variant="outlined" onClick={() => setSize(s)}>
            Open {s}
          </Button>
        ))}
      </div>
      <Dialog
        open={size !== null}
        onOpenChange={(open) => !open && close()}
        header={`Dialog (${size})`}
        size={size === 'content' ? undefined : (size ?? undefined)}
        dismissableMask
        footer={
          <>
            <Button severity="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Save</Button>
          </>
        }
      >
        <p>
          Escape, the close button and a click on the backdrop close this dialog. Focus stays inside and returns to the
          button.
        </p>
        {size === 'full' && Array.from({ length: 40 }, (_, i) => <p key={i}>Scrolling content line {i + 1}</p>)}
      </Dialog>
    </>
  );
}
