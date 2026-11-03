import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('toggles on click and calls onChange with the new state', async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Agree" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Agree' });
    await userEvent.click(box);
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('toggles with Space and stays controlled', async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Agree" checked={false} onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('exposes the indeterminate state without changing checked', () => {
    render(<Checkbox aria-label="All" indeterminate />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    expect(box).not.toBeChecked();
  });

  it('cannot be toggled when disabled', async () => {
    render(<Checkbox aria-label="Agree" disabled />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Checkbox aria-label="A" defaultChecked />
        <Checkbox aria-label="B" indeterminate />
        <Checkbox aria-label="C" disabled />
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
