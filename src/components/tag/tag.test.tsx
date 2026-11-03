import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../test-utils';
import { Tag } from './tag';

describe('Tag', () => {
  it('renders value or children and exposes data attributes', () => {
    const { rerender } = render(<Tag value="From value" severity="danger" size="sm" />);
    expect(screen.getByText('From value')).toMatchObject({ dataset: { severity: 'danger', size: 'sm' } });
    rerender(<Tag>Child</Tag>);
    expect(screen.getByText('Child')).toMatchObject({ dataset: { severity: 'secondary', size: 'md' } });
  });

  it('applies the rounded class and merges className', () => {
    render(
      <Tag rounded className="x">
        T
      </Tag>,
    );
    expect(screen.getByText('T')).toHaveClass('tumaet-ui-tag', 'tumaet-ui-tag-rounded', 'x');
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <Tag severity="success">Done</Tag>
      </main>,
    );
    await expectNoA11yViolations();
  });
});
