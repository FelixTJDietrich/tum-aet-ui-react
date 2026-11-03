import { Panel } from './panel';

export default function PanelDemo() {
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
      <Panel header="Static panel">Always visible content.</Panel>
      <Panel header="Toggleable panel" toggleable>
        Content that can be collapsed.
      </Panel>
      <Panel header="Collapsed at first" toggleable defaultCollapsed footer={<div style={{ padding: 16 }}>Footer</div>}>
        Hidden content.
      </Panel>
      <Panel header={<em>Custom header</em>} toggleable toggleLabel="Toggle custom panel">
        Content.
      </Panel>
    </div>
  );
}
