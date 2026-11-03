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
});
