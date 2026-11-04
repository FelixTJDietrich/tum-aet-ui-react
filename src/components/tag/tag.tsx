import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';

export type TagSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
/** `md` is the standalone tag, `sm` annotates something else. */
export type TagSize = 'sm' | 'md';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Colour role. `secondary` is the neutral default, `contrast` the inverted high-emphasis tag. */
  severity?: TagSeverity;
  /** `md` for a standalone tag, `sm` for a tag that annotates other content. */
  size?: TagSize;
  /** Text of the tag; `children` are used when it is not set. */
  value?: string;
  /** Fully rounded (pill) corners instead of the medium radius. */
  rounded?: boolean;
  ref?: Ref<HTMLSpanElement>;
  children?: ReactNode;
}

export function Tag({ severity = 'secondary', size = 'md', value, rounded, className, children, ...rest }: TagProps) {
  return (
    <span
      {...rest}
      data-severity={severity}
      data-size={size}
      className={cx('tumaet-ui-tag', rounded === true && 'tumaet-ui-tag-rounded', className)}
    >
      {value !== undefined && value !== '' ? value : children}
    </span>
  );
}
