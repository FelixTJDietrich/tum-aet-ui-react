// Makes the relative imports in dist/types resolvable under `moduleResolution: node16/nodenext`,
// which requires explicit file extensions (`./button` -> `./button/index.js`).
// The sources use extensionless imports for the bundler, so this runs after `tsc`.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const types = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/types');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (name.endsWith('.d.ts')) yield path;
  }
}

let rewritten = 0;
for (const file of walk(types)) {
  const source = readFileSync(file, 'utf8');
  const next = source.replace(/(\bfrom\s+|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g, (match, lead, quote, spec) => {
    if (/\.(?:js|css|json)$/.test(spec)) return match;
    const target = resolve(dirname(file), spec);
    let fixed;
    if (existsSync(`${target}.d.ts`)) fixed = `${spec}.js`;
    else if (existsSync(join(target, 'index.d.ts'))) fixed = `${spec.replace(/\/$/, '')}/index.js`;
    else throw new Error(`${file}: cannot resolve ${spec}`);
    rewritten++;
    return `${lead}${quote}${fixed}${quote}`;
  });
  if (next !== source) writeFileSync(file, next);
}
process.stdout.write(`dist/types: added extensions to ${rewritten} relative imports\n`);
