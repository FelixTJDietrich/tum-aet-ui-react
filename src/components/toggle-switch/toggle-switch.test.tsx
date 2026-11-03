import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { ToggleSwitch } from './toggle-switch';

describe('ToggleSwitch', () => {
  it('has role switch and toggles on click', async () => {
    const onChange = vi.fn();
    render(<ToggleSwitch aria-label="Notifications" onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Notifications' });
    expect(sw).not.toBeChecked();
    await userEvent.click(sw);
    expect(sw).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('toggles with Space', async () => {
    render(<ToggleSwitch aria-label="Notifications" defaultChecked />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('does nothing when disabled', async () => {
    render(<ToggleSwitch aria-label="Notifications" disabled />);
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <label>
          Mail <ToggleSwitch />
        </label>
        <ToggleSwitch aria-label="B" defaultChecked />
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
