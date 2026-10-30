import { readFileSync } from 'node:fs';
import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Domain, type DomainOptions, type DomainResult, type Stack, type StackResult } from '../src/index.js';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/domain-result.json', import.meta.url), 'utf8')) as Record<string, DomainResult>;

it('preserves unknown availability and partial registration in one ordinary request', async () => {
	for (const [name, body] of Object.entries(fixtures)) {
		const calls: { url: URL; options?: RequestInit }[] = [];
		const client = parseAPI('fixture', { fetch: async (url, options) => {
			calls.push({ url: new URL(String(url)), options });
			return Response.json(body);
		} });
		const result = await client.domainResult('bücher.example', { deep: true });
		expect(result, name).toEqual(body);
		expect(calls).toHaveLength(1);
		expect(calls[0]!.url.pathname).toBe('/domain/b%C3%BCcher.example');
		expect(calls[0]!.url.search).toBe('?deep=true');
		expect(new Headers(calls[0]!.options?.headers).get('Parse-Version')).toBe('2.0.0');
		expect(new Headers(calls[0]!.options?.headers).get('X-API-Key')).toBe('fixture');
	}
});

it('does not infer false or empty lists from partial registration', async () => {
	let body = fixtures.unregistered_partial!;
	const client = parseAPI('fixture', { fetch: async () => Response.json(body) });
	const partial = await client.domainResult('example.com', { deep: true });
	expect(partial.deep?.registration?.dnssec).toBeUndefined();
	expect(partial.deep?.registration?.status).toBeUndefined();
	body = fixtures.registered_unknown_detail!;
	const unknown = await client.domainResult('example.com', { deep: true });
	expect(unknown.deep?.registration?.dnssec).toBeNull();
	expect(unknown.deep?.registration?.status).toBeNull();
	body = fixtures.registered_false_empty!;
	const known = await client.domainResult('example.com', { deep: true });
	expect(known.deep?.registration?.dnssec).toBe(false);
	expect(known.deep?.registration?.status).toEqual([]);
});

it('keeps the existing Domain interface and uses the current Stack model', () => {
	expectTypeOf<Domain['available']>().toEqualTypeOf<boolean>();
	expectTypeOf<DomainResult['available']>().toEqualTypeOf<boolean | null>();
	expectTypeOf<Stack>().not.toHaveProperty('pages');
	expectTypeOf<Stack>().not.toHaveProperty('scope');
	expectTypeOf<StackResult>().not.toHaveProperty('scope');
	expectTypeOf<StackResult>().not.toHaveProperty('pages');
	expectTypeOf<StackResult>().not.toHaveProperty('partial');
	const current: StackResult = { domain: 'example.com', url: 'https://example.com/', checked_at: null,
		cms: null, servers: null, frameworks: null, ecommerce: null, analytics: null, chat: null, payments: null, hosting: null };
	expect(Object.keys(current)).toHaveLength(11);
});

it('keeps ordinary error and cancellation handling on the existing transport', async () => {
	let calls = 0;
	const client = parseAPI('fixture', { fetch: async () => {
		calls++;
		return Response.json({ code: 'service_unavailable', message: 'Try again', docs: null, request_id: 'fixture' }, { status: 503 });
	} });
	await expect(client.domainResult('example.com', { retries: 0 })).rejects.toMatchObject({ status: 503, code: 'service_unavailable' });
	expect(calls).toBe(1);
	const controller = new AbortController(); controller.abort();
	await expect(client.domainResult('example.com', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
	expect(calls).toBe(1);
});

// Compile the existing Domain signature and the corrected canonical Stack call.
export async function existingStrictApp(client: ReturnType<typeof parseAPI>) {
	const domainCall: (domain: string, options?: DomainOptions) => Promise<Domain> = client.domain;
	const oldDomain = await domainCall('example.com');
	const known: boolean = oldDomain.available;
	const oldStack = await client.stack('example.com');
	const checkedAt: string | null = oldStack.checked_at;
	const currentView: StackResult = await client.stack('example.com');
	return { known, checkedAt, currentView };
}
