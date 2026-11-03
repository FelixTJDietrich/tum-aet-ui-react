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

  it('prefers label over children, reflects size, and does not remove on other keys or when not removable', async () => {
    const onRemove = vi.fn();
    const { container } = render(
      <Chip label="Label" size="small" removable onRemove={onRemove}>
        Child
      </Chip>,
    );
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.queryByText('Child')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('data-size', 'small');
    expect(container.firstElementChild).toHaveAttribute('data-removable');
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledOnce();
    await userEvent.keyboard('{Escape}');
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
