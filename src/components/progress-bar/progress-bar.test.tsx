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
      </main>,
    );
    await expectNoA11yViolations();
  });

  it('clamps the fill width and the label, and shows no label at 0', () => {
    const { container, rerender } = render(<ProgressBar aria-label="x" value={130} />);
    const fill = container.querySelector('.tumaet-ui-progress-bar-value') as HTMLElement;
    const label = container.querySelector('.tumaet-ui-progress-bar-label') as HTMLElement;
    expect(fill.style.width).toBe('100%');
    expect(label).toHaveTextContent('100%');
    rerender(<ProgressBar aria-label="x" value={-10} />);
    expect(fill.style.width).toBe('0%');
    expect(label).toBeEmptyDOMElement();
  });

  it('renders children instead of the default label, and reflects size and severity', () => {
    const { container } = render(
      <ProgressBar aria-label="x" value={30} showValue={false} size="small" severity="success">
        <span>30 of 100</span>
      </ProgressBar>,
    );
    expect(screen.getByText('30 of 100')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'small');
    expect(container.querySelector('.tumaet-ui-progress-bar-value')).toHaveAttribute('data-severity', 'success');
  });
});
