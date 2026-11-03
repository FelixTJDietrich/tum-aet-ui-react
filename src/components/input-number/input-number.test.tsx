import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { InputNumber } from './input-number';

describe('InputNumber', () => {
  it('formats typed integers with grouping and reports numbers', async () => {
    const onChange = vi.fn();
    render(<InputNumber aria-label="Points" locale="en-US" onChange={onChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Points' });
    await userEvent.type(input, '1234');
    expect(input).toHaveValue('1,234');
    expect(onChange).toHaveBeenLastCalledWith(1234);
    expect(input).toHaveAttribute('aria-valuenow', '1234');
  });

  it('steps with the arrow keys and clamps to min and max', async () => {
    render(<InputNumber aria-label="Points" defaultValue={9} min={0} max={10} step={2} />);
    const input = screen.getByRole('spinbutton');
    input.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(input).toHaveValue('10');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(input).toHaveValue('6');
  });

  it('keeps a fraction while typing and truncates extra digits', async () => {
    const onChange = vi.fn();
    render(<InputNumber aria-label="Price" locale="en-US" maxFractionDigits={2} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    await userEvent.type(input, '12.50');
    expect(input).toHaveValue('12.50');
    await userEvent.type(input, '9');
    await userEvent.tab();
    expect(input).toHaveValue('12.5');
    expect(onChange).toHaveBeenLastCalledWith(12.5);
  });

  it('supports prefix, suffix and controlled values', async () => {
    function Host() {
      const [v, setV] = useState<number | null>(5);
      return <InputNumber aria-label="Cost" locale="en-US" prefix="$" suffix=" EUR" value={v} onChange={setV} />;
    }
    render(<Host />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue('$5 EUR');
    input.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(input).toHaveValue('$6 EUR');
  });

  it('steps with buttons, which stay out of the accessibility tree', async () => {
    render(<InputNumber aria-label="Points" showButtons defaultValue={1} />);
    const [up, down] = document.querySelectorAll<HTMLButtonElement>('.tumaet-ui-input-number-button');
    await userEvent.click(up!);
    expect(screen.getByRole('spinbutton')).toHaveValue('2');
    await userEvent.click(down!);
    await userEvent.click(down!);
    expect(screen.getByRole('spinbutton')).toHaveValue('0');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('has no axe violations', async () => {
    const { container } = render(<InputNumber aria-label="Points" showButtons defaultValue={3} min={0} max={9} />);
    await expectNoA11yViolations(container);
  });
});
