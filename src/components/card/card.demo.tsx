import { Button } from '../button/button';
import { Card } from './card';

export default function CardDemo() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <Card
        style={{ width: 320 }}
        header="Title"
        subheader="Subtitle"
        footer={
          <div>
            <Button size="small">Action</Button>
          </div>
        }
      >
        Card content goes here.
      </Card>
      <Card
        style={{ width: 320 }}
        media={
          <div
            style={{
              height: 80,
              background: 'var(--tumaet-ui-primary-color)',
              borderStartStartRadius: 'inherit',
              borderStartEndRadius: 'inherit',
            }}
          />
        }
      >
        Card with media and no header.
      </Card>
    </div>
  );
}
