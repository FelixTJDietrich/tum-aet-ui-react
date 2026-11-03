import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Input } from '../input/input';
import { InputGroup, InputGroupAddon } from './input-group';

describe('InputGroup', () => {
  it('renders addons around the input in order', () => {
    const { container } = render(
      <InputGroup>
        <InputGroupAddon>€</InputGroupAddon>
        <Input aria-label="Budget" />
        <InputGroupAddon>EUR</InputGroupAddon>
      </InputGroup>,
    );
    const group = container.firstElementChild!;
    expect(group).toHaveClass('tumaet-ui-input-group');
    expect([...group.children].map((c) => c.className.split(' ')[0])).toEqual([
      'tumaet-ui-input-group-addon',
      'tumaet-ui-input',
      'tumaet-ui-input-group-addon',
    ]);
  });

  it('lets the input be reached and typed in by keyboard', async () => {
    render(
      <InputGroup>
        <InputGroupAddon>€</InputGroupAddon>
        <Input aria-label="Budget" />
      </InputGroup>,
    );
    await userEvent.tab();
    await userEvent.keyboard('12');
    expect(screen.getByRole('textbox', { name: 'Budget' })).toHaveValue('12');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <InputGroup>
        <InputGroupAddon>€</InputGroupAddon>
        <Input aria-label="Budget" />
      </InputGroup>,
    );
    await expectNoA11yViolations(container);
  });
});
