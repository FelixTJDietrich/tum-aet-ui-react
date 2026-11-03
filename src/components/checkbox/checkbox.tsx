import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { CheckIcon, MinusIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllable } from '../../internal/use-controllable';
import { useFormFieldControl } from '../form-field/form-field';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'checked' | 'defaultChecked' | 'onChange' | 'className' | 'style'
> {
  checked?: boolean;
  defaultChecked?: boolean;
  /** Called with the new state and the originating event. */
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  /** Shows the partial-selection dash. Purely visual and exposed as the native indeterminate state; `checked` is unchanged. */
  indeterminate?: boolean;
  invalid?: boolean;
  /** Class of the wrapper element. */
  className?: string;
  /** Style of the wrapper element. */
  style?: CSSProperties;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Native checkbox with the TUM AET UI look. Native props (`id`, `name`, `value`, `aria-*`, ...) go to the `<input>`;
 * `className` and `style` go to the wrapper. Label it with a `<label htmlFor>` or `aria-label`.
 */
export function Checkbox({
  checked,
  defaultChecked = false,
  onChange,
  indeterminate = false,
  invalid,
  disabled,
  className,
  style,
  ref,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: CheckboxProps) {
  const control = useFormFieldControl({ id, invalid, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid });
  const [isChecked, setChecked] = useControllable<boolean>(checked, defaultChecked);
  const inputRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate, isChecked]);

  return (
    <span
      className={cx('tumaet-ui-checkbox', className)}
      style={style}
      data-checked={isChecked || undefined}
      data-indeterminate={indeterminate || undefined}
      data-disabled={disabled || undefined}
      data-invalid={control.invalid || undefined}
    >
      <input
        {...rest}
        ref={mergeRefs(inputRef, ref)}
        type="checkbox"
        id={control.id}
        aria-describedby={control['aria-describedby']}
        aria-invalid={control['aria-invalid']}
        className="tumaet-ui-checkbox-input"
        checked={isChecked}
        disabled={disabled}
        onChange={(event) => {
          setChecked(event.target.checked);
          onChange?.(event.target.checked, event);
        }}
      />
      <span className="tumaet-ui-checkbox-box" aria-hidden="true">
        {indeterminate ? (
          <MinusIcon className="tumaet-ui-icon tumaet-ui-checkbox-icon" />
        ) : isChecked ? (
          <CheckIcon className="tumaet-ui-icon tumaet-ui-checkbox-icon" />
        ) : null}
      </span>
    </span>
  );
}
