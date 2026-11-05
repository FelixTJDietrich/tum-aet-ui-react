import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateRelease, validateVersion } from './release-policy.mjs';

test('accepts stable and SemVer prerelease identifiers', () => {
  for (const version of ['0.1.0', '1.0.0-rc.1', '0.2.0-alpha.0', '1.2.3-x-y-z.--', '1.2.3-01a']) {
    assert.doesNotThrow(() => validateVersion(version));
  }
});

test('rejects malformed, noncanonical and npm-ambiguous versions', () => {
  for (const version of [
    '01.2.3',
    '1.02.3',
    '1.2.03',
    '1.2.3-01',
    '1.2.3-rc..1',
    'v1.2.3',
    '1.2',
    '1.2.3+',
    '1.2.3+build',
    '1.2.3\n',
    '1.2.3-rc.1\n',
    '9007199254740992.0.0',
  ]) {
    assert.throws(() => validateVersion(version));
  }
});

const candidate = {
  name: '@tumaet/ui-react',
  version: '0.2.0-rc.1',
  refType: 'tag',
  ref: '@tumaet/ui-react@0.2.0-rc.1',
  distTag: 'next',
};

test('requires an explicit safe dist tag, keeping prereleases off latest', () => {
  assert.equal(validateRelease(candidate), 'next');
  for (const distTag of [undefined, '', 'latest', '1.2.3', '--tag=latest', 'next;echo', 'NEXT']) {
    assert.throws(() => validateRelease({ ...candidate, distTag }));
  }
  assert.equal(
    validateRelease({ ...candidate, version: '0.2.0', ref: '@tumaet/ui-react@0.2.0', distTag: 'latest' }),
    'latest',
  );
  assert.equal(validateRelease({ ...candidate, refType: 'branch', ref: 'main' }), 'next');
});

test('rejects mismatched release identities', () => {
  assert.throws(() => validateRelease({ ...candidate, ref: '@tumaet/ui-react@0.2.0' }));
  assert.throws(() => validateRelease({ ...candidate, name: '@other/package' }));
  assert.throws(() => validateRelease({ ...candidate, refType: 'unknown' }));
});
