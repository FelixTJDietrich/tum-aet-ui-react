import { useState } from 'react';
import { Splitter } from './splitter';

const pane = { padding: 12, height: '100%', background: 'var(--tumaet-ui-hover-background)' };

export default function SplitterDemo() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ height: 160, border: '1px solid var(--tumaet-ui-border-color)' }}>
        <Splitter panelSizes={[30, 70]} minSizes={[15, 15]} stateKey="demo-splitter">
          <div style={pane}>Left (focus the handle, use arrows, Home, End)</div>
          <div style={pane}>Right</div>
        </Splitter>
      </div>
      <div style={{ height: 240, border: '1px solid var(--tumaet-ui-border-color)' }}>
        <Splitter layout="vertical" separatorLabel="Resize top and bottom">
          <div style={pane}>Top</div>
          <div style={pane}>Bottom</div>
        </Splitter>
      </div>
      <div style={{ height: 120, border: '1px solid var(--tumaet-ui-border-color)' }}>
        <Splitter collapsedSecondSize={collapsed ? '4rem' : undefined}>
          <div style={pane}>
            <button onClick={() => setCollapsed((c) => !c)}>Toggle second panel</button>
          </div>
          <div style={pane}>Second</div>
        </Splitter>
      </div>
    </div>
  );
}
