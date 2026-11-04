import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../test-utils';
import { Card } from './card';

describe('Card', () => {
  it('renders header, subheader, content, media and footer', () => {
    render(
      <Card header="Title" subheader="Sub" media={<div>Media</div>} footer={<div>Footer</div>}>
        Body
      </Card>,
    );
    for (const text of ['Title', 'Sub', 'Media', 'Footer', 'Body']) expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('omits the caption when no header or subheader is given and merges className', () => {
    const { container } = render(<Card className="mine">Body</Card>);
    expect(container.querySelector('.tumaet-ui-card-caption')).toBeNull();
    expect(container.firstElementChild).toHaveClass('tumaet-ui-card', 'mine');
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <Card header="Title">Body</Card>
      </main>,
    );
    await expectNoA11yViolations();
  });

  it('puts media before the body and the footer after the content inside the body', () => {
    const { container } = render(
      <Card header="T" media={<div data-testid="media" />} footer={<div data-testid="footer" />}>
        <span data-testid="content" />
      </Card>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.firstElementChild).toBe(screen.getByTestId('media'));
    const body = root.querySelector('.tumaet-ui-card-body')!;
    expect(body.lastElementChild).toBe(screen.getByTestId('footer'));
    expect(screen.getByTestId('content').closest('.tumaet-ui-card-content')).not.toBeNull();
    expect(body.querySelector('.tumaet-ui-card-title')).toHaveTextContent('T');
    expect(body.querySelector('.tumaet-ui-card-subtitle')).toBeNull();
  });
});
