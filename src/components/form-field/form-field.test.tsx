import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Checkbox } from '../checkbox/checkbox';
import { Input } from '../input/input';
import { InputNumber } from '../input-number/input-number';
import { FormField } from './form-field';

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
});
