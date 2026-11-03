import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { List, ListItem, ListItemAction } from './list';

describe('List', () => {
  it('renders a named native list with items', () => {
    render(
      <List aria-label="Settings">
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </List>,
    );
    expect(screen.getByRole('list', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders actions as buttons or links, with aria-current when active', async () => {
    const onClick = vi.fn();
    render(
      <List aria-label="Nav">
        <ListItem>
          <ListItemAction onClick={onClick}>Act</ListItemAction>
        </ListItem>
        <ListItem>
          <ListItemAction href="/a" active>
            Go
          </ListItemAction>
        </ListItem>
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Act' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link).toHaveAttribute('href', '/a');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(button).not.toHaveAttribute('aria-current');
  });

  it('activates a row action with the keyboard', async () => {
    const onClick = vi.fn();
    render(
      <List aria-label="x">
        <ListItem>
          <ListItemAction onClick={onClick}>Act</ListItemAction>
        </ListItem>
      </List>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('marks inline items', () => {
    render(
      <List aria-label="x">
        <ListItem inline>Row</ListItem>
      </List>,
    );
    expect(screen.getByRole('listitem')).toHaveAttribute('data-inline', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <List aria-label="Settings">
        <ListItem>
          <ListItemAction active>One</ListItemAction>
        </ListItem>
        <ListItem inline>Two</ListItem>
      </List>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('ListItemAction aria-current', () => {
  it('keeps a caller supplied aria-current on an inactive action and sets page when active', () => {
    render(
      <List aria-label="x">
        <ListItem>
          <ListItemAction href="/a" aria-current="step">
            A
          </ListItemAction>
        </ListItem>
        <ListItem>
          <ListItemAction href="/b" active>
            B
          </ListItemAction>
        </ListItem>
      </List>,
    );
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('link', { name: 'B' })).toHaveAttribute('aria-current', 'page');
  });
});
