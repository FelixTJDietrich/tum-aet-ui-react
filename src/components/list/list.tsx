import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, LiHTMLAttributes, Ref } from 'react';
import { cx } from '../../internal/cx';

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  /** Name the list with `aria-label` or `aria-labelledby` when no visible heading sits beside it. */
  ref?: Ref<HTMLUListElement>;
}

/** Bordered, vertically stacked list of `ListItem`s. Renders a native `<ul>`. */
export function List({ className, ...rest }: ListProps) {
  // role="list" keeps the list semantics in Safari/VoiceOver, which drops them for list-style: none.
  return <ul role="list" {...rest} className={cx('tumaet-ui-list', className)} />;
}

export interface ListItemProps extends LiHTMLAttributes<HTMLLIElement> {
  /** Places content in a horizontal row instead of a vertical stack. */
  inline?: boolean;
  ref?: Ref<HTMLLIElement>;
}

/**
 * One row of a `List`. Put a `ListItemAction` inside for a row that navigates or acts;
 * leave it out for a plain content row (it then gets its own padding).
 */
export function ListItem({ inline = false, className, ...rest }: ListItemProps) {
  return <li {...rest} data-inline={inline || undefined} className={cx('tumaet-ui-list-item', className)} />;
}

interface ListItemActionBase {
  /** Marks this row as the one currently shown and sets `aria-current="page"`. */
  active?: boolean;
}
export type ListItemActionProps = ListItemActionBase &
  (
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement> & { ref?: Ref<HTMLAnchorElement> })
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> })
  );

/**
 * The interactive element of a `ListItem`, so the whole row is the click and focus target.
 * With `href` it renders an `<a>` (stays a real link), otherwise a `<button type="button">`.
 */
export function ListItemAction(props: ListItemActionProps) {
  const { active = false, className, ...rest } = props;
  const common = {
    'data-active': active || undefined,
    ...(active ? { 'aria-current': 'page' as const } : {}),
    className: cx('tumaet-ui-list-item-action', className),
  };
  if (props.href !== undefined) {
    const { href, ...anchor } = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return <a {...anchor} href={href} {...common} />;
  }
  const { type = 'button', ...button } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button {...button} type={type} {...common} />;
}
