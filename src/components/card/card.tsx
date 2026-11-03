import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  header?: ReactNode;
  subheader?: ReactNode;
  /** Full-width content above the body (for example an image). */
  media?: ReactNode;
  /** Content below the main content inside the body. */
  footer?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function Card({ header, subheader, media, footer, className, children, ...rest }: CardProps) {
  return (
    <div {...rest} className={cx('tumaet-ui-card', className)}>
      {media}
      <div className="tumaet-ui-card-body">
        {(header || subheader) && (
          <div className="tumaet-ui-card-caption">
            {header && <div className="tumaet-ui-card-title">{header}</div>}
            {subheader && <div className="tumaet-ui-card-subtitle">{subheader}</div>}
          </div>
        )}
        <div className="tumaet-ui-card-content">{children}</div>
        {footer}
      </div>
    </div>
  );
}
