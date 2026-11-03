import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { Autocomplete, type AutocompleteProps } from './autocomplete';

const all = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry'];
const input = () => screen.getByRole('combobox');

/** Filters `all` on search, like a consumer would after a request. */
function Harness({ data = all, onSearch, ...props }: Partial<AutocompleteProps> & { data?: readonly unknown[] }) {
  const [suggestions, setSuggestions] = useState<readonly unknown[]>([]);
  return (
    <Autocomplete
      aria-label="Fruit"
      debounceMs={0}
      {...props}
      suggestions={suggestions}
      onSearch={(event) => {
        onSearch?.(event);
        setSuggestions(
          data.filter((d) =>
            String(typeof d === 'object' ? (d as { name: string }).name : d)
              .toLowerCase()
              .startsWith(event.query.toLowerCase()),
          ),
        );
      }}
    />
  );
}

const options = () => screen.queryAllByRole('option').map((o) => o.textContent);
const activeText = () => document.getElementById(input().getAttribute('aria-activedescendant')!)?.textContent;

describe('Autocomplete', () => {
  it('requests suggestions after the debounce and shows them in a listbox', async () => {
    const onSearch = vi.fn();
    render(<Harness onSearch={onSearch} />);
    await userEvent.type(input(), 'ap');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(onSearch).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'ap' }));
    expect(options()).toEqual(['Apple', 'Apricot']);
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    expect(input()).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
  });

  it('emits one debounced search once rapid keystrokes settle, and none below minLength', async () => {
    const onSearch = vi.fn();
    render(<Autocomplete aria-label="Fruit" suggestions={[]} minLength={2} debounceMs={80} onSearch={onSearch} />);
    await userEvent.type(input(), 'a');
    await new Promise((r) => setTimeout(r, 150));
    expect(onSearch).not.toHaveBeenCalled();
    await userEvent.type(input(), 'bc');
    expect(onSearch).not.toHaveBeenCalled();
    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ query: 'abc' }));
  });

  it('single mode: selecting a suggestion sets the text and value, and closes', async () => {
    const onChange = vi.fn();
    const onOptionSelect = vi.fn();
    render(<Harness onChange={onChange} onOptionSelect={onOptionSelect} />);
    await userEvent.type(input(), 'b');
    await userEvent.click(await screen.findByRole('option', { name: 'Blueberry' }));
    expect(onChange).toHaveBeenLastCalledWith('Blueberry');
    expect(onOptionSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'Blueberry' }));
    expect(input()).toHaveValue('Blueberry');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input()).toHaveFocus();
  });

  it('single mode: typing mirrors the text through onChange and clearing emits null', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(input(), 'ab');
    expect(onChange).toHaveBeenLastCalledWith('ab');
    await userEvent.clear(input());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('reads object labels via optionLabel', async () => {
    const people = [{ name: 'Ada' }, { name: 'Alan' }];
    render(<Harness data={people} optionLabel="name" />);
    await userEvent.type(input(), 'a');
    await userEvent.click(await screen.findByRole('option', { name: 'Alan' }));
    expect(input()).toHaveValue('Alan');
  });

  describe('keyboard', () => {
    it('ArrowDown/ArrowUp move aria-activedescendant and Enter selects', async () => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      await userEvent.type(input(), 'a');
      await screen.findByRole('listbox');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeText()).toBe('Apple');
      await userEvent.keyboard('{ArrowDown}');
      expect(activeText()).toBe('Apricot');
      await userEvent.keyboard('{ArrowUp}');
      expect(activeText()).toBe('Apple');
      await userEvent.keyboard('{ArrowDown}{Enter}');
      expect(onChange).toHaveBeenLastCalledWith('Apricot');
    });

    it('Escape closes the suggestions and clears the active descendant', async () => {
      render(<Harness />);
      await userEvent.type(input(), 'a');
      await screen.findByRole('listbox');
      await userEvent.keyboard('{ArrowDown}{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input()).not.toHaveAttribute('aria-activedescendant');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });

    it('does not intercept Tab or Enter when no option is active', async () => {
      const onChange = vi.fn();
      render(
        <>
          <Harness onChange={onChange} multiple />
          <button>next</button>
        </>,
      );
      await userEvent.type(input(), 'a');
      await screen.findByRole('listbox');
      await userEvent.keyboard('{Enter}');
      expect(onChange).not.toHaveBeenCalled();
      await userEvent.tab();
      expect(screen.getByText('next')).toHaveFocus();
    });

    it('skips disabled suggestions', async () => {
      const data = [{ name: 'One' }, { name: 'Off', off: true }, { name: 'Two' }];
      render(
        <Autocomplete aria-label="x" completeOnFocus suggestions={data} optionLabel="name" optionDisabled="off" />,
      );
      await userEvent.click(input());
      await screen.findByRole('listbox');
      expect(screen.getByRole('option', { name: 'Off' })).toHaveAttribute('aria-disabled', 'true');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(activeText()).toBe('Two');
      await userEvent.click(screen.getByRole('option', { name: 'Off' }));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('multiple', () => {
    it('adds chips, ignores duplicates, removes by button and by Backspace', async () => {
      const onChange = vi.fn();
      const onOptionRemove = vi.fn();
      render(<Harness multiple placeholder="Add" onChange={onChange} onOptionRemove={onOptionRemove} />);
      await userEvent.type(input(), 'a');
      await userEvent.click(await screen.findByRole('option', { name: 'Apple' }));
      expect(onChange).toHaveBeenLastCalledWith(['Apple']);
      expect(input()).toHaveValue('');
      expect(input()).not.toHaveAttribute('placeholder');
      await userEvent.type(input(), 'a');
      expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
      await userEvent.click(screen.getByRole('option', { name: 'Apple' }));
      expect(onChange).toHaveBeenCalledTimes(1);
      await userEvent.type(input(), 'a');
      await userEvent.click(await screen.findByRole('option', { name: 'Apricot' }));
      expect(onChange).toHaveBeenLastCalledWith(['Apple', 'Apricot']);
      await userEvent.keyboard('{Backspace}');
      expect(onChange).toHaveBeenLastCalledWith(['Apple']);
      expect(onOptionRemove).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'Apricot' }));
      await userEvent.click(screen.getByRole('button', { name: 'Remove Apple' }));
      expect(onChange).toHaveBeenLastCalledWith([]);
      expect(input()).toHaveFocus();
    });

    it('dismisses the query and suggestions when an already chosen suggestion is picked', async () => {
      const onChange = vi.fn();
      const onOptionSelect = vi.fn();
      render(<Harness multiple defaultValue={['Apple']} onChange={onChange} onOptionSelect={onOptionSelect} />);
      await userEvent.type(input(), 'a');
      await userEvent.click(await screen.findByRole('option', { name: 'Apple' }));
      expect(onChange).not.toHaveBeenCalled();
      expect(onOptionSelect).not.toHaveBeenCalled();
      expect(input()).toHaveValue('');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input()).toHaveFocus();
    });

    it('renders chips for a value and no remove buttons when disabled', () => {
      const { rerender } = render(<Autocomplete aria-label="Fruit" multiple value={['Apple', 'Banana']} />);
      expect(screen.getAllByRole('button')).toHaveLength(2);
      rerender(<Autocomplete aria-label="Fruit" multiple disabled value={['Apple', 'Banana']} />);
      expect(screen.queryAllByRole('button')).toHaveLength(0);
      expect(input()).toBeDisabled();
    });
  });

  it('requests suggestions on focus with completeOnFocus, and shows the empty message', async () => {
    const onSearch = vi.fn();
    render(<Autocomplete aria-label="Fruit" completeOnFocus suggestions={[]} onSearch={onSearch} />);
    await userEvent.click(input());
    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ query: '' }));
    expect(options()).toEqual(['No results found']);
  });

  it('exposes required, invalid and described-by on the input', () => {
    render(<Autocomplete aria-label="Fruit" required aria-invalid aria-describedby="hint" />);
    expect(input()).toHaveAttribute('aria-required', 'true');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toHaveAttribute('aria-describedby', 'hint');
  });

  it('has no accessibility violations closed and open, with chips', async () => {
    render(<Harness multiple defaultValue={['Banana']} />);
    await expectNoA11yViolations();
    await userEvent.type(input(), 'a');
    await screen.findByRole('listbox');
    await expectNoA11yViolations();
  });
});
