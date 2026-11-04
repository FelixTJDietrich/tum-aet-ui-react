import { useId, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { cx } from '../../internal/cx';
import { useTranslate } from '../../internal/i18n';
import { ChevronDownIcon, ChevronUpIcon } from '../../internal/icons';
import { useControllable } from '../../internal/use-controllable';

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Header content. When it is not text, also set `toggleLabel`. */
  header?: ReactNode;
  /** Shows a toggle button that collapses the content (disclosure pattern). */
  toggleable?: boolean;
  /** Accessible name of the toggle; defaults to the header or the translated "Collapse"/"Expand". */
  toggleLabel?: string;
  /** Controlled collapsed state, applied only when `toggleable`. */
  collapsed?: boolean;
  /** Initial collapsed state when uncontrolled. */
  defaultCollapsed?: boolean;
  /** Fires with the new collapsed state when the toggle is used. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Content below the main content, inside the collapsible region. */
  footer?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function Panel({
  header,
  toggleable,
  toggleLabel,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  footer,
  className,
  children,
  ...rest
}: PanelProps) {
  const t = useTranslate();
  const id = useId();
  const headerId = `${id}-header`;
  const contentId = `${id}-content`;
  const [isCollapsedState, setCollapsed] = useControllable(collapsed, defaultCollapsed, onCollapsedChange);
  const isCollapsed = toggleable === true && isCollapsedState;
  const hasHeader =
    header !== undefined && header !== null && header !== false && !(typeof header === 'string' && !header.trim());
  const customLabel = toggleLabel?.trim();
  const hasCustomLabel = customLabel !== undefined && customLabel !== '';
  const isToggleable = toggleable === true;
  const defaultLabel = hasHeader
    ? undefined
    : t(isCollapsedState ? 'tumAetUi.panel.expand' : 'tumAetUi.panel.collapse');
  const ToggleIcon = isCollapsedState ? ChevronDownIcon : ChevronUpIcon;
  return (
    <div
      {...rest}
      data-collapsed={isToggleable ? isCollapsedState : undefined}
      className={cx('tumaet-ui-panel', className)}
    >
      <div className={cx('tumaet-ui-panel-header', isToggleable && 'tumaet-ui-panel-header-toggleable')}>
        <span id={headerId} className="tumaet-ui-panel-title">
          {header}
        </span>
        {isToggleable ? (
          <button
            type="button"
            className="tumaet-ui-panel-toggler"
            aria-expanded={!isCollapsedState}
            aria-controls={contentId}
            aria-label={hasCustomLabel ? customLabel : defaultLabel}
            aria-labelledby={!hasCustomLabel && hasHeader ? headerId : undefined}
            onClick={() => setCollapsed(!isCollapsedState)}
          >
            <ToggleIcon />
          </button>
        ) : null}
      </div>
      <div
        id={contentId}
        className="tumaet-ui-panel-content-container"
        role={isToggleable && hasHeader ? 'region' : undefined}
        aria-labelledby={isToggleable && hasHeader ? headerId : undefined}
        aria-hidden={isCollapsed || undefined}
        inert={isCollapsed}
      >
        <div className="tumaet-ui-panel-content-wrapper">
          <div className="tumaet-ui-panel-content">{children}</div>
          {footer}
        </div>
      </div>
    </div>
  );
}
