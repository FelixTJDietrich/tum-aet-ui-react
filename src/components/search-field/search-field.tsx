import { useRef, type CSSProperties, type ChangeEvent, type Ref } from 'react';
import { cx } from '../../internal/cx';
import { SearchIcon, XIcon } from '../../internal/icons';
import { useTranslate } from '../../internal/i18n';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllable } from '../../internal/use-controllable';
import { Input, type InputProps } from '../input/input';

export interface SearchFieldProps extends Omit<
  InputProps,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'className' | 'style' | 'ref'
> {
  value?: string;
  defaultValue?: string;
  /** Called on every keystroke and on clear with the new term. */
  onChange?: (value: string) => void;
  /** Defaults to the translated "Search". Also the accessible name unless `aria-label` is given. */
  placeholder?: string;
  /** Class of the wrapper element. */
  className?: string;
  /** Style of the wrapper element. */
  style?: CSSProperties;
  /** Class of the inner `<input>`. */
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Text field for filtering a view: leading magnifier and a clear button once there is a term. Native props go to the `<input type="search">`. */
export function SearchField({
  value,
  defaultValue = '',
  onChange,
  placeholder,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  className,
  style,
  inputClassName,
  disabled,
  ref,
  ...rest
}: SearchFieldProps) {
  const t = useTranslate();
  const [term, setTerm] = useControllable<string>(value, defaultValue, onChange);
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholderText = placeholder ?? t('tumAetUi.searchField.placeholder');

  return (
    <div className={cx('tumaet-ui-search-field', className)} style={style}>
      <span className="tumaet-ui-search-field-icon" aria-hidden="true">
        <SearchIcon />
      </span>
      <Input
        {...rest}
        ref={mergeRefs(inputRef, ref)}
        type="search"
        className={inputClassName}
        value={term}
        disabled={disabled}
        placeholder={placeholderText}
        aria-label={labelledBy ? ariaLabel : (ariaLabel ?? placeholderText)}
        aria-labelledby={labelledBy}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setTerm(event.target.value)}
      />
      {term && (
        <button
          type="button"
          className="tumaet-ui-search-field-clear"
          disabled={disabled}
          aria-label={t('tumAetUi.searchField.clear')}
          onClick={() => {
            setTerm('');
            inputRef.current?.focus();
          }}
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}
