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
	let cardRequests = 0;
  const parse = parseAPI('fixture', { fetch: async (_input, init) => {
    const headers = new Headers(init?.headers);
    if (headers.get('X-API-Version') !== '2.1.0') throw new Error('Packaged SDK must pin API 2.1.0');
    if (headers.has('Parse-Version')) throw new Error('Packaged SDK must send only the canonical API version header');
    if (headers.get('X-API-Key') !== 'fixture') throw new Error('Packaged SDK must preserve credentials');
    if (String(_input).endsWith('/preflight')) {
      if (init?.method !== 'POST' || headers.get('Content-Type') !== 'application/json') throw new Error('Preflight must use JSON POST');
      const task = JSON.parse(String(init?.body));
      if (task.operations[0].operation !== 'email' || task.budget_usd !== '2.50') throw new Error('Preflight task was changed');
      return new Response('{"estimate_only":true,"cost":{"maximum_usd":null},"budget":{"enforced":false}}');
    }
    if (String(_input).includes('/stack/unavailable.example')) return new Response(JSON.stringify({ domain: 'unavailable.example', url: 'https://unavailable.example/', checked_at: null, cms: null, servers: null, frameworks: null, ecommerce: null, analytics: null, chat: null, payments: null, hosting: null }));
    if (String(_input).includes('/stack/')) return new Response(JSON.stringify({ domain: 'example.com', url: 'https://example.com/', checked_at: '2026-09-21T12:00:00Z', cms: [{ technology: 'wordpress', name: 'WordPress', version: '6.8.2' }, { technology: 'ghost', name: 'Ghost', version: null }], servers: [{ technology: 'nginx', name: 'nginx', version: null }, { technology: 'apache', name: 'Apache', version: null }], frameworks: [{ technology: 'nextjs', name: 'Next.js', version: null }], ecommerce: [], analytics: [], chat: [], payments: [], hosting: [] }));
    if (String(_input).includes('/email/')) return new Response(JSON.stringify({ email: 'jane+news@example.com', valid: true, deliverable: null, catchall: false, first_name: 'Jane', no_reply: false, tag: 'news', mail_provider: null, status: null, reason: null }));
    const url = new URL(String(_input));
    if (url.pathname === '/elevation') {
      if (url.searchParams.get('path') !== '0,0|0,2' || url.searchParams.get('samples') !== '3') throw new Error('Elevation path/sample mapping differs');
      return new Response(JSON.stringify({ points: [{ latitude: 0, longitude: 0, elevation: 0, elevation_ft: 0, resolution: 460 }, { latitude: 0, longitude: 1, elevation: null, elevation_ft: null, resolution: null }, { latitude: 0, longitude: 2, elevation: -20, elevation_ft: -66, resolution: 460 }] }));
    }
    if (url.pathname.startsWith('/card/')) {
      cardRequests++;
      if (url.pathname === '/card/51' && url.search === '') return new Response(JSON.stringify({bin:'51',brand:'mastercard',brand_name:'Mastercard',logo:'https://cdn.parseapi.com/card/mastercard.svg'}));
      if (url.pathname === '/card/000000' && url.search === '?deep=true') return new Response(JSON.stringify({ bin: '000000', brand: null, brand_name: null, logo: 'https://cdn.parseapi.com/card/generic.svg' }));
      if (url.pathname !== '/card/00%201234-56' || url.search !== '?deep=true') throw new Error('Packed Card must preserve and encode the BIN once');
      return new Response(JSON.stringify({ bin: '00123456', brand: null, brand_name: null, logo: 'https://cdn.parseapi.com/card/generic.svg', prefix: '001234', country: null, issuer: null, type: null, prepaid: false }));
    }
    if (url.pathname === '/country/RETRY') return new Response('{"code":"rate_limited","message":"Wait","request_id":"req_fixture"}', { status: 429, headers: { 'Retry-After': '60' } });
    if (url.pathname === '/elevation') {
      if (url.searchParams.get('path') !== '0,0|0,2' || url.searchParams.get('samples') !== '3') throw new Error('Elevation path/sample mapping differs');
      return new Response(JSON.stringify({ points: [{ latitude: 0, longitude: 0, elevation: 0, elevation_ft: 0, resolution: 460 }, { latitude: 0, longitude: 1, elevation: null, elevation_ft: null, resolution: null }, { latitude: 0, longitude: 2, elevation: -20, elevation_ft: -66, resolution: 460 }] }));
    }
    const directoryProfile = { id: 'co_222222222222', name: 'Acme', country: 'US', website: null, listings: [], address: null, description: null, logo: null, socials: [], founded: { value: '1998', precision: 'year' }, employees: { count: 0, as_of: '2025-12-31', scope: 'consolidated_group', method: 'future_method', approximate: false }, sources: [] };
    if (url.pathname.startsWith('/company/id/')) return new Response(JSON.stringify(directoryProfile));
    if (url.pathname === '/company') {
      if (url.searchParams.has('industry')) {
        const discoveryParams: Record<string, string> = {}; url.searchParams.forEach((value, key) => { discoveryParams[key] = value; });
        if (JSON.stringify(discoveryParams) !== JSON.stringify({country:'US',industry:'0700',industry_type:'sic',limit:'2',cursor:'opaque+/=',deep:'true'})) throw new Error('Packed SIC filters/cursor mapping differs');
      } else if (!url.searchParams.has('q')) {
        if (url.search !== '?country=US') throw new Error('Packed country-only discovery differs');
      } else if (url.searchParams.get('q') !== 'Acme' || url.searchParams.get('deep') !== 'true') throw new Error('Directory selector/deep mapping differs');
      return new Response(JSON.stringify({ companies: [{ ...directoryProfile, match: url.searchParams.has('q') ? { field: 'name', value: 'Acme' } : { field: 'filters', value: null } }], next: null }));
    }
    return new Response('{"country":"US"}');
  } });
  await parse.country('US');
  const core: Card = await parse.card('51');
  if (core.brand !== 'mastercard' || !core.logo.endsWith('/mastercard.svg') || Object.hasOwn(core, 'deep')) throw new Error('Packed Card core differs');
  const card: Card = await parse.card('00 1234-56', {deep:true});
  const locked: Card = await parse.card('000000', {deep:true});
  if (Object.hasOwn(locked, 'deep') || locked?.issuer !== undefined) throw new Error('Packed Card must preserve empty detail without inventing issuer');
  function unsafeIssuerAccess(value: Card) {
    if (value.issuer !== null) {
      // @ts-expect-error Existing empty Deep does not guarantee issuer.
      return value.issuer.toUpperCase();
    }
    return null;
  }
  void unsafeIssuerAccess;
  function issuerLabel(value: Card) {
    const issuer = value?.issuer;
    return typeof issuer === 'string' ? issuer.toUpperCase() : 'Bank unavailable';
  }
  const partial: Card = { ...locked, issuer: 'Example bank', prepaid: false };
  if (issuerLabel(locked) !== 'Bank unavailable' || issuerLabel(partial) !== 'EXAMPLE BANK' || partial?.prepaid !== false) throw new Error('Packed Card guarded reads must preserve missing, known and false values');
  try { await parse.card('4242424242424242'); throw new Error('Card accepted a full number'); }
  catch (error) { if (!(error instanceof TypeError)) throw error; }
  if (cardRequests !== 3) throw new Error('Packed Card dispatched a rejected input');
  try { await parse.country('RETRY'); throw new Error('Expected rate limit'); }
  catch (error) {
    if (!(error instanceof ParseAPIError) || error.retryAfter !== '60' || error.requestId !== 'req_fixture') throw error;
  }
  const email = await parse.email.verify('jane+news@example.com');
  const suggestedName: string | null | undefined = email?.first_name;
  const noReply: boolean | null | undefined = email?.no_reply;
  const verificationReason: string | null | undefined = email?.reason;
  if (suggestedName !== 'Jane' || noReply !== false || verificationReason !== null || email?.tag !== 'news' || email?.mail_provider !== null) throw new Error('Packed Email deep fields must preserve known, false and null values');
  const stack = await parse.stack('example.com', { deep: true, pretty: true, timeoutMs: 35000 });
  const checkedAt: string | null = stack.checked_at;
  const version: string | null | undefined = stack.frameworks?.[0]?.version;
  if (checkedAt !== '2026-09-21T12:00:00Z' || version !== null || stack.frameworks?.[0]?.technology !== 'nextjs' || stack.cms?.[0]?.technology !== 'wordpress' || stack.cms[0].version !== '6.8.2' || stack.cms?.[1]?.technology !== 'ghost' || stack.servers?.length !== 2 || stack.servers[0].technology !== 'nginx' || Object.hasOwn(stack, 'deep')) throw new Error('Packed Stack must preserve homepage observations and multiple CMS and server results');
  const unavailable = await parse.stack('unavailable.example', { deep: true });
  if (unavailable.frameworks !== null || unavailable.cms !== null || unavailable.servers !== null || unavailable.checked_at !== null || Object.hasOwn(unavailable, 'deep')) throw new Error('Packed Stack must preserve an incomplete check');
  const estimate = await parse.preflight({ operations: [{ operation: 'email', count: 100, deep: true }], budget_usd: '2.50' });
  const maximum: string | null = estimate.cost.maximum_usd;
  if (maximum !== null || estimate.budget?.enforced !== false) throw new Error('Preflight must preserve unknowns and advisory budgets');
  await parse.country.states('US', { signal: new AbortController().signal });
  await parse.timezone.at(0, 0);
  const path = await parse.elevation.path([[0, 0], [0, 2]], 3, { retries: 0, timeoutMs: 1000 });
  const elevation: number | null = path.points[0].elevation;
  if (elevation !== 0 || path.points[1].elevation !== null || path.points[2].elevation !== -20) throw new Error('Packed Elevation path must preserve zero, null and negative samples');
  await parse.city.search('den', { country: 'US' });
  await parse.address.search('1600 Penn', { country: 'US' });
  const oldName = parse.name;
  await oldName('Andrea');
  const name = await parse.name('Robert James Smith', { deep: true, name_locale: 'en-GB' });
  const initials: string | null | undefined = name?.initials;
  if (card.bin !== '00123456' || card?.prefix !== '001234' || card?.prepaid !== false || card?.country !== null) throw new Error('Packed Card must preserve nullable prefix fields');
  const company = await parse.company(' ');
  const number: string | null = company.company;
  const directory = await parse.company.id('co_222222222222', { deep: true });
  const founding: string | null | undefined = directory?.founded?.value;
  if (founding !== '1998') throw new Error('Packed directory deep must preserve founding precision');
  const employees: CompanyProfileEmployees | null | undefined = directory?.employees;
  if (employees?.count !== 0 || employees.as_of !== '2025-12-31' || employees.scope !== 'consolidated_group' || employees.method !== 'future_method' || employees.approximate !== false) throw new Error('Packed directory employees must preserve zero, date, scope, future method and false');
  const candidates = await parse.company.search({ query: 'Acme', deep: true, signal: new AbortController().signal });
  if (candidates.companies[0]?.id !== directory.id || candidates.next !== null) throw new Error('Packed directory search differs');
  if (JSON.stringify(candidates.companies[0]?.employees) !== JSON.stringify(employees)) throw new Error('Packed search employees differ from ID output');
  await parse.company.search({ country: 'US' });
  const discovered = await parse.company.search({country:'US',industry:'0700',industry_type:'sic',limit:2,cursor:'opaque+/=',deep:true});
  if (discovered.companies[0]?.match.field !== 'filters' || discovered.companies[0]?.match.value !== null) throw new Error('Packed discovery match changed');
}
main().catch(error => { throw error; });
`;
  writeFileSync(join(consumer, 'esm.mts'), "import { parseAPI, ParseAPIError, type Card, type CompanyProfileEmployees } from '@parseapi/sdk';\n" + body);
  writeFileSync(join(consumer, 'commonjs.cts'), "import sdk = require('@parseapi/sdk');\nconst { parseAPI, ParseAPIError } = sdk;\ntype Card = sdk.Card;\ntype CompanyProfileEmployees = sdk.CompanyProfileEmployees;\n" + body);
  execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--strict', '--skipLibCheck', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--lib', 'ES2022,DOM', 'esm.mts', 'commonjs.cts'], { cwd: consumer, stdio: 'inherit' });
  execFileSync(process.execPath, ['esm.mjs'], { cwd: consumer, stdio: 'inherit' });
  execFileSync(process.execPath, ['commonjs.cjs'], { cwd: consumer, stdio: 'inherit' });
  process.stdout.write('Packed ESM and CommonJS consumers compile and run.\n');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
