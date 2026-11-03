import { useState } from 'react';
import { InfoIcon, WarningIcon, CircleCheckIcon, CircleXIcon } from '../../internal/icons';
import { Message } from './message';

export default function MessageDemo() {
  const [visible, setVisible] = useState(true);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Message severity="info" icon={<InfoIcon />}>
        Information
      </Message>
      <Message severity="success" icon={<CircleCheckIcon />}>
        Saved
      </Message>
      <Message severity="warn" icon={<WarningIcon />}>
        Careful
      </Message>
      <Message severity="error" icon={<CircleXIcon />}>
        Something failed (role=alert)
      </Message>
      <Message severity="secondary">Secondary</Message>
      <Message severity="contrast">Contrast</Message>
      {visible && (
        <Message severity="info" dismissible onDismiss={() => setVisible(false)}>
          Dismissible
        </Message>
      )}
    </div>
  );
}
