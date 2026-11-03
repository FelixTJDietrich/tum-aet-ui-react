import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, screen, waitFor, waitForElementToBeRemoved, within } from 'storybook/test';
import { Button } from '../button';
import { Dialog, type DialogProps, type DialogSize } from './dialog';

const DESCRIPTION_ID = 'enrollment-dialog-description';

interface ExampleTexts {
  description?: string;
  openLabel?: string;
  confirmLabel?: string;
}

/** Launcher plus dialog with its own open state, seeded from the `open` arg (changing the control remounts it). */
function DialogExample({
  description = 'Enroll in Advanced Software Engineering?',
  openLabel = 'Open confirmation',
  confirmLabel = 'Enroll',
  onOpenChange,
  open: initialOpen = false,
  ...props
}: DialogProps & ExampleTexts) {
  const [open, setOpenState] = useState(initialOpen);
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>{openLabel}</Button>
      <Dialog
        aria-describedby={DESCRIPTION_ID}
        {...props}
        open={open}
        onOpenChange={setOpen}
        footer={
          <>
            <Button severity="secondary" variant="outlined" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>{confirmLabel}</Button>
          </>
        }
      >
        <p id={DESCRIPTION_ID} style={{ margin: 0 }}>
          {description}
        </p>
      </Dialog>
    </>
  );
}

const meta = {
  title: 'Overlays/Dialog',
  component: Dialog,
  render: (args) => <DialogExample key={String(args.open)} {...args} />,
  args: {
    closable: true,
    closeOnEscape: true,
    dismissableMask: false,
    header: 'Confirm enrollment',
    onHide: fn(),
    onShow: fn(),
    onOpenChange: fn(),
    size: 'medium',
    open: false,
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['small', 'medium', 'large', 'full', undefined] satisfies (DialogSize | undefined)[],
    },
    role: { control: 'inline-radio', options: ['dialog', 'alertdialog'] },
    autoFocus: { control: 'inline-radio', options: ['first-tabbable', 'dialog'] },
    header: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Modal dialog on the native `<dialog>` element (`showModal()`): the platform provides the top layer, the inert background, the focus trap and focus return to the opener. It renders nothing while closed. The parent owns the state: `open`/`onOpenChange` (or `defaultOpen`); `onOpenChange(false)` fires for the close button, Escape and, with `dismissableMask`, a click on the backdrop. A dialog needs a name: a visible `header` or an `aria-label`/`aria-labelledby`. Use `role="alertdialog"` for decisions that interrupt the user, and `autoFocus="dialog"` so long content starts scrolled to the top. Escape first closes a popover, menu or tooltip open inside the dialog, then the dialog.',
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  args: { open: true },
  tags: ['!autodocs'],
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Confirm enrollment' });
    await expect(dialog).toHaveAccessibleDescription('Enroll in Advanced Software Engineering?');
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await expect(args.onShow).toHaveBeenCalledOnce();
  },
};

export const ClosesDialog: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, userEvent }) => {
    const launcher = canvas.getByRole('button', { name: 'Open confirmation' });
    await userEvent.click(launcher);

    const dialog = await screen.findByRole('dialog', { name: 'Confirm enrollment' });
    const dialogRemoved = waitForElementToBeRemoved(dialog);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await dialogRemoved;
    await expect(args.onHide).toHaveBeenCalledOnce();
    await expect(canvas.queryByText('Enroll in Advanced Software Engineering?')).not.toBeInTheDocument();
    await waitFor(() => expect(launcher).toHaveFocus());
  },
};

export const ClosesWithEscape: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent }) => {
    const launcher = canvas.getByRole('button', { name: 'Open confirmation' });
    await userEvent.click(launcher);
    const dialog = await screen.findByRole('dialog', { name: 'Confirm enrollment' });
    const dialogRemoved = waitForElementToBeRemoved(dialog);
    await userEvent.keyboard('{Escape}');
    await dialogRemoved;
    await waitFor(() => expect(launcher).toHaveFocus());
  },
};

/** No close button, no Escape: the user has to choose one of the footer buttons. */
export const RequiredDecision: Story = {
  tags: ['!autodocs'],
  args: {
    closable: false,
    closeOnEscape: false,
    header: 'Submit assessment',
    open: true,
  },
  render: (args) => (
    <DialogExample
      {...args}
      description="Submit this assessment and release the result?"
      confirmLabel="Submit assessment"
      openLabel="Review submission"
    />
  ),
  play: async ({ userEvent }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Submit assessment' });
    await userEvent.keyboard('{Escape}');
    await expect(dialog).toBeVisible();
  },
};

/** A click on the backdrop closes the dialog; a drag that starts inside the panel does not. */
export const DismissableMask: Story = { args: { dismissableMask: true } };

/** `role="alertdialog"` for a decision that interrupts the user. */
export const AlertDialog: Story = {
  args: { role: 'alertdialog', header: 'Discard changes?' },
  render: (args) => <DialogExample {...args} description="Unsaved changes will be lost." confirmLabel="Discard" />,
};

export const Small: Story = { args: { size: 'small' } };
export const Large: Story = { args: { size: 'large' } };

/** `full` fills 90% of the viewport in both directions. */
export const Full: Story = { args: { size: 'full' } };

/** Without `size` the dialog is as wide as its content. */
export const ContentSized: Story = { args: { size: undefined } };

/** The header is hidden, so the dialog is named by `aria-label`. */
export const WithoutHeader: Story = { args: { showHeader: false, 'aria-label': 'Enrollment confirmation' } };

export const LongContent: Story = {
  args: { size: 'small', autoFocus: 'dialog' },
  render: ({ onOpenChange, ...props }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open long content</Button>
        <Dialog
          {...props}
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange?.(next);
          }}
          footer={<Button onClick={() => setOpen(false)}>Done</Button>}
        >
          {Array.from({ length: 12 }, (_, index) => (
            <p key={index} style={{ marginTop: 0 }}>
              Paragraph {index + 1}. The content area scrolls while the header and the footer stay in place, and the
              page behind the dialog does not move.
            </p>
          ))}
        </Dialog>
      </>
    );
  },
};

/** `header` takes any node, for example a heading with an icon. */
export const NodeHeader: Story = {
  args: {
    header: (
      <span>
        <strong>Confirm</strong> enrollment
      </span>
    ),
  },
};
