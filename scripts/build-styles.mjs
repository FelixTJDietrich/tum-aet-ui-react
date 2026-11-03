// Concatenates the theme, base styles and every component stylesheet into dist/styles.css.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const parts = [
  `@layer tumaet-ui-theme;\n@layer tumaet-ui-theme {\n${await readFile(join(root, 'src/styles/themes.css'), 'utf8')}\n}\n`,
];
parts.push(await readFile(join(root, 'src/styles/base.css'), 'utf8'));
const components = (await readdir(join(root, 'src/components'), { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
for (const name of components) {
  const files = (await readdir(join(root, 'src/components', name))).filter((f) => f.endsWith('.css')).sort();
  for (const file of files)
    parts.push(`/* ${name}/${file} */\n${await readFile(join(root, 'src/components', name, file), 'utf8')}`);
}
await mkdir(join(root, 'dist'), { recursive: true });
await writeFile(join(root, 'dist/styles.css'), parts.join('\n'));
console.log('Built dist/styles.css');
