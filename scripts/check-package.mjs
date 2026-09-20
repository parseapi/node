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
  const parse = parseAPI('fixture', { fetch: async (_input, init) => {
    const headers = new Headers(init?.headers);
    if (headers.get('Parse-Version') !== '2.0.0') throw new Error('Packaged SDK must pin API 2.0.0');
    if (headers.get('X-API-Key') !== 'fixture') throw new Error('Packaged SDK must preserve credentials');
    if (String(_input).endsWith('/preflight')) {
      if (init?.method !== 'POST' || headers.get('Content-Type') !== 'application/json') throw new Error('Preflight must use JSON POST');
      const task = JSON.parse(String(init?.body));
      if (task.operations[0].operation !== 'email' || task.budget_usd !== '2.50') throw new Error('Preflight task was changed');
      return new Response('{"estimate_only":true,"cost":{"maximum_usd":null},"budget":{"enforced":false}}');
    }
    if (String(_input).includes('/email/')) return new Response(JSON.stringify({ email: 'jane+news@example.com', valid: true, deep: { deliverable: null, catchall: false, first_name: 'Jane', no_reply: false, tag: 'news', mail_provider: null, status: null, reason: null } }));
    return new Response('{"country":"US"}');
  } });
  await parse.country('US');
  const email = await parse.email('jane+news@example.com', { deep: true });
  const suggestedName: string | null | undefined = email.deep?.first_name;
  const noReply: boolean | null | undefined = email.deep?.no_reply;
  const verificationReason: string | null | undefined = email.deep?.reason;
  if (suggestedName !== 'Jane' || noReply !== false || verificationReason !== null || email.deep?.tag !== 'news' || email.deep?.mail_provider !== null) throw new Error('Packed Email deep fields must preserve known, false and null values');
  const estimate = await parse.preflight({ operations: [{ operation: 'email', count: 100, deep: true }], budget_usd: '2.50' });
  const maximum: string | null = estimate.cost.maximum_usd;
  if (maximum !== null || estimate.budget?.enforced !== false) throw new Error('Preflight must preserve unknowns and advisory budgets');
  await parse.country.states('US', { signal: new AbortController().signal });
  await parse.timezone.at(0, 0);
  await parse.city.search('den', { country: 'US' });
  await parse.address.search('1600 Penn', { country: 'US' });
  const oldName = parse.name;
  await oldName('Andrea');
  const name = await parse.name('Robert James Smith', { deep: true, name_locale: 'en-GB' });
  const initials: string | null | undefined = name.deep?.initials;
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
