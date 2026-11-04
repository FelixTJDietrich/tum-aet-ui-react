import { ToggleSwitch } from './toggle-switch';

const rowStyle = { display: 'flex', gap: 8, alignItems: 'center' } as const;

export default function ToggleSwitchDemo() {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={rowStyle}>
        <ToggleSwitch id="toggle-demo-off" />
        <label htmlFor="toggle-demo-off">Off</label>
      </div>
      <div style={rowStyle}>
        <ToggleSwitch id="toggle-demo-on" defaultChecked />
        <label htmlFor="toggle-demo-on">On</label>
      </div>
      <div style={rowStyle}>
        <ToggleSwitch id="toggle-demo-disabled" disabled />
        <label htmlFor="toggle-demo-disabled">Disabled</label>
      </div>
      <div style={rowStyle}>
        <ToggleSwitch id="toggle-demo-disabled-on" disabled defaultChecked />
        <label htmlFor="toggle-demo-disabled-on">Disabled on</label>
      </div>
    </div>
  );
}
