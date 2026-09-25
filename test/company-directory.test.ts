import { afterEach, expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, ParseAPIError, type Company, type CompanyOptions, type CompanyProfile, type CompanyProfileDeep, type CompanyProfileEmployees, type CompanyProfileRegistration, type CompanySearch, type CompanyCoverage, type CompanySearchOptions, type CompanyIdOptions, type CompanyCoverageOptions } from '../src/index.js';

afterEach(() => vi.useRealTimers());
const profile: CompanyProfile = { id: 'co_xw3f22es6cjq', name: 'Cloudflare, Inc.', country: 'US', website: 'https://www.cloudflare.com/', listings: [{ exchange: 'NYSE', symbol: 'NET' }], address: null };
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Retry-After': '0' } });
function setup(value: unknown = profile) {
	const calls: { url: URL; init?: RequestInit }[] = [];
	const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => { calls.push({ url: new URL(String(input)), init }); return response(value); });
	return { parse: parseAPI('fixture', { fetch }), calls, fetch };
}

it('adds callable directory methods without changing national company references or types', async () => {
	const { parse, calls } = setup({ company: '552100554', valid: true, deep: { activity: null, gst: false } });
	const national: (number: string, opts?: CompanyOptions) => Promise<Company> = parse.company;
	expectTypeOf(parse.company.id).returns.toEqualTypeOf<Promise<CompanyProfile>>();
	expectTypeOf(parse.company.search).returns.toEqualTypeOf<Promise<CompanySearch>>();
	expectTypeOf(parse.company.coverage).returns.toEqualTypeOf<Promise<CompanyCoverage>>();
	expectTypeOf<'description'>().not.toMatchTypeOf<keyof NonNullable<Company['deep']>>();
	await national('552 100/554', { country: 'FR', deep: true, lang: 'fr' });
	expect(calls[0]!.url.pathname).toBe('/company/552%20100%2F554');
	expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({ country: 'FR', deep: 'true', lang: 'fr' });
	const idMethod = parse.company.id; await idMethod('co_id/with #?', { deep: false });
	expect(calls[1]!.url.pathname).toBe('/company/id/co_id%2Fwith%20%23%3F');
	expect(Object.fromEntries(calls[1]!.url.searchParams)).toEqual({});
});

it.each([
	[{ query: 'Café & Labs', country: 'US', limit: 3, cursor: 'page+/=?', deep: true }, { q: 'Café & Labs', country: 'US', limit: '3', cursor: 'page+/=?', deep: 'true' }],
	[{ domain: 'https://www.example.com/a?b=c&d=e', deep: false }, { domain: 'https://www.example.com/a?b=c&d=e' }],
	[{ ticker: 'BRK/B', exchange: 'NYSE', country: 'US' }, { ticker: 'BRK/B', exchange: 'NYSE', country: 'US' }],
	[{ identifier: '0000081061', authority: 'SEC' }, { identifier: '0000081061', authority: 'SEC' }],
] as const)('forwards one company selector with its exact filters and opaque cursor', async (options, query) => {
	const { parse, calls } = setup({ companies: [], next: null });
	expect(await parse.company.search(options)).toEqual({ companies: [], next: null });
	expect(calls).toHaveLength(1); expect(calls[0]!.url.pathname).toBe('/company');
	expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual(query);
	expect(new Headers(calls[0]!.init?.headers).get('Parse-Version')).toBe('2.0.0');
	expect(calls[0]!.init?.redirect).toBe('manual');
});

it('directory options omit language and coverage sends no product query parameters', async () => {
	expectTypeOf<'lang'>().not.toMatchTypeOf<keyof CompanyIdOptions>();
	expectTypeOf<'lang'>().not.toMatchTypeOf<keyof CompanySearchOptions>();
	expectTypeOf<'lang'>().not.toMatchTypeOf<keyof CompanyCoverageOptions>();
	const { parse, calls } = setup();
	const extras = { lang: 'fr', country: 'FR', deep: true, timeoutMs: 1000, retries: 0 };
	await parse.company.id(profile.id, extras);
	await parse.company.search({ query: 'Cloudflare', ...extras });
	await parse.company.coverage(extras);
	expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({ deep: 'true' });
	expect(Object.fromEntries(calls[1]!.url.searchParams)).toEqual({ q: 'Cloudflare', country: 'FR', deep: 'true' });
	expect(calls[2]!.url.pathname).toBe('/company/directory/coverage'); expect(calls[2]!.url.search).toBe('');
});

it('preserves omitted, empty, old, null and populated deep bags and unknown response fields', async () => {
	const populated: CompanyProfileDeep = { legal_name: null, aliases: [], jurisdiction: { country: 'US', state: null }, status: 'future-status', websites: null, identifiers: [{ type: 'future-code', authority: 'future-authority', value: '00001' }], incorporated: null, addresses: [], industries: [], parent: null, description: 'Source words', logo: 'https://assets.example.com/logo.svg', socials: [], founded: { value: '1998', precision: 'future-precision' }, sources: [{ type: 'future-source', url: 'https://example.com/', fields: ['description', 'future-field'], observed_at: '2026-09-23T00:00:00Z', updated_at: null }] };
	expectTypeOf<CompanyProfileDeep['description']>().toEqualTypeOf<string | null | undefined>();
	expectTypeOf<CompanyProfileDeep['socials']>().toEqualTypeOf<string[] | null | undefined>();
	for (const extra of [{}, { deep: {} }, { deep: { legal_name: 'Prior name' } }, { deep: { description: null, logo: null, socials: null, founded: null, sources: null } }, { deep: populated, future: { unknown: true } }]) {
		const payload = { ...profile, ...extra }, { parse, calls } = setup(payload);
		expect(await parse.company.id(profile.id, { deep: true })).toEqual(payload); expect(calls).toHaveLength(1);
		const search = { companies: [{ ...payload, match: { field: 'future-field', value: null, future: true } }], next: 'opaque', future: 0 };
		expect(await setup(search).parse.company.search({ query: 'Cloudflare', deep: true })).toEqual(search);
	}
});

it('leaves selector validation to the API and distinguishes empty search from errors', async () => {
	const fetch = vi.fn(async () => response({ code: 'invalid_request', message: 'Choose one selector', docs: null, request_id: 'req_fixture' }, 400));
	const parse = parseAPI('fixture', { fetch });
	await expect(parse.company.search({ query: 'Acme', domain: 'acme.com' })).rejects.toMatchObject({ status: 400, code: 'invalid_request', requestId: 'req_fixture' });
	expect(fetch).toHaveBeenCalledTimes(1);
	const missing = parseAPI('fixture', { fetch: async () => response({ code: 'not_found', message: 'No profile', docs: null, request_id: null }, 404) });
	await expect(missing.company.id('co_222222222222')).rejects.toBeInstanceOf(ParseAPIError);
	const malformed = parseAPI('fixture', { fetch: async () => response({ code: 'invalid_request', message: 'Expired cursor' }, 400) });
	await expect(malformed.company.search({ query: 'Acme', cursor: 'stale' })).rejects.toMatchObject({ code: 'invalid_request', status: 400 });
});

it('retains per-call retry controls on every directory method', async () => {
	for (const method of ['id', 'search', 'coverage'] as const) {
		let calls = 0; const parse = parseAPI('fixture', { retries: 0, fetch: async () => ++calls === 1 ? response({ code: 'unavailable' }, 503) : response({ ok: true }) });
		if (method === 'id') await parse.company.id(profile.id, { retries: 1 });
		if (method === 'search') await parse.company.search({ domain: 'example.com', retries: 1 });
		if (method === 'coverage') await parse.company.coverage({ retries: 1 });
		expect(calls).toBe(2);
	}
});

it('cancellation aborts a directory request without retrying or leaking controls into the URL', async () => {
	let started!: () => void; const ready = new Promise<void>(resolve => { started = resolve; });
	const fetch = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => { started(); init?.signal?.addEventListener('abort', () => reject(init.signal!.reason), { once: true }); }));
	const controller = new AbortController(), reason = new Error('caller cancelled');
	const pending = parseAPI('fixture', { fetch }).company.search({ domain: 'example.com', signal: controller.signal, retries: 3 });
	const checked = expect(pending).rejects.toBe(reason); await ready; controller.abort(reason); await checked; expect(fetch).toHaveBeenCalledTimes(1);
});

it('per-call timeout overrides the client timeout and never becomes a query field', async () => {
	vi.useFakeTimers(); const calls: string[] = [];
	const fetch = vi.fn((input, init) => new Promise<Response>((_resolve, reject) => { calls.push(String(input)); init?.signal?.addEventListener('abort', () => reject(init.signal!.reason), { once: true }); }));
	const pending = parseAPI('fixture', { fetch, timeoutMs: 10000 }).company.coverage({ timeoutMs: 20, retries: 0 });
	const checked = expect(pending).rejects.toMatchObject({ name: 'TimeoutError' }); await vi.advanceTimersByTimeAsync(20); await checked;
	expect(calls).toEqual(['https://api.parseapi.com/company/directory/coverage']);
});


it('preserves dated employee headcount, zero, false, null and future codes on ID and search', async () => {
	expectTypeOf<CompanyProfileDeep['employees']>().toEqualTypeOf<CompanyProfileEmployees | null | undefined>();
	expectTypeOf<CompanyProfileEmployees['scope']>().toEqualTypeOf<string>();
	expectTypeOf<CompanyProfileEmployees['method']>().toEqualTypeOf<string>();
	const observations: (CompanyProfileEmployees | null | undefined)[] = [
		undefined, null,
		{ count: 0, as_of: '2025-12-31', scope: 'legal_entity', method: 'reported', approximate: false },
		{ count: 12500, as_of: '2026-06-30', scope: 'consolidated_group', method: 'reported', approximate: true },
		{ count: 7, as_of: '2026-01-15', scope: 'future_scope', method: 'future_method', approximate: false },
	];
	for (const employees of observations) {
		const payload = { ...profile, deep: employees === undefined ? {} : { employees } };
		const result = await setup(payload).parse.company.id(profile.id, { deep: true });
		expect(result).toEqual(payload);
		expect(result.deep?.employees).toEqual(employees);
		if (employees === undefined) expect(Object.hasOwn(result.deep!, 'employees')).toBe(false);
		const page = { companies: [{ ...payload, match: { field: 'name', value: profile.name } }], next: null };
		expect(await setup(page).parse.company.search({ query: profile.name, deep: true })).toEqual(page);
	}
});


it('discovers by country or exact SIC and retains filters while toggling deep on a cursor', async () => {
	const page = { companies: [{ ...profile, match: { field: 'filters', value: null } }], next: 'page+/=?' };
	const { parse, calls } = setup(page);
	expect(await parse.company.search({ country: 'US' })).toEqual(page);
	await parse.company.search({ industry: '0700', industry_type: 'sic' });
	await parse.company.search({ country: 'US', industry: '0700', industry_type: 'sic', limit: 2, cursor: page.next, deep: true });
	await parse.company.search({ query: 'Example', country: 'US', industry: '0700', industry_type: 'sic', limit: 2, deep: false });
	expect(calls.map(call => Object.fromEntries(call.url.searchParams))).toEqual([
		{ country: 'US' }, { industry: '0700', industry_type: 'sic' },
		{ country: 'US', industry: '0700', industry_type: 'sic', limit: '2', cursor: 'page+/=?', deep: 'true' },
		{ q: 'Example', country: 'US', industry: '0700', industry_type: 'sic', limit: '2' },
	]);
	expectTypeOf<CompanySearchOptions['industry_type']>().toEqualTypeOf<string | undefined>();
	const rejected = parseAPI('fixture', { fetch: async () => response({ code: 'invalid_request', message: 'Unsupported industry namespace' }, 400) });
	await expect(rejected.company.search({ industry: '0700', industry_type: 'future' })).rejects.toMatchObject({ status: 400, code: 'invalid_request' });
});

it('preserves registry source roles, exact identifiers, dates and empty versus absent facts', async () => {
 expectTypeOf<CompanyProfileDeep['registrations']>().toEqualTypeOf<CompanyProfileRegistration[] | null | undefined>();
 const registration: CompanyProfileRegistration = {"authority":"RA000599","number":"0001234567","jurisdiction":{"country":"US","state":"CO"},"role":"domestic","legal_form":{"code":"DNC","name":"Domestic Non-profit Corporation"},"status":"Good Standing","formation_date":"2004-02-29","address":{"kind":"principal","line1":"12 Main St.","line2":"Suite 2","city":"Example","state":"CO","postal":"00123-0001","country_raw":"US"}};
 for (const deep of [{}, { registrations: null }, { registrations: [] }, { registrations: [registration], sources: [{"type":"business_register","url":"https://data.colorado.gov/Business/Business-Entities-in-Colorado/4ykn-tg5h","fields":["registrations"],"observed_at":"2026-09-23T15:00:52.763514Z","updated_at":null}] }, { registrations: [{ ...registration, role: 'future_role', status: 'future_status', formation_date: null, address: null }] }]) {
  const payload = { ...profile, deep };
  expect(await setup(payload).parse.company.id(profile.id, { deep: true })).toEqual(payload);
  const page = { companies: [{ ...payload, match: { field: 'identifier', value: registration.number } }], next: null };
  expect(await setup(page).parse.company.search({ identifier: registration.number, authority: registration.authority, deep: true })).toEqual(page);
 }
});


it('forwards selected registration filters exactly with scopes, cursor and deep', async () => {
 const { parse, calls } = setup({ companies: [], next: null });
 await parse.company.search({ registration_authority: 'ra000599' });
 await parse.company.search({ country: 'US', industry: '0700', industry_type: 'sic', registration_authority: 'RA000599', registration_form: 'DPC', registration_status: ' Good Standing ', limit: 2, cursor: 'opaque+/=', deep: true });
 await parse.company.search({ identifier: '00001', authority: 'SEC', registration_authority: 'RA000599', registration_form: 'future/Form', registration_status: 'future+& status', deep: false });
 expect(calls.map(call => Object.fromEntries(call.url.searchParams))).toEqual([
  { registration_authority: 'ra000599' },
  { country: 'US', industry: '0700', industry_type: 'sic', registration_authority: 'RA000599', registration_form: 'DPC', registration_status: ' Good Standing ', limit: '2', cursor: 'opaque+/=', deep: 'true' },
  { identifier: '00001', authority: 'SEC', registration_authority: 'RA000599', registration_form: 'future/Form', registration_status: 'future+& status' },
 ]);
 expectTypeOf<CompanySearchOptions['registration_form']>().toEqualTypeOf<string | undefined>();
 const failed = parseAPI('fixture', { fetch: async () => response({ code: 'invalid_request', message: 'Registration scope required' }, 400) });
 await expect(failed.company.search({ registration_form: 'DPC', authority: 'RA000599' })).rejects.toMatchObject({ status: 400, code: 'invalid_request' });
});
