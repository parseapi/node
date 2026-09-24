import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseAPI, type Bank, type BankChecks, type BankIssue } from '../src/index.js';

const fixture = JSON.parse(readFileSync(new URL('./bank-fixtures.json', import.meta.url), 'utf8')) as { records: Bank[]; inputs: string[] };

it('Bank preserves older, current and future check results and leading zeros', async () => {
	for (const record of fixture.records) {
		const client = parseAPI('test_key', { fetch: async () => new Response(JSON.stringify(record)), retries: 0 });
		const result = await client.bank('DE89370400440532013000', { deep: true });
		expect(result).toEqual(record);
		const checks: BankChecks | undefined = result.checks;
		const issues: BankIssue[] | undefined = result.issues;
		expect(checks?.national).toBe(record.checks?.national);
		expect(issues?.[0]?.code).toBe(record.issues?.[0]?.code);
	}
	expect(fixture.records[1]?.deep?.account).toBe('0532013000');
});

it('Bank sends raw input and options only in a POST body', async () => {
	const calls: { url: URL; init?: RequestInit }[] = [];
	const client = parseAPI('test_key', { fetch: async (input, init) => {
		calls.push({ url: new URL(String(input)), init });
		return new Response('{}');
	}, retries: 0 });
	for (const input of fixture.inputs) {
		await client.bank(input, { country: 'DE', deep: true, timeoutMs: 500, retries: 0 });
		const { url, init } = calls.at(-1)!;
		expect(url.pathname + url.search).toBe('/bank');
		expect(init?.method).toBe('POST');
		expect(JSON.parse(String(init?.body))).toEqual({ iban: input, country: 'DE', deep: true });
		expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
		expect(new Headers(init?.headers).get('Parse-Version')).toBe('2.0.0');
	}
	await client.bank('raw', { deep: false });
	expect(JSON.parse(String(calls.at(-1)?.init?.body))).toEqual({ iban: 'raw', deep: false });
});

it('Bank US ACH preserves opaque account bytes and requirements preserves future values', async () => {
	const calls: { url: URL; init?: RequestInit }[] = [];
	let payload: unknown = { format: 'us_ach', country: 'US', routing: '011000015', account: ' 00aB-%20\uFEFF', valid: false, bank_name: null, checks: { routing_format: 'passed', routing_checksum: 'passed', account_format: 'future-state', account_checksum: 'not_supported' }, issues: [{ field: 'account', code: 'future-code', message: 'Static issue' }] };
	const client = parseAPI('test_key', { retries: 0, fetch: async (input, init) => {
		calls.push({ url: new URL(String(input)), init });
		return new Response(JSON.stringify(payload));
	} });
	const raw = { routing: '\t011-000-015', account: ' 00aB-%20\uFEFF' };
	expect(await client.bankUsAch(raw)).toEqual(payload);
	expect(calls[0]!.url.pathname + calls[0]!.url.search).toBe('/bank');
	expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ format: 'us_ach', country: 'US', ...raw });
	payload = { country: 'US', format: 'future-format', supported: false, fields: [], checks: { future: 'not_supported' }, limitations: ['No verification'] };
	expect(await client.bankRequirements('US', { format: 'future-format' })).toEqual(payload);
	expect(calls[1]?.url.pathname).toBe('/bank/requirements');
	expect(Object.fromEntries(calls[1]!.url.searchParams)).toEqual({ country: 'US', format: 'future-format' });
	expect(calls[1]?.init?.body).toBeUndefined();
});

it('Bank retries preserve the JSON body and long Retry-After remains authoritative', async () => {
	const bodies: unknown[] = [];
	const client = parseAPI('test_key', { retries: 1, fetch: async (_input, init) => {
		bodies.push(init?.body);
		return bodies.length === 1 ? new Response('{}', { status: 503, headers: { 'Retry-After': '0' } }) : new Response('{}');
	} });
	await client.bank('raw%20\uFEFF', { deep: true });
	expect(bodies).toHaveLength(2);
	expect(bodies[1]).toBe(bodies[0]);
	const blocked = parseAPI('test_key', { fetch: async () => new Response('{"code":"service_unavailable"}', { status: 503, headers: { 'Retry-After': '120' } }) });
	await expect(blocked.bank('raw')).rejects.toMatchObject({ status: 503, retryAfter: '120' });
});


it('Bank deep directory evidence stays optional with open match grain', async () => {
	const old = { ...fixture.records[1]! };
	const current = { ...old, deep: { ...old.deep, directory: { edition: 'a'.repeat(64), country: 'FR', match: 'future-grain' } } };
	for (const payload of [old, current]) {
		const client = parseAPI('test_key', { retries: 0, fetch: async () => new Response(JSON.stringify(payload)) });
		expect(await client.bank('raw', { deep: true })).toEqual(payload);
	}
});


it('the published deterministic Bank fixture kit round-trips through the SDK', async () => {
	const kit = JSON.parse(readFileSync(new URL('./bank-public-fixtures.json', import.meta.url), 'utf8')) as { cases: { id: string; request: { body: { iban?: string; routing?: string; account?: string; country?: string; deep?: boolean } }; response: { status: number; headers: Record<string, string>; body: Record<string, unknown> } }[] };
	for (const row of kit.cases) {
		const client = parseAPI('fixture', { retries: 0, fetch: async (url, init) => {
			expect(new URL(String(url)).pathname + new URL(String(url)).search, row.id).toBe('/bank');
			expect(init?.method, row.id).toBe('POST');
			expect(JSON.parse(String(init?.body)), row.id).toEqual(row.request.body);
			return new Response(JSON.stringify(row.response.body), { status: row.response.status, headers: row.response.headers });
		} });
		const input = row.request.body;
		const result = input.iban !== undefined ? client.bank(input.iban, { country: input.country, deep: input.deep }) : client.bankUsAch({ routing: input.routing!, account: input.account! });
		if (row.response.status < 400) await expect(result, row.id).resolves.toEqual(row.response.body);
		else await expect(result, row.id).rejects.toMatchObject({ status: 503, code: 'service_unavailable', message: row.response.body.message, requestId: 'bank-fixture' });
	}
});
