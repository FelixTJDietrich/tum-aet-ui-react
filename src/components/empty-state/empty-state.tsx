import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';

export type EmptyStateVariant = 'outlined' | 'solid' | 'plain';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Heading that describes what content is missing. */
  title: ReactNode;
  /** Heading level of the title. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Optional explanation below the heading. */
  description?: ReactNode;
  /** Decorative icon above the content. */
  icon?: ReactNode;
  /** Visual treatment of the icon container: `outlined` (bordered), `solid` (filled) or `plain` (no container). */
  variant?: EmptyStateVariant;
  /** Actions (buttons, links), rendered below the description. */
  actions?: ReactNode;
  /** Documentation link(s): anchors inside get the link treatment and a trailing arrow. */
  documentation?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** Whether a slot holds content, matching React truthiness (so `0`, `''` and `false` leave the slot out). */
function isPresent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '' && node !== 0 && node !== 0n;
}

export function EmptyState({
  title,
  headingLevel = 2,
  description,
  icon,
  variant = 'outlined',
  actions,
  documentation,
  className,
  children,
  ...rest
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div {...rest} data-variant={variant} className={cx('tumaet-ui-empty-state', className)}>
      {isPresent(icon) ? (
        <div className="tumaet-ui-empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <Heading className="tumaet-ui-empty-state-title">{title}</Heading>
      {isPresent(description) ? <p className="tumaet-ui-empty-state-description">{description}</p> : null}
      {children}
      {isPresent(actions) ? <div className="tumaet-ui-empty-state-actions">{actions}</div> : null}
      {isPresent(documentation) ? <div className="tumaet-ui-empty-state-documentation">{documentation}</div> : null}
    </div>
  );
}
