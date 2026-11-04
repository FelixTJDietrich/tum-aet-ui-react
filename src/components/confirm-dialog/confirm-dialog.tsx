import { createContext, useCallback, useContext, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, type ButtonSeverity } from '../button';
import { Dialog } from '../dialog';

/** Content and callbacks for one confirmation decision. */
export interface ConfirmationRequest {
  /** Dialog title. */
  header: string;
  /** Body text shown next to the optional icon. */
  message: ReactNode;
  /** Localized confirm-button label. */
  acceptLabel: string;
  /** Localized cancel-button label. */
  rejectLabel: string;
  /** Confirm button severity (default `'primary'`). */
  acceptSeverity?: ButtonSeverity;
  /** Cancel button severity (default `'secondary'`). */
  rejectSeverity?: ButtonSeverity;
  /** Optional leading icon shown before the message. Decorative. */
  icon?: ReactNode;
  /** Routes the request to the `ConfirmDialog` with the same `key`. */
  key?: string;
  /** Invoked when the user confirms. */
  accept?: () => void;
  /** Invoked when the user cancels or dismisses the dialog. */
  reject?: () => void;
}

export type ConfirmFunction = (request: ConfirmationRequest) => Promise<boolean>;

interface Entry {
  request: ConfirmationRequest;
  settle: (accepted: boolean) => void;
}

interface ConfirmContextValue {
  entries: ReadonlyMap<string | undefined, Entry>;
  confirm: ConfirmFunction;
  /** Settles and removes the pending request for `key`. */
  settle: (key: string | undefined, accepted: boolean) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

function useConfirmContext(): ConfirmContextValue {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm and ConfirmDialog must be used inside a ConfirmProvider');
  return context;
}

/** Coordinates confirmation requests with the `ConfirmDialog` components below it. */
export function ConfirmProvider({ children }: { children?: ReactNode }) {
  const [entries, setEntries] = useState<ReadonlyMap<string | undefined, Entry>>(new Map());
  const latest = useRef(entries);

  const commit = useCallback((next: ReadonlyMap<string | undefined, Entry>) => {
    latest.current = next;
    setEntries(next);
  }, []);

  const settle = useCallback(
    (key: string | undefined, accepted: boolean) => {
      const entry = latest.current.get(key);
      if (!entry) return;
      const next = new Map(latest.current);
      next.delete(key);
      commit(next);
      // Cleared first so the dialog is already closing while the callbacks run.
      entry.settle(accepted);
    },
    [commit],
  );

  const confirm = useCallback<ConfirmFunction>(
    async (request) =>
      new Promise<boolean>((resolve) => {
        // A second request for the same key replaces the pending one, which counts as rejected.
        settle(request.key, false);
        const entry: Entry = {
          request,
          settle: (accepted) => {
            if (accepted) request.accept?.();
            else request.reject?.();
            resolve(accepted);
          },
        };
        commit(new Map(latest.current).set(request.key, entry));
      }),
    [commit, settle],
  );

  const value = useMemo(() => ({ entries, confirm, settle }), [entries, confirm, settle]);
  return <ConfirmContext value={value}>{children}</ConfirmContext>;
}

/** Returns `confirm(request)`, which resolves to `true` when accepted and `false` when rejected or dismissed. */
export function useConfirm(): ConfirmFunction {
  return useConfirmContext().confirm;
}

export interface ConfirmDialogProps {
  /** Static key used to select this dialog's confirmation requests. */
  confirmKey?: string;
}

/** Renders requests from the nearest `ConfirmProvider` as a modal decision (`role="alertdialog"`). */
export function ConfirmDialog({ confirmKey }: ConfirmDialogProps) {
  const { entries, settle } = useConfirmContext();
  const messageId = useId();
  const request = entries.get(confirmKey)?.request;
  if (!request) return null;
  // Keeps the falsy semantics of ReactNode (`''`, `0`, `false` render no icon wrapper).
  const hasIcon = Boolean(request.icon);
  return (
    <Dialog
      open
      closable
      role="alertdialog"
      header={request.header}
      aria-describedby={messageId}
      onOpenChange={(open) => !open && settle(confirmKey, false)}
      footer={
        <>
          <Button severity={request.rejectSeverity ?? 'secondary'} onClick={() => settle(confirmKey, false)}>
            {request.rejectLabel}
          </Button>
          <Button severity={request.acceptSeverity ?? 'primary'} onClick={() => settle(confirmKey, true)}>
            {request.acceptLabel}
          </Button>
        </>
      }
    >
      <div className="tumaet-ui-confirm-dialog-body">
        {hasIcon ? (
          <span className="tumaet-ui-confirm-dialog-icon" aria-hidden="true">
            {request.icon}
          </span>
        ) : null}
        <span id={messageId} className="tumaet-ui-confirm-dialog-message">
          {request.message}
        </span>
      </div>
    </Dialog>
  );
}
