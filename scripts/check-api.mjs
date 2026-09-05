import { readFileSync, writeFileSync } from 'node:fs';
const actual = readFileSync(new URL('../dist/index.d.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const baseline = new URL('../api/index.d.ts', import.meta.url);
if (process.argv.includes('--write')) {
  writeFileSync(baseline, actual);
  process.stdout.write('Wrote the reviewed public API baseline.\n');
} else if (readFileSync(baseline, 'utf8') !== actual) {
  process.stderr.write('Public API changed. Review the declaration diff, then update with npm run api:update.\n');
  process.exitCode = 1;
} else {
  process.stdout.write('Public API matches its reviewed baseline.\n');
}
