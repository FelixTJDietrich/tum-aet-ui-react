import type { HTMLAttributes } from 'react';
import { cx } from '../../internal/cx';

/** Joins adjacent `Button`s into one segmented control. */
export function ButtonGroup({ className, role = 'group', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} role={role} className={cx('tumaet-ui-button-group', className)} />;
}
