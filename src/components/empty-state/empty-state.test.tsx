import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../test-utils';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders the title as a level 2 heading by default and honours headingLevel', () => {
    const { rerender } = render(<EmptyState title="Nothing" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Nothing' })).toBeInTheDocument();
    rerender(<EmptyState title="Nothing" headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('only renders optional slots when given and hides the icon from assistive technology', () => {
    const { container, rerender } = render(<EmptyState title="T" />);
    expect(container.querySelector('.tumaet-ui-empty-state-actions')).toBeNull();
    expect(container.querySelector('.tumaet-ui-empty-state-documentation')).toBeNull();
    rerender(
      <EmptyState
        title="T"
        icon={<svg />}
        description="Desc"
        actions={<button>Go</button>}
        documentation={<a href="#x">Docs</a>}
        variant="solid"
      />,
    );
    expect(container.querySelector('.tumaet-ui-empty-state-icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Docs' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'solid');
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <EmptyState
          title="T"
          description="D"
          icon={<svg />}
          actions={<button>Go</button>}
          documentation={<a href="#x">Docs</a>}
        />
      </main>,
    );
    await expectNoA11yViolations();
  });

  it('renders children between description and actions, and every variant', () => {
    const { container, rerender } = render(
      <EmptyState title="T" description="D" actions={<button>Go</button>}>
        <span data-testid="extra" />
      </EmptyState>,
    );
    const order = [...container.firstElementChild!.children].map((el) => el.className || el.tagName);
    expect(order).toEqual([
      'tumaet-ui-empty-state-title',
      'tumaet-ui-empty-state-description',
      'SPAN',
      'tumaet-ui-empty-state-actions',
    ]);
    for (const variant of ['outlined', 'solid', 'plain'] as const) {
      rerender(<EmptyState title="T" variant={variant} />);
      expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
    }
  });
});
