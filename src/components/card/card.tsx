import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Title of the card. */
  header?: ReactNode;
  /** Muted line below the title. */
  subheader?: ReactNode;
  /** Full-width content above the body (for example an image). */
  media?: ReactNode;
  /** Content below the main content inside the body. */
  footer?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** True for anything React would render as visible content (not nullish, boolean, empty string or 0). */
function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '' && node !== 0;
}

export function Card({ header, subheader, media, footer, className, children, ...rest }: CardProps) {
  return (
    <div {...rest} className={cx('tumaet-ui-card', className)}>
      {media}
      <div className="tumaet-ui-card-body">
        {hasContent(header) || hasContent(subheader) ? (
          <div className="tumaet-ui-card-caption">
            {hasContent(header) ? <div className="tumaet-ui-card-title">{header}</div> : null}
            {hasContent(subheader) ? <div className="tumaet-ui-card-subtitle">{subheader}</div> : null}
          </div>
        ) : null}
        <div className="tumaet-ui-card-content">{children}</div>
        {footer}
      </div>
    </div>
  );
}
