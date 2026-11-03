import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Paginator } from './paginator';
import { getPaginatorState } from './paginator-utils';

describe('getPaginatorState', () => {
  it('windows five links around the active page', () => {
    expect(getPaginatorState(1000, 0, 10).visiblePages).toEqual([0, 1, 2, 3, 4]);
    expect(getPaginatorState(1000, 10, 10).visiblePages).toEqual([8, 9, 10, 11, 12]);
    expect(getPaginatorState(1000, 99, 10).visiblePages).toEqual([95, 96, 97, 98, 99]);
    expect(getPaginatorState(25, 0, 10).visiblePages).toEqual([0, 1, 2]);
  });
  it('clamps the page and computes the range', () => {
    expect(getPaginatorState(130, 9, 50)).toMatchObject({
      page: 2,
      rangeBegin: 101,
      rangeEnd: 130,
      isLast: true,
      totalPages: 3,
    });
    expect(getPaginatorState(0, 0, 50)).toMatchObject({
      page: 0,
      rangeBegin: 0,
      rangeEnd: 0,
      totalPages: 1,
      isFirst: true,
      isLast: true,
    });
    expect(getPaginatorState(10, -3, 5).page).toBe(0);
  });
});

describe('Paginator', () => {
  it('disables first/previous on the first page and next/last on the last', () => {
    const { rerender } = render(<Paginator totalRecords={130} page={0} pageSize={50} />);
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    rerender(<Paginator totalRecords={130} page={2} pageSize={50} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
  });

  it('reports the range in a live region and marks the current page', () => {
    render(<Paginator totalRecords={130} page={1} pageSize={50} />);
    expect(screen.getByText('Showing 51 to 100 of 130')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current');
  });

  it('requests pages without changing a controlled page', async () => {
    const onPageChange = vi.fn();
    render(<Paginator totalRecords={130} page={1} pageSize={50} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: 'First page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(0);
    await userEvent.click(screen.getByRole('button', { name: 'Last page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('works uncontrolled and is keyboard operable', async () => {
    render(<Paginator totalRecords={100} defaultPageSize={10} />);
    screen.getByRole('button', { name: 'Next page' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('emits the page size from the native select', async () => {
    const onPageSizeChange = vi.fn();
    render(<Paginator totalRecords={100} pageSize={10} onPageSizeChange={onPageSizeChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '50');
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('disables everything when disabled and can hide parts', () => {
    const { rerender } = render(<Paginator totalRecords={100} pageSize={10} disabled />);
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
    expect(screen.getByRole('combobox')).toBeDisabled();
    rerender(<Paginator totalRecords={100} pageSize={10} showRowsPerPage={false} showCurrentPageReport={false} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByText(/Showing/)).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Paginator totalRecords={130} page={1} pageSize={50} />);
    await expectNoA11yViolations(container);
  });
});

describe('Paginator edge cases', () => {
  it('clamps a page past the end for display, like the Angular paginator', () => {
    render(<Paginator totalRecords={30} page={5} pageSize={50} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /^\d+$/ })).toHaveLength(1);
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows an empty result as 0 to 0 of 0 with every navigation button disabled', () => {
    render(<Paginator totalRecords={0} page={0} pageSize={20} />);
    expect(screen.getByText('Showing 0 to 0 of 0')).toBeInTheDocument();
    for (const name of ['First page', 'Previous page', 'Next page', 'Last page']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });

  it('shows at most five page links and 128 records at 20 per page report the last range', () => {
    render(<Paginator totalRecords={128} page={2} pageSize={20} />);
    expect(screen.getAllByRole('button', { name: /^\d+$/ }).map((b) => b.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
    expect(screen.getByText('Showing 41 to 60 of 128')).toBeInTheDocument();
  });

  it('uses a custom aria-label and does not request anything when disabled', async () => {
    const onPageChange = vi.fn();
    render(
      <Paginator aria-label="Results" totalRecords={100} page={1} pageSize={10} disabled onPageChange={onPageChange} />,
    );
    expect(screen.getByRole('navigation', { name: 'Results' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('does not request the page that is already shown', async () => {
    const onPageChange = vi.fn();
    render(<Paginator totalRecords={100} page={1} pageSize={10} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('keeps a page size that is not among the options selectable', () => {
    render(<Paginator totalRecords={100} pageSize={15} pageSizeOptions={[10, 20]} />);
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('15');
  });
});
