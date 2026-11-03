import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { MultiSelect } from './multi-select';

const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
const people = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
];

const trigger = () => screen.getByRole('combobox');
const activeText = () => document.getElementById(trigger().getAttribute('aria-activedescendant')!)?.textContent;

describe('MultiSelect', () => {
  it('shows the placeholder, the labels in option order and a count above maxSelectedLabels', () => {
    const { rerender } = render(<MultiSelect aria-label="Fruit" options={fruits} placeholder="Choose" />);
    expect(trigger()).toHaveTextContent('Choose');
    rerender(<MultiSelect aria-label="Fruit" options={fruits} value={['Cherry', 'Apple']} />);
    expect(trigger()).toHaveTextContent('Apple, Cherry');
    rerender(<MultiSelect aria-label="Fruit" options={fruits} value={['Apple', 'Banana', 'Cherry', 'Date']} />);
    expect(trigger()).toHaveTextContent('4 selected');
    rerender(
      <MultiSelect
        aria-label="Fruit"
        options={fruits}
        value={['Apple', 'Banana', 'Cherry', 'Date']}
        maxSelectedLabels={4}
      />,
    );
    expect(trigger()).toHaveTextContent('Apple, Banana, Cherry, Date');
  });

  it('opens a multiselectable listbox and toggles options without closing', async () => {
    const onChange = vi.fn();
    render(<MultiSelect aria-label="Fruit" options={fruits} defaultValue={['Banana']} onChange={onChange} />);
    await userEvent.click(trigger());
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onChange).toHaveBeenLastCalledWith(['Banana', 'Apple']);
    await userEvent.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onChange).toHaveBeenLastCalledWith(['Apple']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('writes optionValue or the option itself', async () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <MultiSelect aria-label="P" options={people} optionLabel="name" optionValue="id" onChange={onChange} />,
    );
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('option', { name: 'Grace' }));
    expect(onChange).toHaveBeenLastCalledWith([2]);
    unmount();
    render(<MultiSelect aria-label="P" options={people} optionLabel="name" onChange={onChange} />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('option', { name: 'Ada' }));
    expect(onChange).toHaveBeenLastCalledWith([people[0]]);
  });

  it('is controllable', async () => {
    function Controlled() {
      const [value, setValue] = useState<unknown[]>(['Apple']);
      return (
        <>
          <MultiSelect aria-label="Fruit" options={fruits} value={value} onChange={setValue} />
          <button onClick={() => setValue(['Date'])}>external</button>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByText('external'));
    expect(trigger()).toHaveTextContent('Date');
  });

  describe('keyboard', () => {
    it('opens with ArrowDown, navigates, toggles with Enter and Space, closes with Escape and returns focus', async () => {
      const onChange = vi.fn();
      render(<MultiSelect aria-label="Fruit" options={fruits} onChange={onChange} />);
      trigger().focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(activeText()).toBe('Apple');
      await userEvent.keyboard('{ArrowDown}{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(['Banana']);
      await userEvent.keyboard('{ArrowDown} ');
      expect(onChange).toHaveBeenLastCalledWith(['Banana', 'Cherry']);
      await userEvent.keyboard('{End}');
      expect(activeText()).toBe('Elderberry');
      await userEvent.keyboard('{Home}');
      expect(activeText()).toBe('Apple');
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });

    it('closes on Tab without choosing', async () => {
      const onChange = vi.fn();
      render(<MultiSelect aria-label="Fruit" options={fruits} onChange={onChange} />);
      trigger().focus();
      await userEvent.keyboard('{Enter}{Tab}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps focus on the trigger after a mouse selection so the keyboard keeps working', async () => {
      render(<MultiSelect aria-label="Fruit" options={fruits} />);
      await userEvent.click(trigger());
      trigger().focus();
      await userEvent.click(screen.getByRole('option', { name: 'Cherry' }));
      expect(trigger()).toHaveFocus();
    });
  });

  it('lets interactive selected-items content work without toggling the panel', async () => {
    const onRemove = vi.fn();
    render(
      <MultiSelect
        aria-label="Fruit"
        options={fruits}
        defaultValue={['Apple']}
        renderSelectedItems={(selected) =>
          selected.map((o) => (
            <button key={String(o)} onClick={() => onRemove(o)}>
              remove {String(o)}
            </button>
          ))
        }
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'remove Apple' }));
    expect(onRemove).toHaveBeenCalledWith('Apple');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders custom option content with the selected state', async () => {
    render(
      <MultiSelect
        aria-label="Fruit"
        options={fruits}
        defaultValue={['Apple']}
        renderOption={(o, { selected }) => (
          <b>
            {String(o)}
            {selected ? ' (on)' : ''}
          </b>
        )}
      />,
    );
    await userEvent.click(trigger());
    expect(screen.getByRole('option', { name: 'Apple (on)' })).toBeInTheDocument();
  });

  it('reports required, invalid and described-by, shows an empty message, and does not open when disabled', async () => {
    const { rerender } = render(
      <MultiSelect aria-label="Fruit" options={[]} required aria-invalid aria-describedby="hint" />,
    );
    expect(trigger()).toHaveAttribute('aria-required', 'true');
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAttribute('aria-describedby', 'hint');
    await userEvent.click(trigger());
    expect(screen.getByRole('option')).toHaveTextContent('No available options');
    rerender(<MultiSelect aria-label="Fruit" options={fruits} disabled />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(trigger());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('activates the first option when an open, empty control receives options', async () => {
    const { rerender } = render(<MultiSelect aria-label="Fruit" options={[]} />);
    await userEvent.click(trigger());
    expect(trigger()).not.toHaveAttribute('aria-activedescendant');
    rerender(<MultiSelect aria-label="Fruit" options={fruits} />);
    expect(activeText()).toBe('Apple');
  });

  it('closes when disabled while open and stays closed when enabled again', async () => {
    const { rerender, container } = render(<MultiSelect aria-label="Fruit" options={fruits} />);
    await userEvent.click(trigger());
    rerender(<MultiSelect aria-label="Fruit" options={fruits} disabled />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-disabled');
    rerender(<MultiSelect aria-label="Fruit" options={fruits} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('has no accessibility violations closed and open', async () => {
    render(<MultiSelect aria-label="Fruit" options={fruits} defaultValue={['Apple']} />);
    await expectNoA11yViolations();
    await userEvent.click(trigger());
    await expectNoA11yViolations();
  });
});
