import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { FormField } from '../form-field/form-field';
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

  it('defaults to the normal size and supports small and large', () => {
    const { rerender } = render(<Input aria-label="x" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'default');
    rerender(<Input aria-label="x" size="large" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'large');
  });

  it('is disabled and forwards a ref', () => {
    const ref = vi.fn();
    render(<Input aria-label="x" disabled ref={ref} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(ref).toHaveBeenCalledWith(screen.getByRole('textbox'));
  });

  it('merges its own aria-describedby with the one of the FormField', () => {
    render(
      <FormField label="Name" hint="Hint">
        <Input aria-describedby="extra" />
      </FormField>,
    );
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(/Hint/);
    expect(screen.getByLabelText('Name').getAttribute('aria-describedby')).toMatch(/^extra /);
  });

  it('marks a textarea invalid, takes the field id and sizes', () => {
    render(
      <FormField label="Notes" invalid error="Too short">
        <Textarea size="small" rows={4} />
      </FormField>,
    );
    const area = screen.getByRole('textbox', { name: 'Notes' });
    expect(area.tagName).toBe('TEXTAREA');
    expect(area).toHaveAttribute('aria-invalid', 'true');
    expect(area).toHaveAttribute('data-size', 'small');
    expect(area).toHaveAccessibleDescription('Too short');
  });

  it('lets an explicit aria-invalid="false" win over the invalid prop', () => {
    render(<Input aria-label="x" invalid aria-invalid="false" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
  });
});
