// Exercise the packed artifact from an external ESM and CommonJS consumer.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const consumer = mkdtempSync(join(tmpdir(), 'parseapi-consumer-'));
try {
  const [packed] = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--cache', join(consumer, 'cache'), '--pack-destination', consumer], { cwd: root, encoding: 'utf8' }));
  const installed = join(consumer, 'node_modules', '@parseapi', 'sdk');
  mkdirSync(installed, { recursive: true });
  execFileSync('tar', ['-xzf', join(consumer, packed.filename), '--strip-components=1', '-C', installed]);
  const body = `
async function main() {
  const parse = parseAPI('fixture', { fetch: async () => new Response('{"country":"US"}') });
  await parse.country('US');
  await parse.country.states('US', { signal: new AbortController().signal });
  await parse.timezone.at(0, 0);
  await parse.city.search('den', { country: 'US' });
  await parse.address.search('1600 Penn', { country: 'US' });
  const company = await parse.company(' ');
  const number: string | null = company.company;
  const tariff: Promise<Tariff> = parse.tariff('8471.30.01.00');
  await tariff;
}
main().catch(error => { throw error; });
`;
  writeFileSync(join(consumer, 'esm.mts'), "import { parseAPI, type Tariff } from '@parseapi/sdk';\n" + body);
  writeFileSync(join(consumer, 'commonjs.cts'), "import sdk = require('@parseapi/sdk');\nconst { parseAPI } = sdk;\ntype Tariff = sdk.Tariff;\n" + body);
  execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--strict', '--skipLibCheck', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--lib', 'ES2022,DOM', 'esm.mts', 'commonjs.cts'], { cwd: consumer, stdio: 'inherit' });
  execFileSync(process.execPath, ['esm.mjs'], { cwd: consumer, stdio: 'inherit' });
  execFileSync(process.execPath, ['commonjs.cjs'], { cwd: consumer, stdio: 'inherit' });
  process.stdout.write('Packed ESM and CommonJS consumers compile and run.\n');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
