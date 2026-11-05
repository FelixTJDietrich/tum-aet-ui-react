import assert from 'node:assert/strict';

// SemVer core + prerelease grammar. Build metadata is deliberately unsupported:
// npm normalizes it away, so it cannot identify an immutable package version.
const numeric = '(?:0|[1-9][0-9]*)';
const identifier = `(?:${numeric}|[0-9]*[A-Za-z-][0-9A-Za-z-]*)`;
const versionPattern = new RegExp(
  `^${numeric}\\.${numeric}\\.${numeric}(?:-${identifier}(?:\\.${identifier})*)?$`,
  'u',
);

export function validateVersion(version) {
  assert.equal(typeof version, 'string');
  assert.equal(version.trim(), version, 'Versions must not contain surrounding whitespace');
  assert.match(version, versionPattern, 'Use MAJOR.MINOR.PATCH[-prerelease], without leading zeroes or build metadata');
  for (const part of version.split('-')[0].split('.')) {
    assert.ok(Number.isSafeInteger(Number(part)), 'Version core numbers must be safe integers');
  }
  return { prerelease: version.includes('-') };
}

export function validateRelease({ name, version, refType, ref, distTag }) {
  assert.equal(name, '@tumaet/ui-react');
  const { prerelease } = validateVersion(version);
  assert.ok(['latest', 'next', 'alpha', 'beta', 'rc'].includes(distTag), 'Choose an explicit supported npm dist tag');
  assert.ok(!prerelease || distTag !== 'latest', 'Prereleases must use a non-latest dist tag');
  assert.ok(['branch', 'tag'].includes(refType), 'Unknown release ref type');
  if (refType === 'tag') {
    assert.equal(ref, `${name}@${version}`, 'The git tag must match the package name and version');
  }
  return distTag;
}
