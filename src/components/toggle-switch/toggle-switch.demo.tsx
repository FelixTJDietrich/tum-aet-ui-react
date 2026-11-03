import { ToggleSwitch } from './toggle-switch';

export default function ToggleSwitchDemo() {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ToggleSwitch /> Off
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ToggleSwitch defaultChecked /> On
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ToggleSwitch disabled /> Disabled
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ToggleSwitch disabled defaultChecked /> Disabled on
      </label>
    </div>
  );
}
