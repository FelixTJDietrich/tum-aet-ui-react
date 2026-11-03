import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { RadioButton, RadioGroup } from './radio-button';

const group = (props = {}) => (
  <RadioGroup aria-label="Size" {...props}>
    <RadioButton value="s" aria-label="Small" />
    <RadioButton value="m" aria-label="Medium" />
    <RadioButton value="l" aria-label="Large" />
  </RadioGroup>
);

describe('RadioGroup', () => {
  it('selects on click and reports the value', async () => {
    const onChange = vi.fn();
    render(group({ onChange }));
    await userEvent.click(screen.getByRole('radio', { name: 'Medium' }));
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    expect(onChange).toHaveBeenCalledWith('m');
  });

  it('has one tab stop and moves with the arrow keys, wrapping', async () => {
    render(group({ defaultValue: 'm' }));
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Medium' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Large' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
  });

  it('is controlled and can be disabled', async () => {
    const { rerender } = render(group({ value: 's' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Large' }));
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
    rerender(group({ value: 's', disabled: true }));
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
  });

  it('works standalone', async () => {
    render(<RadioButton aria-label="Solo" />);
    await userEvent.click(screen.getByRole('radio'));
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(group({ defaultValue: 's' }));
    await expectNoA11yViolations(container);
  });
});
