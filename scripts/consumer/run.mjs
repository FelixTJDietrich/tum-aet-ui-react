// Installs the packed tarball into a fresh app and checks it as a consumer would:
// typecheck, bundle (with the stylesheet import), and render a few components on the server.
// Usage: node scripts/consumer/run.mjs [latest|minimum]   (peer versions of react and react-dom)
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const peers = process.argv[2] ?? 'latest';
assert.ok(['latest', 'minimum'].includes(peers), 'Usage: run.mjs [latest|minimum]');
const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(here, '../../build/package');
const { filename } = JSON.parse(await readFile(join(pkgDir, 'manifest.json'), 'utf8'));
const tarball = join(pkgDir, filename);

const dir = await mkdtemp(join(tmpdir(), 'tumaet-ui-react-consumer-'));
await cp(join(here, 'app'), dir, { recursive: true });
const react = peers === 'minimum' ? '19.0.0' : 'latest';
const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
pkg.dependencies = { '@tumaet/ui-react': `file:${tarball}`, react, 'react-dom': react };
pkg.devDependencies = {
  '@types/react': peers === 'minimum' ? '19.0.0' : 'latest',
  '@types/react-dom': peers === 'minimum' ? '19.0.0' : 'latest',
  typescript: '^7.0.2',
  vite: '^8.3.5',
};
await writeFile(join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

const run = (cmd, args) => execFileSync(cmd, args, { cwd: dir, stdio: 'inherit' });
process.stdout.write(`Consumer app (react ${react}) in ${dir}\n`);
run('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts']);
run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.json']);
run('npx', ['vite', 'build', '--ssr', 'src/render.tsx', '--outDir', 'out']);

const { render } = await import(join(dir, 'out/render.js'));
const html = render();
for (const expected of ['Name', 'Active', 'Save']) {
  assert.ok(html.includes(expected), `Rendered HTML is missing "${expected}"`);
}
const styles = execFileSync(
  'node',
  [
    '-e',
    `process.stdout.write(require('fs').readFileSync(require.resolve('@tumaet/ui-react/styles.css'),'utf8').length.toString())`,
  ],
  { cwd: dir, encoding: 'utf8' },
);
assert.ok(Number(styles) > 10_000, 'styles.css should resolve and not be empty');
process.stdout.write(`OK: typecheck, bundle and server render passed with react ${react}\n`);
