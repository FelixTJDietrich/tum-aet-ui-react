import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { Button } from '../button';
import { Dialog, type DialogProps } from './dialog';

function Host(props: Partial<DialogProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Dialog open={open} onOpenChange={setOpen} header="My title" footer={<Button>OK</Button>} {...props}>
        <p>Body text</p>
      </Dialog>
    </>
  );
}

const openDialog = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));
  return screen.getByRole('dialog', { name: 'My title' });
};

describe('Dialog', () => {
  it('renders nothing while closed and a labelled dialog when open', async () => {
    render(<Host />);
    expect(document.querySelector('dialog')).toBeNull();
    const dialog = await openDialog();
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(screen.getByText('Body text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });

  it('closes with the translated close button and returns focus to the opener', async () => {
    render(<Host />);
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    await openDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(document.querySelector('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('hides the close button when closable is false', async () => {
    render(<Host closable={false} />);
    await openDialog();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('closes on the cancel event (Escape) only when closeOnEscape is true', async () => {
    const { unmount } = render(<Host closeOnEscape={false} />);
    const dialog = await openDialog();
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(document.querySelector('dialog')).not.toBeNull();
    unmount();

    render(<Host />);
    fireEvent(await openDialog(), new Event('cancel', { cancelable: true }));
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('closes on a backdrop click only when dismissableMask is true', async () => {
    const { unmount } = render(<Host />);
    let dialog = await openDialog();
    await userEvent.click(dialog);
    expect(document.querySelector('dialog')).not.toBeNull();
    unmount();

    render(<Host dismissableMask />);
    dialog = await openDialog();
    await userEvent.click(screen.getByText('Body text'));
    expect(document.querySelector('dialog')).not.toBeNull();
    await userEvent.click(dialog);
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('locks page scroll while open and releases it afterwards', async () => {
    render(<Host />);
    await openDialog();
    expect(document.documentElement.style.overflow).toBe('hidden');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('keeps the lock until the last of two dialogs closes', () => {
    const { rerender } = render(
      <>
        <Dialog open header="A">
          <p>a</p>
        </Dialog>
        <Dialog open header="B">
          <p>b</p>
        </Dialog>
      </>,
    );
    expect(document.documentElement.style.overflow).toBe('hidden');
    rerender(
      <Dialog open header="A">
        <p>a</p>
      </Dialog>,
    );
    expect(document.documentElement.style.overflow).toBe('hidden');
    rerender(<></>);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('applies the size and the alertdialog role', async () => {
    render(<Host size="large" role="alertdialog" />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('alertdialog', { name: 'My title' }).querySelector('.tumaet-ui-dialog')).toHaveAttribute(
      'data-size',
      'large',
    );
  });

  it('names a headerless dialog by aria-label and rejects an unnamed one', () => {
    render(
      <Dialog open showHeader={false} aria-label="Plain">
        x
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Plain' })).toBeInTheDocument();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Dialog open showHeader={false}>
          x
        </Dialog>,
      ),
    ).toThrow(/aria-label/);
    error.mockRestore();
  });

  it('reports show and hide', async () => {
    const onShow = vi.fn();
    const onHide = vi.fn();
    render(<Host onShow={onShow} onHide={onHide} />);
    await openDialog();
    expect(onShow).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onHide).toHaveBeenCalledOnce();
  });

  it('has no accessibility violations', async () => {
    render(<Host />);
    await openDialog();
    await expectNoA11yViolations();
  });
});
