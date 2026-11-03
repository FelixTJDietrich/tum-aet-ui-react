import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';

/** What a FormField tells the control it wraps. */
export interface FormFieldContextValue {
  /** Id of the field's `<label for>` target. A control without an id of its own adopts it. */
  controlId: string;
  /** The explicit `controlId` set on the field. It wins over an id the control brought itself. */
  explicitControlId?: string;
  /** Id of the `<label>`. Controls whose focusable element is not labelable (e.g. `role="combobox"` on a div) use it for `aria-labelledby`. */
  labelId: string;
  /** Ids of the text currently describing the field (the error while invalid, otherwise the hint). */
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  /** Reports an id the control brought with it, so the label targets the real element. */
  adoptControlId: (id: string) => void;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/** The enclosing FormField, or `null` outside one. */
export function useFormFieldContext(): FormFieldContextValue | null {
  return useContext(FormFieldContext);
}

export interface FormFieldControlOptions {
  /** An id the control brought with it. */
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
  /** Marks the control invalid in addition to an invalid enclosing field. */
  invalid?: boolean;
}

export interface FormFieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined;
  invalid: boolean;
}

/**
 * For controls: resolves id, `aria-describedby` and `aria-invalid` from the enclosing FormField and the control's own props.
 * Id order: explicit field `controlId`, the control's own id, the field's generated id, a generated fallback.
 * `aria-invalid` is omitted rather than `"false"` while valid.
 */
export function useFormFieldControl(options: FormFieldControlOptions = {}): FormFieldControlProps {
  const field = useFormFieldContext();
  const fallbackId = useId();
  const own = options.id;
  const adopt = field?.adoptControlId;
  useLayoutEffect(() => {
    if (own) adopt?.(own);
  }, [own, adopt]);
  const id = field?.explicitControlId ?? own ?? field?.controlId ?? fallbackId;
  const describedBy = [options['aria-describedby'], field?.describedBy].filter(Boolean).join(' ') || undefined;
  const invalid = Boolean(options.invalid) || (field?.invalid ?? false);
  const ariaInvalid = options['aria-invalid'] ?? (invalid ? true : undefined);
  return {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    invalid: invalid || ariaInvalid === true || ariaInvalid === 'true',
  };
}

/** Elements the browser focuses itself when their `<label for>` is clicked. */
const LABELABLE = 'button, input, meter, output, progress, select, textarea';

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Label content. */
  label?: ReactNode;
  /** Id of the control. Defaults to a generated id, which the control adopts unless it brings its own. */
  controlId?: string;
  /** Renders a decorative required marker. The control still needs its own `required`. */
  required?: boolean;
  /** Helper text shown while the field is valid. */
  hint?: ReactNode;
  /** Shows the error and marks the control invalid. */
  invalid?: boolean;
  /** Error text, shown while `invalid`. */
  error?: ReactNode;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const isPresent = (node: ReactNode) =>
  node !== undefined &&
  node !== null &&
  node !== false &&
  node !== '' &&
  !(typeof node === 'string' && node.trim() === '');

/**
 * Labelled wrapper around one control. It owns the label, the required marker, hint and error text and wires
 * `for`, `aria-describedby` and `aria-invalid` to the control through context.
 */
export function FormField({
  label,
  controlId,
  required = false,
  hint,
  invalid = false,
  error,
  className,
  children,
  onClick,
  ...rest
}: FormFieldProps) {
  const base = useId();
  const [adopted, setAdopted] = useState<string>();
  const generatedId = `${base}-control`;
  const labelId = `${base}-label`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const targetId = controlId ?? adopted ?? generatedId;
  const showHint = isPresent(hint) && !invalid;
  const describedBy = invalid ? errorId : showHint ? hintId : undefined;
  const adoptControlId = useCallback((id: string) => setAdopted(id), []);

  const value = useMemo<FormFieldContextValue>(
    () => ({
      controlId: targetId,
      explicitControlId: controlId,
      labelId,
      describedBy,
      invalid,
      required,
      adoptControlId,
    }),
    [targetId, controlId, labelId, describedBy, invalid, required, adoptControlId],
  );

  /** Clicking the label focuses a control the browser would not focus itself (a focusable div, for example). */
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (!(event.target instanceof Element) || !event.target.closest('.tumaet-ui-form-field-label')) return;
    const target = document.getElementById(targetId);
    if (target && !target.matches(LABELABLE)) target.focus();
  };

  return (
    <FormFieldContext value={value}>
      <div {...rest} className={cx('tumaet-ui-form-field', className)} onClick={handleClick}>
        {label != null && label !== false && label !== '' && (
          <label id={labelId} htmlFor={targetId} className="tumaet-ui-form-field-label">
            {label}
            {required && (
              <span className="tumaet-ui-form-field-required" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="tumaet-ui-form-field-control">{children}</div>
        {showHint && (
          <span id={hintId} className="tumaet-ui-form-field-hint">
            {hint}
          </span>
        )}
        <div id={errorId} className="tumaet-ui-form-field-error" role="alert" hidden={!invalid}>
          {error}
        </div>
      </div>
    </FormFieldContext>
  );
}
