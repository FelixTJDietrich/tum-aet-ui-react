import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Chip } from './chip';

describe('Chip', () => {
  it('renders the label and no button unless removable', () => {
    render(<Chip label="One" />);
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has a translated remove button that fires onRemove on click', async () => {
    const onRemove = vi.fn();
    render(
      <Chip removable onRemove={onRemove}>
        Two
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('removes with Backspace and Delete when the button is focused, not with other keys', async () => {
    const onRemove = vi.fn();
    render(<Chip removable label="Three" removeLabel="Remove Three" onRemove={onRemove} />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Remove Three' })).toHaveFocus();
    await userEvent.keyboard('{Backspace}');
    await userEvent.keyboard('{Delete}');
    expect(onRemove).toHaveBeenCalledTimes(2);
    await userEvent.keyboard('a');
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <Chip removable label="Axe" />
      </main>,
    );
    await expectNoA11yViolations();
  });
});
