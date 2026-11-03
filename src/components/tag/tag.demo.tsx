import { Tag } from './tag';

const severities = ['secondary', 'success', 'info', 'warn', 'danger', 'contrast'] as const;

export default function TagDemo() {
  return (
    <>
      {(['md', 'sm'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {severities.map((severity) => (
            <Tag key={severity} severity={severity} size={size}>
              {severity}
            </Tag>
          ))}
          <Tag rounded size={size} value="rounded" severity="info" />
        </div>
      ))}
    </>
  );
}
