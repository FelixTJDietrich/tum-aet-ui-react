import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../test-utils';
import { ProgressSpinner } from './progress-spinner';

describe('ProgressSpinner', () => {
  it('is a busy status region with the given name', () => {
    render(<ProgressSpinner aria-label="Loading data" />);
    const spinner = screen.getByRole('status', { name: 'Loading data' });
    expect(spinner).toHaveAttribute('aria-busy', 'true');
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <ProgressSpinner aria-label="Loading" />
      </main>,
    );
    await expectNoA11yViolations();
  });

  it('renders the animated circle and hides the svg from assistive technology', () => {
    const { container } = render(<ProgressSpinner />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    const circle = container.querySelector('.tumaet-ui-progress-spinner-circle');
    expect(circle).toHaveAttribute('fill', 'none');
    expect(circle).toHaveAttribute('stroke-width', '2');
  });
});
