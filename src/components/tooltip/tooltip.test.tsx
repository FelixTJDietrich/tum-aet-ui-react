import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { Tooltip, type TooltipProps } from './tooltip';

function Host(props: Partial<TooltipProps> & { describedBy?: string }) {
  return (
    <Tooltip content="Helpful hint" {...props}>
      <button aria-describedby={props.describedBy}>Host</button>
    </Tooltip>
  );
}

const host = () => screen.getByRole('button', { name: 'Host' });

describe('Tooltip', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());
  const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

  it('shows after the delay on hover and links the host through aria-describedby', async () => {
    render(<Host />);
    await userEvent.hover(host());
    expect(screen.queryByRole('tooltip')).toBeNull();
    await advance(150);
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Helpful hint');
    expect(host()).toHaveAccessibleDescription('Helpful hint');
    expect(host().getAttribute('aria-describedby')).toContain(tip.id);
  });

  it('hides after the delay on mouse leave and removes its id', async () => {
    render(<Host describedBy="external" />);
    await userEvent.hover(host());
    await advance(150);
    expect(host().getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
    await userEvent.unhover(host());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await advance(100);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(host()).toHaveAttribute('aria-describedby', 'external');
  });

  it('shows on keyboard focus and hides on blur', async () => {
    render(<Host />);
    await userEvent.tab();
    expect(host()).toHaveFocus();
    await advance(150);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await userEvent.tab();
    await advance(100);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('dismisses on Escape without moving focus', async () => {
    render(<Host />);
    await userEvent.tab();
    await advance(150);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(host()).toHaveFocus();
  });

  it('cancels a pending show on Escape', async () => {
    render(<Host />);
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    await advance(300);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('hides when the host is pressed and is not held open by the focus the press causes', async () => {
    render(<Host />);
    await userEvent.hover(host());
    await advance(150);
    await userEvent.click(host());
    expect(screen.queryByRole('tooltip')).toBeNull();
    await userEvent.unhover(host());
    await advance(300);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('stays visible after mouse leave while keyboard focus is active', async () => {
    render(<Host />);
    await userEvent.tab();
    await userEvent.hover(host());
    await advance(150);
    await userEvent.unhover(host());
    await advance(300);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('is not shown for touch hover or a tap', async () => {
    render(<Host />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const button = host();
    await user.pointer({ keys: '[TouchA]', target: button });
    await advance(300);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows nothing for empty content and renders a list for several items', async () => {
    const { rerender } = render(<Host content="" />);
    await userEvent.hover(host());
    await advance(300);
    expect(screen.queryByRole('tooltip')).toBeNull();
    rerender(<Host content={['One', 'Two']} />);
    await userEvent.unhover(host());
    await userEvent.hover(host());
    await advance(150);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['One', 'Two']);
  });

  it('does not describe the host when describesHost is false', async () => {
    render(<Host describesHost={false} />);
    await userEvent.hover(host());
    await advance(150);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(host()).not.toHaveAttribute('aria-describedby');
  });

  it('has no accessibility violations', async () => {
    render(<Host />);
    await userEvent.tab();
    await advance(150);
    // The tooltip is portaled to the body, outside any landmark, so the page-level `region` rule does not apply.
    const results = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations.map((v) => v.id)).toEqual([]);
    expect(host()).toHaveAccessibleDescription('Helpful hint');
  });
});
