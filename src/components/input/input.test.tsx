import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Input, Textarea } from './input';

describe('Input', () => {
  it('types text and exposes size and invalid state', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Name" size="small" invalid onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.type(input, 'ab');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-size', 'small');
    expect(input).toHaveClass('tumaet-ui-input');
  });

  it('omits aria-invalid while valid and keeps an own id', () => {
    render(<Input id="mine" aria-label="x" />);
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAttribute('id', 'mine');
  });

  it('is reachable and typeable by keyboard', async () => {
    render(
      <>
        <button>before</button>
        <Textarea aria-label="Notes" />
      </>,
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveFocus();
    await userEvent.keyboard('hi');
    expect(screen.getByRole('textbox')).toHaveValue('hi');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <label>
          Name
          <Input />
        </label>
        <Textarea aria-label="Notes" />
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
