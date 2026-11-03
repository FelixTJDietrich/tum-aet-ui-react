import { createRoot } from 'react-dom/client';
import { useState, type ComponentType } from 'react';
import '../src/styles/themes.css';
import '../src/styles/base.css';

// Every stylesheet and every *.demo.tsx in src/components shows up here automatically.
import.meta.glob('../src/components/**/*.css', { eager: true });
const demos = import.meta.glob<{ default: ComponentType }>('../src/components/**/*.demo.tsx', { eager: true });
const entries = Object.entries(demos)
  .map(([path, mod]) => ({ name: path.split('/').pop()!.replace('.demo.tsx', ''), Demo: mod.default }))
  .sort((a, b) => a.name.localeCompare(b.name));

function App() {
  const [dark, setDark] = useState(false);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  return (
    <div className="tumaet-ui-root" style={{ background: 'var(--tumaet-ui-content-background)', color: 'var(--tumaet-ui-text-color)', minHeight: '100vh', padding: 24, fontFamily: 'var(--tumaet-ui-font-family)' }}>
      <label><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark</label>
      {entries.map(({ name, Demo }) => (
        <section key={name} id={name} style={{ margin: '24px 0', paddingTop: 16, borderTop: '1px solid var(--tumaet-ui-border-color)' }}>
          <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>{name}</h2>
          <Demo />
        </section>
      ))}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
