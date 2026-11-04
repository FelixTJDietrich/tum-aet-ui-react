import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useEffect } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { ConfirmDialog, ConfirmProvider, useConfirm, type ConfirmationRequest } from './confirm-dialog';

const noop = (): void => {
  // Intentionally does nothing.
};

const base: ConfirmationRequest = {
  header: 'Delete?',
  message: 'Cannot be undone.',
  acceptLabel: 'Delete',
  rejectLabel: 'Cancel',
};

function Host({ request = base, results }: { request?: ConfirmationRequest; results?: boolean[] }) {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={() => {
        void confirm(request).then((r) => results?.push(r));
      }}
    >
      Ask
    </button>
  );
}

type Confirm = ReturnType<typeof useConfirm>;
const captured: { current: Confirm | null } = { current: null };

/** Hands the `confirm` function of the enclosing provider to the test body. */
function Grab() {
  const confirm = useConfirm();
  useEffect(() => {
    captured.current = confirm;
  }, [confirm]);
  return null;
}

function grabbedConfirm(): Confirm {
  if (captured.current === null) {
    throw new Error('Grab was not rendered.');
  }
  return captured.current;
}

function mountHost(request?: ConfirmationRequest, results: boolean[] = []) {
  render(
    <ConfirmProvider>
      <Host request={request} results={results} />
      <ConfirmDialog confirmKey={request?.key} />
    </ConfirmProvider>,
  );
  return results;
}

const ask = async () => userEvent.click(screen.getByRole('button', { name: 'Ask' }));
const flush = async () => new Promise((resolve) => setTimeout(resolve));

describe('ConfirmDialog', () => {
  it('shows an alertdialog described by the message', async () => {
    mountHost();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await ask();
    const dialog = screen.getByRole('alertdialog', { name: 'Delete?' });
    expect(dialog).toHaveAccessibleDescription('Cannot be undone.');
  });

  it('resolves true and calls accept when confirmed', async () => {
    const accept = vi.fn();
    const results = mountHost({ ...base, accept });
    await ask();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await flush();
    expect(results).toEqual([true]);
    expect(accept).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('resolves false and calls reject when cancelled, closed or dismissed with Escape', async () => {
    const reject = vi.fn();
    const results = mountHost({ ...base, reject });
    await ask();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await ask();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await ask();
    fireEvent(screen.getByRole('alertdialog'), new Event('cancel', { cancelable: true }));
    await flush();
    expect(results).toEqual([false, false, false]);
    expect(reject).toHaveBeenCalledTimes(3);
  });

  it('routes requests by key and shows the icon decoratively with severities', async () => {
    mountHost({ ...base, key: 'a', icon: <svg data-testid="icon" />, acceptSeverity: 'danger' });
    await ask();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-severity', 'danger');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-severity', 'secondary');
  });

  it('does not show a dialog for a request with a different key', async () => {
    render(
      <ConfirmProvider>
        <Host request={{ ...base, key: 'other' }} />
        <ConfirmDialog confirmKey="mine" />
      </ConfirmProvider>,
    );
    await ask();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('rejects a pending request that is replaced by a new one with the same key', async () => {
    render(
      <ConfirmProvider>
        <Grab />
        <ConfirmDialog />
      </ConfirmProvider>,
    );
    const confirm = grabbedConfirm();
    const first = confirm(base);
    const second = confirm({ ...base, header: 'Second' });
    await expect(first).resolves.toBe(false);
    expect(await screen.findByRole('alertdialog', { name: 'Second' })).toBeInTheDocument();
    void second;
  });

  it('keeps keyed requests independent: opening one neither dismisses nor rejects another', () => {
    const rejectA = vi.fn();
    render(
      <ConfirmProvider>
        <Grab />
        <ConfirmDialog confirmKey="a" />
        <ConfirmDialog confirmKey="b" />
      </ConfirmProvider>,
    );
    const confirm = grabbedConfirm();
    act(() => void confirm({ ...base, header: 'A', message: 'request-a', key: 'a', reject: rejectA }));
    act(() => void confirm({ ...base, header: 'B', message: 'request-b', key: 'b' }));
    expect(screen.getByRole('alertdialog', { name: 'A', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('alertdialog', { name: 'B' })).toBeInTheDocument();
    expect(rejectA).not.toHaveBeenCalled();
  });

  it('renders the message as a single span that keeps line breaks and a custom accept label and severity', async () => {
    mountHost({ ...base, message: 'First line\nSecond line', acceptLabel: 'Yes', rejectSeverity: 'danger' });
    await ask();
    const message = document.querySelector('.tumaet-ui-confirm-dialog-message')!;
    expect(message.textContent).toBe('First line\nSecond line');
    expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute('data-severity', 'primary');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-severity', 'danger');
  });

  it('survives StrictMode: the dialog is not rejected right after opening', async () => {
    const results: boolean[] = [];
    render(
      <StrictMode>
        <ConfirmProvider>
          <Host results={results} />
          <ConfirmDialog />
        </ConfirmProvider>
      </StrictMode>,
    );
    await ask();
    await flush();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(results).toEqual([]);
  });

  it('throws outside a provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(noop);
    expect(() => render(<ConfirmDialog />)).toThrow(/ConfirmProvider/);
    error.mockRestore();
  });

  it('has no accessibility violations', async () => {
    mountHost();
    await ask();
    await expectNoA11yViolations();
  });
});
