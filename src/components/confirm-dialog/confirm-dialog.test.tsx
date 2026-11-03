import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { ConfirmDialog, ConfirmProvider, useConfirm, type ConfirmationRequest } from './confirm-dialog';

const base: ConfirmationRequest = {
  header: 'Delete?',
  message: 'Cannot be undone.',
  acceptLabel: 'Delete',
  rejectLabel: 'Cancel',
};

function Host({ request = base, results }: { request?: ConfirmationRequest; results?: boolean[] }) {
  const confirm = useConfirm();
  return <button onClick={() => confirm(request).then((r) => results?.push(r))}>Ask</button>;
}

function renderHost(request?: ConfirmationRequest, results: boolean[] = []) {
  render(
    <ConfirmProvider>
      <Host request={request} results={results} />
      <ConfirmDialog confirmKey={request?.key} />
    </ConfirmProvider>,
  );
  return results;
}

const ask = () => userEvent.click(screen.getByRole('button', { name: 'Ask' }));
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('ConfirmDialog', () => {
  it('shows an alertdialog described by the message', async () => {
    renderHost();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await ask();
    const dialog = screen.getByRole('alertdialog', { name: 'Delete?' });
    expect(dialog).toHaveAccessibleDescription('Cannot be undone.');
  });

  it('resolves true and calls accept when confirmed', async () => {
    const accept = vi.fn();
    const results = renderHost({ ...base, accept });
    await ask();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await flush();
    expect(results).toEqual([true]);
    expect(accept).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('resolves false and calls reject when cancelled, closed or dismissed with Escape', async () => {
    const reject = vi.fn();
    const results = renderHost({ ...base, reject });
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
    renderHost({ ...base, key: 'a', icon: <svg data-testid="icon" />, acceptSeverity: 'danger' });
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
    let confirm!: ReturnType<typeof useConfirm>;
    function Grab() {
      confirm = useConfirm();
      return null;
    }
    render(
      <ConfirmProvider>
        <Grab />
        <ConfirmDialog />
      </ConfirmProvider>,
    );
    const first = confirm(base);
    const second = confirm({ ...base, header: 'Second' });
    await expect(first).resolves.toBe(false);
    expect(await screen.findByRole('alertdialog', { name: 'Second' })).toBeInTheDocument();
    void second;
  });

  it('throws outside a provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ConfirmDialog />)).toThrow(/ConfirmProvider/);
    error.mockRestore();
  });

  it('has no accessibility violations', async () => {
    renderHost();
    await ask();
    await expectNoA11yViolations();
  });
});
