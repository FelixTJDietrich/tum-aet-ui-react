import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { Select } from './select';

const fruits = ['Apple', 'Apricot', 'Banana', 'Cherry'];
const people = [
  { id: 1, name: 'Ada Lovelace', login: 'ada' },
  { id: 2, name: 'Grace Hopper', login: 'grace' },
  { id: 3, name: 'Alan Turing', login: 'alan' },
];

const trigger = () => screen.getByRole('combobox');
const optionNames = () => screen.queryAllByRole('option').map((o) => o.textContent);

describe('Select', () => {
  it('shows the placeholder and the label of the selected value', () => {
    const { rerender } = render(<Select aria-label="Fruit" options={fruits} placeholder="Pick one" />);
    expect(trigger()).toHaveTextContent('Pick one');
    rerender(<Select aria-label="Fruit" options={fruits} value="Banana" />);
    expect(trigger()).toHaveTextContent('Banana');
  });

  it('opens a listbox, marks the selected option and selects by click', async () => {
    const onChange = vi.fn();
    render(<Select aria-label="Fruit" options={fruits} defaultValue="Banana" onChange={onChange} />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute('aria-selected', 'true');
    expect(trigger()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Banana' }).id);
    await userEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onChange).toHaveBeenCalledWith('Cherry');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent('Cherry');
    expect(trigger()).toHaveFocus();
  });

  it('writes optionValue for object options and the option itself otherwise', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Select aria-label="Person" options={people} optionLabel="name" optionValue="id" onChange={onChange} />,
    );
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('option', { name: 'Grace Hopper' }));
    expect(onChange).toHaveBeenLastCalledWith(2);
    rerender(<Select aria-label="Person" options={people} optionLabel="name" onChange={onChange} />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('option', { name: 'Ada Lovelace' }));
    expect(onChange).toHaveBeenLastCalledWith(people[0]);
  });

  it('is controllable', async () => {
    function Controlled() {
      const [value, setValue] = useState<unknown>('Apple');
      return (
        <>
          <Select aria-label="Fruit" options={fruits} value={value} onChange={setValue} />
          <button onClick={() => setValue('Cherry')}>external</button>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByText('external'));
    expect(trigger()).toHaveTextContent('Cherry');
  });

  describe('keyboard', () => {
    it('opens with ArrowDown, moves with arrows, Home and End, selects with Enter', async () => {
      const onChange = vi.fn();
      render(<Select aria-label="Fruit" options={fruits} onChange={onChange} />);
      trigger().focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      const active = () => document.getElementById(trigger().getAttribute('aria-activedescendant')!)?.textContent;
      expect(active()).toBe('Apple');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(active()).toBe('Banana');
      await userEvent.keyboard('{End}');
      expect(active()).toBe('Cherry');
      await userEvent.keyboard('{ArrowDown}');
      expect(active()).toBe('Cherry');
      await userEvent.keyboard('{Home}');
      expect(active()).toBe('Apple');
      await userEvent.keyboard('{ArrowDown}{Enter}');
      expect(onChange).toHaveBeenCalledWith('Apricot');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('selects with Space and opens with Enter', async () => {
      const onChange = vi.fn();
      render(<Select aria-label="Fruit" options={fruits} onChange={onChange} />);
      trigger().focus();
      await userEvent.keyboard('{Enter}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await userEvent.keyboard('{ArrowDown} ');
      expect(onChange).toHaveBeenCalledWith('Apricot');
    });

    it('closes with Escape without selecting and returns focus to the trigger', async () => {
      const onChange = vi.fn();
      render(<Select aria-label="Fruit" options={fruits} onChange={onChange} />);
      await userEvent.click(trigger());
      await userEvent.keyboard('{ArrowDown}{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
      expect(trigger()).toHaveFocus();
    });

    it('type-ahead activates matching options and cycles on repeated characters', async () => {
      render(<Select aria-label="Fruit" options={fruits} />);
      trigger().focus();
      await userEvent.keyboard('{ArrowDown}');
      const active = () => document.getElementById(trigger().getAttribute('aria-activedescendant')!)?.textContent;
      await userEvent.keyboard('c');
      expect(active()).toBe('Cherry');
      await new Promise((r) => setTimeout(r, 600));
      await userEvent.keyboard('a');
      expect(active()).toBe('Apple');
      await userEvent.keyboard('a');
      expect(active()).toBe('Apricot');
      await new Promise((r) => setTimeout(r, 600));
      await userEvent.keyboard('ap');
      expect(active()).toBe('Apricot');
    });

    it('typing on the closed trigger opens and activates the match', async () => {
      render(<Select aria-label="Fruit" options={fruits} />);
      trigger().focus();
      await userEvent.keyboard('b');
      const active = document.getElementById(trigger().getAttribute('aria-activedescendant')!);
      expect(active).toHaveTextContent('Banana');
    });

    it('commits the active option on Tab', async () => {
      const onChange = vi.fn();
      render(<Select aria-label="Fruit" options={fruits} onChange={onChange} />);
      trigger().focus();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{Tab}');
      expect(onChange).toHaveBeenCalledWith('Apricot');
    });
  });

  describe('filter', () => {
    it('narrows the list case-insensitively, reports no matches and resets on close', async () => {
      render(<Select aria-label="Fruit" options={fruits} filter />);
      await userEvent.click(trigger());
      const input = screen.getByRole('textbox', { name: 'Filter options' });
      expect(input).toHaveFocus();
      await userEvent.type(input, 'AP');
      expect(optionNames()).toEqual(['Apple', 'Apricot']);
      await userEvent.type(input, 'zzz');
      expect(optionNames()).toEqual(['No matching options']);
      await userEvent.keyboard('{Escape}');
      await userEvent.click(trigger());
      expect(optionNames()).toHaveLength(4);
    });

    it('searches filterBy fields, walks the narrowed list and describes the active option on the field', async () => {
      const onChange = vi.fn();
      render(
        <Select
          aria-label="Person"
          options={people}
          optionLabel="name"
          optionValue="id"
          filter
          filterBy="name,login"
          onChange={onChange}
        />,
      );
      await userEvent.click(trigger());
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'l');
      expect(optionNames()).toEqual(['Ada Lovelace', 'Alan Turing']);
      await userEvent.type(input, 'an');
      expect(optionNames()).toEqual(['Alan Turing']);
      expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option').id);
      await userEvent.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith(3);
    });

    it('puts the first typed character into the filter when opened from the trigger', async () => {
      render(<Select aria-label="Fruit" options={fruits} filter />);
      trigger().focus();
      await userEvent.keyboard('b');
      expect(screen.getByRole('textbox')).toHaveValue('b');
      expect(optionNames()).toEqual(['Banana']);
    });
  });

  it('clears with the clear button and emits null', async () => {
    const onChange = vi.fn();
    render(
      <Select
        aria-label="Fruit"
        options={fruits}
        defaultValue="Apple"
        showClear
        placeholder="none"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(trigger()).toHaveTextContent('none');
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('shows the empty message and the required, invalid and described-by state', async () => {
    render(<Select aria-label="Fruit" options={[]} required aria-invalid aria-describedby="hint" />);
    expect(trigger()).toHaveAttribute('aria-required', 'true');
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAttribute('aria-describedby', 'hint');
    await userEvent.click(trigger());
    expect(optionNames()).toEqual(['No available options']);
  });

  it('does not open when disabled', async () => {
    render(<Select aria-label="Fruit" options={fruits} disabled />);
    await userEvent.click(trigger());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on an outside click', async () => {
    render(
      <>
        <Select aria-label="Fruit" options={fruits} />
        <button>outside</button>
      </>,
    );
    await userEvent.click(trigger());
    await userEvent.click(screen.getByText('outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('has no accessibility violations closed and open', async () => {
    render(<Select aria-label="Fruit" options={fruits} defaultValue="Apple" showClear />);
    await expectNoA11yViolations();
    await userEvent.click(trigger());
    await expectNoA11yViolations();
  });

  it('has no accessibility violations with a filter', async () => {
    render(<Select aria-label="Fruit" options={fruits} filter />);
    await userEvent.click(trigger());
    await expectNoA11yViolations();
  });
});
