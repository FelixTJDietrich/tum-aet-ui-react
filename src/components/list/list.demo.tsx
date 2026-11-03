import { useState } from 'react';
import { List, ListItem, ListItemAction } from './list';

const sections = ['Account information', 'Notifications', 'Security'];

export default function ListDemo() {
  const [active, setActive] = useState(sections[0]);
  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 360 }}>
      <List aria-label="User settings">
        {sections.map((s) => (
          <ListItem key={s}>
            <ListItemAction active={s === active} onClick={() => setActive(s)}>
              {s}
            </ListItemAction>
          </ListItem>
        ))}
        <ListItem>Joined in 2021</ListItem>
      </List>
      <List aria-label="Record">
        <ListItem inline>
          <span>Name</span>
          <strong>Ada Lovelace</strong>
        </ListItem>
        <ListItem inline>
          <span>Role</span>
          <strong>Admin</strong>
        </ListItem>
        <ListItem>
          <ListItemAction href="#docs">Documentation (link)</ListItemAction>
        </ListItem>
      </List>
    </div>
  );
}
