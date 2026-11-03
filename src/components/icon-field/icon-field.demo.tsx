import { SearchIcon, CalendarIcon } from '../../internal/icons';
import { Input } from '../input/input';
import { IconField } from './icon-field';

export default function IconFieldDemo() {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <IconField icon={<SearchIcon />}>
        <Input aria-label="Left icon" placeholder="Icon left" />
      </IconField>
      <IconField icon={<CalendarIcon />} iconPosition="right">
        <Input aria-label="Right icon" placeholder="Icon right" />
      </IconField>
    </div>
  );
}
