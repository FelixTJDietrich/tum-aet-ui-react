import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../test-utils';
import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  it('exposes the clamped value and a visible label', () => {
    const { rerender } = render(<ProgressBar aria-label="Upload" value={42} />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveTextContent('42%');
    rerender(<ProgressBar aria-label="Upload" value={250} />);
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    rerender(<ProgressBar aria-label="Upload" value={Number.NaN} />);
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('can hide the value and use a custom unit', () => {
    const { rerender } = render(<ProgressBar aria-label="x" value={30} showValue={false} />);
    expect(screen.getByRole('progressbar')).not.toHaveTextContent('30');
    rerender(<ProgressBar aria-label="x" value={30} unit=" MB" />);
    expect(screen.getByRole('progressbar')).toHaveTextContent('30 MB');
  });

  it('omits aria-valuenow when indeterminate', () => {
    render(<ProgressBar aria-label="Loading" indeterminate />);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('data-indeterminate');
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <>
          <ProgressBar aria-label="A" value={10} />
          <ProgressBar aria-label="B" indeterminate />
        </>
        ,
      </main>,
    );
    await expectNoA11yViolations();
  });
});
