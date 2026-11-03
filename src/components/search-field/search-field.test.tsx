import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { SearchField } from './search-field';

describe('SearchField', () => {
  it('is a labelled search box using the translated placeholder', () => {
    render(<SearchField />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    expect(input).toHaveAttribute('placeholder', 'Search');
  });

  it('reports each keystroke and shows a clear button that clears and refocuses', async () => {
    const onChange = vi.fn();
    render(<SearchField onChange={onChange} />);
    expect(screen.queryByRole('button')).toBeNull();
    await userEvent.type(screen.getByRole('searchbox'), 'ab');
    expect(onChange).toHaveBeenLastCalledWith('ab');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('clears with the keyboard', async () => {
    render(<SearchField defaultValue="abc" />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('has no axe violations', async () => {
    const { container } = render(<SearchField defaultValue="x" />);
    await expectNoA11yViolations(container);
  });
});
