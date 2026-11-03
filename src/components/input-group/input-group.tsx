import type { HTMLAttributes, Ref } from 'react';
import { cx } from '../../internal/cx';

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** Joins an `Input` (or `InputNumber`) with `InputGroupAddon`s into one control. */
export function InputGroup({ className, ...rest }: InputGroupProps) {
  return <div {...rest} className={cx('tumaet-ui-input-group', className)} />;
}

export interface InputGroupAddonProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** Static text or an icon attached to the start or end of an `InputGroup`. */
export function InputGroupAddon({ className, ...rest }: InputGroupAddonProps) {
  return <div {...rest} className={cx('tumaet-ui-input-group-addon', className)} />;
}
