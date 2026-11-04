// Packs the library into a single tarball and verifies what would be published.
// The release workflow publishes exactly this tarball and nothing else.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'build/package');
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

assert.equal(manifest.name, '@tumaet/ui-react');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/, 'Release versions are plain MAJOR.MINOR.PATCH');
assert.notEqual(manifest.private, true, 'package.json must not be private');
assert.equal(manifest.type, 'module');
assert.equal(manifest.publishConfig?.access, 'public');
assert.deepEqual(Object.keys(manifest.exports).sort(), ['.', './package.json', './styles.css']);
assert.equal(manifest.dependencies, undefined, 'The library has no runtime dependencies besides its peers');
assert.deepEqual(Object.keys(manifest.peerDependencies).sort(), ['react', 'react-dom']);
for (const range of Object.values(manifest.peerDependencies)) {
  assert.doesNotMatch(range, /^(?:workspace|catalog|file|link):/);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
// --ignore-scripts keeps `prepublishOnly` (which refuses a direct publish) from running.
const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', out], {
    cwd: root,
    encoding: 'utf8',
  }),
);
const files = packed.files.map(({ path }) => path);
for (const required of [
  'package.json',
  'README.md',
  'LICENSE',
  'dist/index.js',
  'dist/styles.css',
  'dist/types/index.d.ts',
]) {
  assert.ok(files.includes(required), `Missing published file: ${required}`);
}
for (const path of files) {
  assert.match(
    path,
    /^(?:package\.json|README\.md|LICENSE|dist\/index\.js|dist\/styles\.css|dist\/types\/.+\.d\.ts)$/u,
    `Unexpected published file: ${path}`,
  );
}

const tarball = resolve(out, packed.filename);
const integrity = `sha512-${createHash('sha512')
  .update(await readFile(tarball))
  .digest('base64')}`;
await writeFile(
  resolve(out, 'manifest.json'),
  `${JSON.stringify(
    { name: manifest.name, version: manifest.version, filename: packed.filename, integrity },
    null,
    2,
  )}\n`,
);

// Module resolution and type correctness as a consumer sees them.
execFileSync('pnpm', ['exec', 'publint', tarball, '--strict'], { cwd: root, stdio: 'inherit' });
execFileSync('pnpm', ['exec', 'attw', tarball, '--profile', 'esm-only', '--entrypoints', '.'], {
  cwd: root,
  stdio: 'inherit',
});

process.stdout.write(
  `\nPacked ${packed.filename} (${files.length} files, ${packed.unpackedSize} bytes unpacked)\n${integrity}\n`,
);
