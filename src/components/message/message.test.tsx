import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Message } from './message';

describe('Message', () => {
  it('uses role=alert for errors and role=status otherwise', () => {
    const { rerender } = render(<Message severity="error">Bad</Message>);
    expect(screen.getByRole('alert')).toHaveTextContent('Bad');
    for (const severity of ['info', 'success', 'warn', 'secondary', 'contrast'] as const) {
      rerender(<Message severity={severity}>Ok</Message>);
      expect(screen.getByRole('status')).toHaveAttribute('data-severity', severity);
    }
  });

  it('only shows the dismiss button when dismissible and calls onDismiss', async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Message>Text</Message>);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(
      <Message dismissible onDismiss={onDismiss}>
        Text
      </Message>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('has no accessibility violations', async () => {
    render(
      <Message severity="error" dismissible icon={<span>!</span>}>
        Oops
      </Message>,
    );
    await expectNoA11yViolations();
  });
});
