import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { SearchIcon } from '../../internal/icons';
import { Input } from '../input/input';
import { IconField } from './icon-field';

describe('IconField', () => {
  it('renders a decorative icon and sets position data attributes', () => {
    const { container } = render(
      <IconField icon={<SearchIcon />} iconPosition="right">
        <Input aria-label="Find" />
      </IconField>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-position', 'right');
    expect(root).toHaveAttribute('data-has-icon');
    expect(container.querySelector('.tumaet-ui-input-icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('omits the icon wrapper and data-has-icon without an icon', () => {
    const { container } = render(
      <IconField>
        <Input aria-label="Find" />
      </IconField>,
    );
    expect(container.firstElementChild).not.toHaveAttribute('data-has-icon');
    expect(container.querySelector('.tumaet-ui-input-icon')).toBeNull();
  });

  it('keeps the input reachable by keyboard', async () => {
    render(
      <IconField icon={<SearchIcon />}>
        <Input aria-label="Find" />
      </IconField>,
    );
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'Find' })).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <IconField icon={<SearchIcon />}>
        <Input aria-label="Find" />
      </IconField>,
    );
    await expectNoA11yViolations(container);
  });
});
