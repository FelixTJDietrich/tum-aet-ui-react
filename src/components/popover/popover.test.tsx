import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { Button } from '../button';
import { Popover, type PopoverProps } from './popover';

function Host(props: Partial<PopoverProps>) {
  return (
    <>
      <Popover aria-label="Details" trigger={<Button>Trigger</Button>} {...props}>
        <button>First</button>
        <button>Last</button>
      </Popover>
      <button>Outside</button>
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Trigger' });

describe('Popover', () => {
  it('toggles on click and reflects aria-haspopup, aria-expanded and aria-controls', async () => {
    render(<Host />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).not.toHaveAttribute('aria-controls');
    await userEvent.click(trigger());
    const panel = screen.getByRole('dialog', { name: 'Details' });
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-controls', panel.id);
    await userEvent.click(trigger());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus into the panel on open and back to the trigger on Escape', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('does not steal focus back when the popover re-renders while open', async () => {
    const { rerender } = render(<Host />);
    await userEvent.click(trigger());
    await userEvent.tab();
    rerender(<Host padding="none" />);
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the panel', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  it('closes on an outside press', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('works controlled and reports changes', async () => {
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Host
          open={open}
          onOpenChange={(o) => {
            onOpenChange(o);
            setOpen(o);
          }}
        />
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('removes the default padding on request and keeps the trigger own onClick', async () => {
    const onClick = vi.fn();
    render(<Host padding="none" trigger={<Button onClick={onClick}>Trigger</Button>} />);
    await userEvent.click(trigger());
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog')).toHaveAttribute('data-padding', 'none');
  });

  it('has no accessibility violations', async () => {
    render(<Host defaultOpen />);
    await expectNoA11yViolations();
  });

  it('keeps the 8px gap to the trigger of the Angular overlay service', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    // jsdom lays nothing out, so a panel below a zero-sized trigger sits exactly one offset down.
    expect(screen.getByRole('dialog')).toHaveStyle({ top: '8px' });
  });

  it('gives focus back to the trigger when the parent closes it while focus was inside', async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Popover aria-label="Details" open={open} onOpenChange={setOpen} trigger={<Button>Trigger</Button>}>
          <button onClick={() => setOpen(false)}>Done</button>
        </Popover>
      );
    }
    render(<Controlled />);
    await userEvent.click(trigger());
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('does not take focus from an element the user moved to when it closes', async () => {
    render(<Host />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
  });

  it('reflects the controlled open state in the trigger and keeps the panel named', () => {
    render(<Host open aria-label="Named" />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Named' })).toHaveAttribute('aria-modal', 'true');
  });
});
