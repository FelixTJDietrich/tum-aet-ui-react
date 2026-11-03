import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { SelectButton } from './select-button';

const options = ['List', 'Grid', 'Table'];

describe('SelectButton', () => {
  it('selects one option, and clears it again when allowed', async () => {
    const onChange = vi.fn();
    render(<SelectButton aria-label="View" options={options} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(onChange).toHaveBeenLastCalledWith('Grid');
    expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('keeps the selection when allowEmpty is false', async () => {
    render(<SelectButton aria-label="View" options={options} defaultValue="List" allowEmpty={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports multiple selection and object options', async () => {
    const onChange = vi.fn();
    render(
      <SelectButton
        aria-label="Days"
        multiple
        options={[
          { l: 'Mon', v: 1 },
          { l: 'Tue', v: 2 },
        ]}
        optionLabel="l"
        optionValue="v"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Mon' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tue' }));
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
    await userEvent.click(screen.getByRole('button', { name: 'Mon' }));
    expect(onChange).toHaveBeenLastCalledWith([2]);
  });

  it('uses roving focus: one tab stop, arrows, Home and End', async () => {
    render(
      <>
        <SelectButton aria-label="View" options={options} defaultValue="Grid" />
        <button>after</button>
      </>,
    );
    const [list, grid, table] = ['List', 'Grid', 'Table'].map((n) => screen.getByRole('button', { name: n }));
    expect([list, grid, table].map((b) => b!.tabIndex)).toEqual([-1, 0, -1]);
    await userEvent.tab();
    expect(grid).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(table).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(list).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(table).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(list).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(list).toHaveAttribute('aria-pressed', 'true');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
  });

  it('disables all options', () => {
    render(<SelectButton aria-label="View" options={options} disabled />);
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });

  it('has no axe violations', async () => {
    const { container } = render(<SelectButton aria-label="View" options={options} defaultValue="List" />);
    await expectNoA11yViolations(container);
  });

  const spans = [
    { label: 'Day', value: 'DAY' },
    { label: 'Week', value: 'WEEK' },
    { label: 'Month', value: 'MONTH' },
  ];

  it('exposes a group with one button per option, labelled from optionLabel', () => {
    render(<SelectButton aria-label="Span" options={spans} optionLabel="label" optionValue="value" />);
    expect(screen.getByRole('group', { name: 'Span' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Day', 'Week', 'Month']);
  });

  it('omits malformed keyed options instead of rendering unnamed buttons', () => {
    render(
      <SelectButton
        aria-label="Span"
        options={[null, undefined, {}, { label: null, value: 'EMPTY' }, spans[0]]}
        optionLabel="label"
        optionValue="value"
      />,
    );
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Day']);
  });

  it('writes the option value, reflects an external value and clears it by re-click', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SelectButton aria-label="Span" options={spans} optionLabel="label" optionValue="value" onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(onChange).toHaveBeenLastCalledWith('WEEK');
    rerender(
      <SelectButton
        aria-label="Span"
        options={spans}
        optionLabel="label"
        optionValue="value"
        value="MONTH"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Month' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('marks the group aria-disabled and ignores clicks while disabled', async () => {
    const onChange = vi.fn();
    render(<SelectButton aria-label="Span" options={options} disabled onChange={onChange} />);
    expect(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getAllByRole('button')[1]!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders itemTemplate with the raw option, which keeps its own accessible name', () => {
    render(
      <SelectButton
        aria-label="Span"
        options={spans}
        optionValue="value"
        itemTemplate={(o) => <span className="custom-item">{(o as { label: string }).label}</span>}
      />,
    );
    expect([...document.querySelectorAll('.custom-item')].map((e) => e.textContent)).toEqual(['Day', 'Week', 'Month']);
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
  });

  it('applies the size', () => {
    render(<SelectButton aria-label="Span" options={options} size="small" />);
    expect(screen.getByRole('group')).toHaveAttribute('data-size', 'small');
  });
});
