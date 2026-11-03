import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Splitter } from './splitter';

function setup(props: Partial<React.ComponentProps<typeof Splitter>> = {}) {
  const result = render(
    <Splitter panelSizes={[60, 40]} minSizes={[20, 30]} {...props}>
      <input aria-label="Draft" />
      <p>Second</p>
    </Splitter>,
  );
  return { ...result, separator: screen.getByRole('separator', { hidden: true }) };
}

describe('Splitter', () => {
  beforeEach(() => window.localStorage.clear());

  it('renders two panels and a named focusable separator with value attributes', () => {
    const { separator } = setup();
    expect(screen.getByLabelText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(separator).toHaveAccessibleName('Resize panels');
    expect(separator).toHaveAttribute('tabindex', '0');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('aria-valuenow', '60');
    expect(separator).toHaveAttribute('aria-valuemin', '20');
    expect(separator).toHaveAttribute('aria-valuemax', '70');
  });

  it('resizes with arrow keys, Shift, Home and End and clamps to the minimums', async () => {
    const onResizeEnd = vi.fn();
    const onSizesChange = vi.fn();
    const { separator } = setup({ onResizeEnd, onSizesChange });
    separator.focus();
    expect(separator).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(separator).toHaveAttribute('aria-valuenow', '62');
    expect(onResizeEnd).toHaveBeenLastCalledWith([62, 38]);
    await userEvent.keyboard('{ArrowLeft}');
    expect(separator).toHaveAttribute('aria-valuenow', '60');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(separator).toHaveAttribute('aria-valuenow', '50');
    await userEvent.keyboard('{Home}');
    expect(separator).toHaveAttribute('aria-valuenow', '20');
    await userEvent.keyboard('{End}{ArrowRight}');
    expect(separator).toHaveAttribute('aria-valuenow', '70');
    expect(onSizesChange).toHaveBeenCalled();
  });

  it('uses Up/Down in vertical layout and ignores Left/Right', async () => {
    const { separator } = setup({ layout: 'vertical' });
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    separator.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(separator).toHaveAttribute('aria-valuenow', '62');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(separator).toHaveAttribute('aria-valuenow', '58');
    await userEvent.keyboard('{ArrowRight}');
    expect(separator).toHaveAttribute('aria-valuenow', '58');
  });

  it('normalizes weights, impossible minimums and invalid sizes', () => {
    const { rerender } = setup({ panelSizes: [6, 4] });
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '60');
    rerender(
      <Splitter panelSizes={[Number.NaN, 40]}>
        <i />
        <i />
      </Splitter>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '50');
    rerender(
      <Splitter minSizes={[80, 80]}>
        <i />
        <i />
      </Splitter>,
    );
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-valuemin', '50');
    expect(separator).toHaveAttribute('aria-valuemax', '50');
  });

  it('keeps user resizes until panelSizes change', async () => {
    const { rerender, separator } = setup();
    separator.focus();
    await userEvent.keyboard('{ArrowRight}');
    rerender(
      <Splitter panelSizes={[60, 40]} minSizes={[20, 30]}>
        <i />
        <i />
      </Splitter>,
    );
    expect(separator).toHaveAttribute('aria-valuenow', '62');
    rerender(
      <Splitter panelSizes={[40, 60]} minSizes={[20, 30]}>
        <i />
        <i />
      </Splitter>,
    );
    expect(separator).toHaveAttribute('aria-valuenow', '40');
  });

  it('resizes by pointer drag and finishes with onResizeEnd; Escape-less cancel via pointercancel restores', () => {
    const onResizeEnd = vi.fn();
    const { container, separator } = setup({ onResizeEnd, gutterSize: 8 });
    const root = container.firstElementChild as HTMLElement;
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 1008, height: 508 } as DOMRect);
    const pointer = (target: Element | Document, type: string, x: number, init: PointerEventInit = {}) =>
      fireEvent(
        target,
        Object.assign(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, button: 0, ...init }), {
          pointerId: 1,
        }),
      );
    pointer(separator, 'pointerdown', 600);
    expect(document.querySelector('[data-tumaet-splitter-shield]')).not.toBeNull();
    pointer(document, 'pointermove', 700);
    // 100px of 1000px available is 10 points.
    expect(separator).toHaveAttribute('aria-valuenow', '70');
    pointer(document, 'pointermove', 650);
    expect(separator).toHaveAttribute('aria-valuenow', '65');
    pointer(document, 'pointerup', 650);
    expect(document.querySelector('[data-tumaet-splitter-shield]')).toBeNull();
    expect(onResizeEnd).toHaveBeenLastCalledWith([65, 35]);

    pointer(separator, 'pointerdown', 600);
    pointer(document, 'pointermove', 500);
    pointer(document, 'pointercancel', 500);
    expect(separator).toHaveAttribute('aria-valuenow', '65');
    expect(document.querySelector('[data-tumaet-splitter-shield]')).toBeNull();
  });

  it('persists to localStorage per layout when stateKey is set', async () => {
    const { separator } = setup({ stateKey: 'k' });
    separator.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(window.localStorage.getItem('k-horizontal')).toBe('62');
  });

  it('hides the separator and ignores keys when the second panel is collapsed, keeping both panels mounted', async () => {
    const { rerender, separator } = setup({ collapsedSecondSize: '3rem' });
    expect(separator).not.toBeVisible();
    separator.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(separator).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByLabelText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    rerender(
      <Splitter>
        <i />
        <i />
      </Splitter>,
    );
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <Splitter separatorLabel="Resize documents">
          <p>A</p>
          <p>B</p>
        </Splitter>
      </main>,
    );
    await expectNoA11yViolations();
  });
});
