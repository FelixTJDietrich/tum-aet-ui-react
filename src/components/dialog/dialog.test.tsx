import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { Button } from '../button';
import { Popover } from '../popover';
import { Dialog, type DialogProps } from './dialog';

/** Silences a spied method without doing anything. */
const noop = () => {
  // intentionally empty
};

function Host(props: Partial<DialogProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
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
    rerender(null);
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
    const error = vi.spyOn(console, 'error').mockImplementation(noop);
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

  it('does not close itself when a queued close event of its own close() arrives after a StrictMode re-open', async () => {
    // Browsers fire `close` in a later task; the jsdom stand-in fires it at once, which hides the problem.
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
      this: HTMLDialogElement,
    ) {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      setTimeout(() => this.dispatchEvent(new Event('close')));
    });
    try {
      const onOpenChange = vi.fn();
      render(
        <StrictMode>
          <Dialog open header="T" onOpenChange={onOpenChange}>
            x
          </Dialog>
        </StrictMode>,
      );
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(document.querySelector('dialog')).toHaveAttribute('open');
    } finally {
      closeSpy.mockRestore();
    }
  });

  it('still reports a native close (for example from a method=dialog form)', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open header="T" onOpenChange={onOpenChange}>
        x
      </Dialog>,
    );
    document.querySelector('dialog')!.close();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('lets an open popup take Escape first, then closes on Escape, and never closes on Escape when closeOnEscape is off', async () => {
    const { unmount } = render(
      <Dialog defaultOpen header="T">
        <Popover defaultOpen aria-label="Inner" trigger={<button type="button">Inner trigger</button>}>
          <button type="button">In popover</button>
        </Popover>
      </Dialog>,
    );
    const keydown = (target: Element) => {
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event;
    };
    expect(screen.getByRole('dialog', { name: 'Inner' })).toBeInTheDocument();
    // The popup is open: this Escape closes it and leaves the dialog alone.
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Inner' })).toBeNull();
    // Popup gone: Escape is the dialog's again.
    expect(screen.getByRole('dialog', { name: 'T' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(document.querySelector('dialog')).toBeNull();
    unmount();

    render(
      <Dialog open header="T" closeOnEscape={false}>
        x
      </Dialog>,
    );
    expect(keydown(screen.getByRole('button', { name: 'Close' })).defaultPrevented).toBe(true);
    expect(screen.getByRole('dialog', { name: 'T' })).toBeInTheDocument();
  });

  it('is uncontrolled with defaultOpen and releases the scroll lock when unmounted while open', async () => {
    const { unmount } = render(
      <Dialog defaultOpen header="T">
        x
      </Dialog>,
    );
    expect(document.documentElement.style.overflow).toBe('hidden');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');

    const { unmount: unmountSecond } = render(
      <Dialog open header="T">
        x
      </Dialog>,
    );
    expect(document.documentElement.style.overflow).toBe('hidden');
    unmountSecond();
    expect(document.documentElement.style.overflow).toBe('');
    unmount();
  });

  it('omits the footer without footer content, and the header with showHeader false', () => {
    const { unmount: unmountFirst } = render(
      <Dialog open header="T" aria-label="Named">
        x
      </Dialog>,
    );
    expect(document.querySelector('.tumaet-ui-dialog-footer')).toBeNull();
    expect(document.querySelector('.tumaet-ui-dialog')).not.toHaveAttribute('data-size');
    unmountFirst();
    render(
      <Dialog open showHeader={false} aria-label="Plain" footer={<button type="button">OK</button>}>
        x
      </Dialog>,
    );
    expect(document.querySelector('.tumaet-ui-dialog-header')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(document.querySelector('.tumaet-ui-dialog-footer')).not.toBeNull();
  });

  it('accepts a node as header, a custom close label and aria-describedby', () => {
    render(
      <>
        <p id="desc">Why</p>
        <Dialog open header={<h3>Node title</h3>} closeButtonAriaLabel="Dismiss" aria-describedby="desc">
          x
        </Dialog>
      </>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Node title' });
    expect(dialog).toHaveAccessibleDescription('Why');
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('does not count a drag that started inside the panel and ended on the backdrop as a mask click', () => {
    render(
      <Dialog defaultOpen header="T" dismissableMask>
        <p>Body text</p>
      </Dialog>,
    );
    const dialog = document.querySelector('dialog')!;
    fireEvent.pointerDown(screen.getByText('Body text'));
    fireEvent.click(dialog);
    expect(document.querySelector('dialog')).not.toBeNull();
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    expect(document.querySelector('dialog')).toBeNull();
  });
});
