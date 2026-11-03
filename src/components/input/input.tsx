import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from 'react';
import { cx } from '../../internal/cx';
import { useFormFieldControl } from '../form-field/form-field';

export type InputSize = 'small' | 'default' | 'large';

interface InputCommon {
  size?: InputSize;
  /** Marks the control invalid (also set by an enclosing invalid FormField). */
  invalid?: boolean;
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, InputCommon {
  ref?: Ref<HTMLInputElement>;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, InputCommon {
  ref?: Ref<HTMLTextAreaElement>;
}

/** Native `<input>` with the TUM AET UI look. Takes id, description and invalid state from an enclosing FormField. */
export function Input({
  size = 'default',
  invalid,
  id,
  className,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: InputProps) {
  const control = useFormFieldControl({ id, invalid, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid });
  return (
    <input
      {...rest}
      id={control.id}
      aria-describedby={control['aria-describedby']}
      aria-invalid={control['aria-invalid']}
      data-size={size}
      data-invalid={control.invalid || undefined}
      className={cx('tumaet-ui-input', className)}
    />
  );
}

/** Native `<textarea>` with the same look as {@link Input}. */
export function Textarea({
  size = 'default',
  invalid,
  id,
  className,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: TextareaProps) {
  const control = useFormFieldControl({ id, invalid, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid });
  return (
    <textarea
      {...rest}
      id={control.id}
      aria-describedby={control['aria-describedby']}
      aria-invalid={control['aria-invalid']}
      data-size={size}
      data-invalid={control.invalid || undefined}
      className={cx('tumaet-ui-input', className)}
    />
  );
}
