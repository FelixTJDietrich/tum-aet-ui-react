import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Checkbox } from '../checkbox/checkbox';
import { Input } from '../input/input';
import { InputNumber } from '../input-number/input-number';
import { Select } from '../select/select';
import { MultiSelect } from '../multi-select/multi-select';
import { Autocomplete } from '../autocomplete/autocomplete';
import { DatePicker } from '../date-picker/date-picker';
import { FormField, useFormFieldContext } from './form-field';

describe('FormField', () => {
  it('labels the control and shows the required marker', () => {
    render(
      <FormField label="Login" required>
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText(/Login/);
    expect(input.tagName).toBe('INPUT');
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('describes by the hint, then by the error while invalid', () => {
    const { rerender } = render(
      <FormField label="Login" hint="Your id" error="Required">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('Login');
    expect(input).toHaveAccessibleDescription('Your id');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('alert', { hidden: true })).not.toBeVisible();

    rerender(
      <FormField label="Login" hint="Your id" error="Required" invalid>
        <Input />
      </FormField>,
    );
    expect(input).toHaveAccessibleDescription('Required');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
    expect(screen.queryByText('Your id')).not.toBeInTheDocument();
  });

  it('adopts an own id and an explicit controlId, and merges aria-describedby', () => {
    render(
      <>
        <FormField label="A">
          <Input id="own" />
        </FormField>
        <FormField label="B" controlId="explicit">
          <Input />
        </FormField>
        <FormField label="C" hint="hint">
          <Input aria-describedby="extra" />
        </FormField>
      </>,
    );
    expect(screen.getByLabelText('A')).toHaveAttribute('id', 'own');
    expect(screen.getByLabelText('B')).toHaveAttribute('id', 'explicit');
    expect(screen.getByLabelText('C').getAttribute('aria-describedby')).toMatch(/^extra .+-hint$/);
  });

  it('wires other controls too', () => {
    render(
      <>
        <FormField label="Points" hint="h">
          <InputNumber />
        </FormField>
        <FormField label="Agree">
          <Checkbox />
        </FormField>
      </>,
    );
    expect(screen.getByRole('spinbutton', { name: 'Points' })).toHaveAccessibleDescription('h');
    expect(screen.getByRole('checkbox', { name: 'Agree' })).toBeInTheDocument();
  });

  it('focuses the control by keyboard and label click', async () => {
    render(
      <FormField label="Login">
        <Input />
      </FormField>,
    );
    await userEvent.click(screen.getByText('Login'));
    expect(screen.getByLabelText('Login')).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <FormField label="Login" hint="Your id" required>
        <Input />
      </FormField>,
    );
    await expectNoA11yViolations(container);
    const invalid = render(
      <FormField label="Mail" invalid error="Bad">
        <Input />
      </FormField>,
    );
    await expectNoA11yViolations(invalid.container);
  });

  it('renders no required marker, hint element or description by default', () => {
    const { container } = render(
      <FormField label="Login">
        <Input />
      </FormField>,
    );
    expect(container.querySelector('.tumaet-ui-form-field-required')).toBeNull();
    expect(container.querySelector('.tumaet-ui-form-field-hint')).toBeNull();
    expect(screen.getByLabelText('Login')).not.toHaveAttribute('aria-describedby');
    expect(screen.getByLabelText('Login').id).toBeTruthy();
  });

  it('ignores a blank hint', () => {
    const { container } = render(
      <FormField label="Login" hint="   ">
        <Input />
      </FormField>,
    );
    expect(container.querySelector('.tumaet-ui-form-field-hint')).toBeNull();
  });

  it('labels an own id over the generated one, and prefers an explicit controlId over both', () => {
    render(
      <>
        <FormField label="A">
          <Input id="own" />
        </FormField>
        <FormField label="B" controlId="login">
          <Input id="own-b" />
        </FormField>
      </>,
    );
    expect(screen.getByText('A').closest('label')).toHaveAttribute('for', 'own');
    expect(screen.getByText('B').closest('label')).toHaveAttribute('for', 'login');
    expect(screen.getByLabelText('B')).toHaveAttribute('id', 'login');
  });

  it('keeps the error region in the DOM, hidden and out of the description while valid', () => {
    const { container } = render(
      <FormField label="Login" error="Login is required">
        <Input />
      </FormField>,
    );
    const error = container.querySelector<HTMLElement>('.tumaet-ui-form-field-error')!;
    expect(error).toHaveAttribute('role', 'alert');
    expect(error.hidden).toBe(true);
    expect(screen.getByLabelText('Login')).not.toHaveAttribute('aria-describedby');
  });

  it('passes the invalid state to the control and removes it again', () => {
    const { rerender } = render(
      <FormField label="Login" invalid>
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('Login');
    expect(input).toHaveAttribute('data-invalid');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    rerender(
      <FormField label="Login">
        <Input />
      </FormField>,
    );
    expect(input).not.toHaveAttribute('data-invalid');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('focuses a control the browser would not focus itself when the label is clicked', async () => {
    function Custom() {
      const field = useFormFieldContext();
      return <div id={field?.controlId} tabIndex={0} role="combobox" aria-expanded="false" aria-label="x" />;
    }
    render(
      <FormField label="Pick">
        <Custom />
      </FormField>,
    );
    await userEvent.click(screen.getByText('Pick'));
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('names Select, MultiSelect, Autocomplete and DatePicker through the label and describes them with the error', () => {
    render(
      <>
        <FormField label="Language" error="Pick one" invalid>
          <Select options={[{ value: 'de', label: 'German' }]} />
        </FormField>
        <FormField label="Tags">
          <MultiSelect options={[{ value: 'a', label: 'A' }]} />
        </FormField>
        <FormField label="Course">
          <Autocomplete suggestions={[]} />
        </FormField>
        <FormField label="Deadline">
          <DatePicker />
        </FormField>
      </>,
    );
    const language = screen.getByRole('combobox', { name: 'Language' });
    expect(language).toHaveAttribute('aria-invalid', 'true');
    expect(language).toHaveAccessibleDescription('Pick one');
    expect(screen.getByRole('combobox', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Course' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Deadline' })).toBeInTheDocument();
  });

  it('renders no empty label element when there is no label', () => {
    const { container } = render(
      <FormField>
        <Checkbox aria-label="Agree" />
      </FormField>,
    );
    expect(container.querySelector('label.tumaet-ui-form-field-label')).toBeNull();
  });
});
