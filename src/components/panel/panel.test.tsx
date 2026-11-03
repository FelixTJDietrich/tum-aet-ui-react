import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Panel } from './panel';

describe('Panel', () => {
  it('has no toggle unless toggleable', () => {
    render(<Panel header="Static">Body</Panel>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('toggles with the keyboard and keeps aria-expanded, aria-controls and inert in sync', async () => {
    const onCollapsedChange = vi.fn();
    render(
      <Panel header="Details" toggleable onCollapsedChange={onCollapsedChange}>
        Body
      </Panel>,
    );
    const button = screen.getByRole('button', { name: 'Details' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: 'Details' });
    expect(button).toHaveAttribute('aria-controls', region.id);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(region).toHaveAttribute('aria-hidden', 'true');
    expect(region).toHaveAttribute('inert');
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(region).not.toHaveAttribute('inert');
  });

  it('supports controlled collapsed state', async () => {
    const { rerender } = render(
      <Panel header="H" toggleable collapsed>
        Body
      </Panel>,
    );
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    rerender(
      <Panel header="H" toggleable collapsed={false}>
        Body
      </Panel>,
    );
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('uses translated Collapse/Expand without header and a custom label when given', async () => {
    const { rerender } = render(<Panel toggleable>Body</Panel>);
    await userEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
    rerender(
      <Panel header={<b>X</b>} toggleable toggleLabel="Custom">
        Body
      </Panel>,
    );
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <>
          <Panel header="One" toggleable>
            A
          </Panel>
          <Panel header="Two" toggleable defaultCollapsed>
            B
          </Panel>
        </>
        ,
      </main>,
    );
    await expectNoA11yViolations();
  });
});
