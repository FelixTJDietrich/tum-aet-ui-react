import { useState } from 'react';
import { Button } from '../button';
import { EllipsisIcon } from '../../internal/icons';
import { Menu, MenuItem } from './menu';

export default function MenuDemo() {
  const [last, setLast] = useState('Nothing chosen yet');
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16 }}>
      <Menu trigger={<Button variant="outlined">Actions</Button>} aria-label="Actions">
        <MenuItem onClick={() => setLast('Rename')}>Rename</MenuItem>
        <MenuItem onClick={() => setLast('Duplicate')}>Duplicate</MenuItem>
        <MenuItem href="https://tum.de" target="_blank" rel="noreferrer">
          Open TUM website
        </MenuItem>
        <MenuItem disabled>Archive (disabled)</MenuItem>
        <MenuItem onClick={() => setLast('Delete')}>Delete</MenuItem>
      </Menu>
      <Menu
        trigger={<Button variant="text" rounded aria-label="More" icon={<EllipsisIcon />} />}
        placement="bottom-end"
        aria-label="More"
      >
        <MenuItem onClick={() => setLast('One')}>One</MenuItem>
        <MenuItem onClick={() => setLast('Two')}>Two</MenuItem>
      </Menu>
      <span>{last}</span>
    </div>
  );
}
