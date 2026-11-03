import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonAttributes } from './button';
import { ButtonGroup } from './button-group';
import { expectNoA11yViolations } from '../../test-utils';

describe('Button', () => {
  it('renders a type=button by default and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and busy while loading', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('exposes severity, variant and size as data attributes', () => {
    render(
      <Button severity="danger" variant="outlined" size="small">
        Delete
      </Button>,
    );
    expect(screen.getByRole('button')).toMatchObject({
      dataset: { severity: 'danger', variant: 'outlined', size: 'small' },
    });
  });

  it('does not fire onClick while disabled or loading', async () => {
    const onClick = vi.fn();
    render(
      <>
        <Button disabled onClick={onClick}>
          A
        </Button>
        <Button loading onClick={onClick}>
          B
        </Button>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('replaces the icon with a decorative spinner while loading', () => {
    const { rerender } = render(<Button icon={<svg data-testid="icon" />}>Go</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    rerender(
      <Button loading icon={<svg data-testid="icon" />}>
        Go
      </Button>,
    );
    expect(screen.queryByTestId('icon')).toBeNull();
    expect(document.querySelector('.tumaet-ui-spin')).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards type, aria-* attributes and the accessible name of icon-only buttons', () => {
    render(
      <Button
        type="submit"
        aria-label="Download"
        aria-expanded={true}
        aria-pressed={false}
        aria-controls="menu-1"
        aria-describedby="desc-1"
        icon={<svg />}
        rounded
      />,
    );
    const button = screen.getByRole('button', { name: 'Download' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('aria-controls', 'menu-1');
    expect(button).toHaveAttribute('aria-describedby', 'desc-1');
    expect(button).toHaveClass('tumaet-ui-btn', 'tumaet-ui-btn-rounded');
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('defaults to primary, default size, solid', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button').dataset).toMatchObject({
      severity: 'primary',
      size: 'default',
      variant: 'solid',
    });
  });

  it('buttonAttributes styles a link like a button', () => {
    render(
      <a href="#x" {...buttonAttributes({ variant: 'text', severity: 'danger' })}>
        Details
      </a>,
    );
    const link = screen.getByRole('link', { name: 'Details' });
    expect(link).toHaveClass('tumaet-ui-btn');
    expect(link.dataset).toMatchObject({ severity: 'danger', size: 'default', variant: 'text' });
  });

  it('ButtonGroup is a labelled group and passes axe', async () => {
    render(
      <ButtonGroup aria-label="Date navigation">
        <Button severity="secondary">Previous</Button>
        <Button severity="secondary">Today</Button>
        <Button severity="secondary">Next</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole('group', { name: 'Date navigation' })).toHaveClass('tumaet-ui-button-group');
    expect(screen.getAllByRole('button')).toHaveLength(3);
    await expectNoA11yViolations();
  });
});
