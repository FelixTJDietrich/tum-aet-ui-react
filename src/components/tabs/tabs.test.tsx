import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { Tab, TabList, TabPanel, TabPanels, Tabs, type TabsProps } from './tabs';

function Example({ disabledB = false, ...props }: TabsProps & { disabledB?: boolean }) {
  return (
    <Tabs {...props}>
      <TabList aria-label="Sections">
        <Tab value="a">Alpha</Tab>
        <Tab value="b" disabled={disabledB}>
          Beta
        </Tab>
        <Tab value="c">Gamma</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="a">Panel A</TabPanel>
        <TabPanel value="b">Panel B</TabPanel>
        <TabPanel value="c">Panel C</TabPanel>
      </TabPanels>
    </Tabs>
  );
}
const tab = (name: string) => screen.getByRole('tab', { name });

describe('Tabs', () => {
  it('renders tablist/tab/tabpanel roles wired by aria-controls and aria-labelledby', () => {
    render(<Example defaultValue="a" />);
    expect(screen.getByRole('tablist', { name: 'Sections' })).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    const panel = screen.getByRole('tabpanel', { name: 'Alpha' });
    expect(panel).toHaveTextContent('Panel A');
    expect(tab('Alpha')).toHaveAttribute('aria-controls', panel.id);
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Beta')).toHaveAttribute('aria-selected', 'false');
  });

  it('shows only the active panel and unmounts inactive content', () => {
    render(<Example defaultValue="b" />);
    expect(screen.getByText('Panel B')).toBeVisible();
    expect(screen.queryByText('Panel A')).toBeNull();
  });

  it('uses a roving tabindex', () => {
    render(<Example defaultValue="b" />);
    expect(tab('Beta')).toHaveAttribute('tabindex', '0');
    expect(tab('Alpha')).toHaveAttribute('tabindex', '-1');
    expect(tab('Gamma')).toHaveAttribute('tabindex', '-1');
  });

  it('selects a tab on click and reports the new value', async () => {
    const onChange = vi.fn();
    render(<Example defaultValue="a" onChange={onChange} />);
    await userEvent.click(tab('Gamma'));
    expect(onChange).toHaveBeenCalledWith('c');
    expect(screen.getByText('Panel C')).toBeVisible();
  });

  it('does not select a disabled tab but announces it as disabled', async () => {
    const onChange = vi.fn();
    render(<Example defaultValue="a" disabledB onChange={onChange} />);
    await userEvent.click(tab('Beta'));
    expect(onChange).not.toHaveBeenCalled();
    expect(tab('Beta')).toHaveAttribute('aria-disabled', 'true');
  });

  it('moves with arrow keys, wrapping at both ends, and selects on focus (automatic)', async () => {
    render(<Example defaultValue="a" />);
    await userEvent.tab();
    expect(tab('Alpha')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Beta')).toHaveFocus();
    expect(tab('Beta')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(tab('Alpha')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(tab('Gamma')).toHaveFocus();
    expect(screen.getByText('Panel C')).toBeVisible();
  });

  it('jumps with Home and End', async () => {
    render(<Example defaultValue="b" />);
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    expect(tab('Gamma')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(tab('Alpha')).toHaveFocus();
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
  });

  it('reaches a disabled tab with the arrow keys without selecting it', async () => {
    render(<Example defaultValue="a" disabledB />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Beta')).toHaveFocus();
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Beta')).toHaveAttribute('aria-selected', 'false');
  });

  it('only moves focus with manual activation until Enter or Space', async () => {
    render(<Example defaultValue="a" activation="manual" />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Beta')).toHaveFocus();
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel A')).toBeVisible();
    await userEvent.keyboard('{Enter}');
    expect(tab('Beta')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}{ }');
    expect(tab('Gamma')).toHaveAttribute('aria-selected', 'true');
  });

  it('is controlled by value and follows external changes', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | number>('a');
      return (
        <>
          <button type="button" onClick={() => setValue('c')}>
            external
          </button>
          <Example value={value} onChange={setValue} />
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByText('external'));
    expect(tab('Gamma')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel C')).toBeVisible();
  });

  it('does not change a controlled value by itself', async () => {
    render(<Example value="a" />);
    await userEvent.click(tab('Gamma'));
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
  });

  it('falls back to the first enabled tab when the value matches none or a disabled tab', () => {
    const { rerender } = render(<Example value="zzz" />);
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
    rerender(<Example value="b" disabledB />);
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
    rerender(<Example />);
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps 1 and "1" apart and supports numeric values', async () => {
    render(
      <Tabs defaultValue={1}>
        <TabList aria-label="n">
          <Tab value={1}>Num</Tab>
          <Tab value="1">Str</Tab>
        </TabList>
        <TabPanel value={1}>Number panel</TabPanel>
        <TabPanel value="1">String panel</TabPanel>
      </Tabs>,
    );
    expect(screen.getByText('Number panel')).toBeVisible();
    await userEvent.click(tab('Str'));
    expect(screen.getByText('String panel')).toBeVisible();
    expect(tab('Num').getAttribute('aria-controls')).not.toBe(tab('Str').getAttribute('aria-controls'));
  });

  it('preserves inactive content when asked', () => {
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="p">
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
        <TabPanel value="a">A</TabPanel>
        <TabPanel value="b" preserveContent>
          <input aria-label="kept" />
        </TabPanel>
      </Tabs>,
    );
    expect(screen.getByLabelText('kept', { selector: 'input' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Example defaultValue="a" disabledB />);
    await expectNoA11yViolations(container);
  });
});

describe('Tabs fallback selection and structure', () => {
  it('writes the fallback selection back, like the Angular tabs', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Example value="zzz" onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith('a');
    onChange.mockClear();
    rerender(<Example value="b" disabledB onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('does not report a change when the value already names an enabled tab', () => {
    const onChange = vi.fn();
    render(<Example value="b" onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selects the first enabled tab when uncontrolled without a default', () => {
    const onChange = vi.fn();
    render(<Example onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith('a');
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
  });

  it('falls back to the first tab when the selected tab is removed', () => {
    function Dynamic({ withC }: { withC: boolean }) {
      const [value, setValue] = useState<number | string>('c');
      return (
        <Tabs value={value} onChange={setValue}>
          <TabList aria-label="Dyn">
            <Tab value="a">Alpha</Tab>
            {withC ? <Tab value="c">Gamma</Tab> : null}
          </TabList>
        </Tabs>
      );
    }
    const { rerender } = render(<Dynamic withC />);
    expect(tab('Gamma')).toHaveAttribute('aria-selected', 'true');
    rerender(<Dynamic withC={false} />);
    expect(tab('Alpha')).toHaveAttribute('aria-selected', 'true');
  });

  it('wires aria-controls only for tabs that have a panel, and labels only panels that have a tab', () => {
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="x">
          <Tab value="a">Alpha</Tab>
          <Tab value="b">Beta</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="a">A</TabPanel>
          <TabPanel value="orphan" preserveContent>
            O
          </TabPanel>
        </TabPanels>
      </Tabs>,
    );
    expect(tab('Alpha')).toHaveAttribute('aria-controls');
    expect(tab('Beta')).not.toHaveAttribute('aria-controls');
    expect(screen.getByText('O').closest('[role="tabpanel"]')).not.toHaveAttribute('aria-labelledby');
    expect(screen.getByText('O').closest('[role="tabpanel"]')).toHaveAttribute('hidden');
  });

  it('reverses the arrow keys in right-to-left layouts', async () => {
    render(
      <div dir="rtl">
        <Example defaultValue="a" />
      </div>,
    );
    tab('Alpha').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(tab('Beta')).toHaveFocus();
    expect(tab('Beta')).toHaveAttribute('aria-selected', 'true');
  });

  it('makes the active panel focusable and hides inactive panels from the accessibility tree', () => {
    render(<Example defaultValue="a" />);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
    expect(document.querySelectorAll('[role="tabpanel"][hidden][inert]')).toHaveLength(2);
  });
});
