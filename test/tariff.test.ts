import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type TariffSearchHit } from '../src/index.js';

it('preserves parent context, older search results and encoded product words', async () => {
	const urls: string[] = [];
	const legacy: TariffSearchHit = { hts: '0101.29.00.90', description: 'Other', general: null };
	for (const extra of [{}, { lineage: null }, { lineage: [] }, { lineage: ['Live horses', 'Other horses'] }]) {
		const body = { q: 'horses & ponies', revision: 'fixture', lines: [{ ...legacy, ...extra, future: true }] };
		const client = parseAPI('test', { fetch: async input => { urls.push(String(input)); return new Response(JSON.stringify(body)); } });
		expect(await client.tariff.search('horses & ponies')).toEqual(body);
	}
	expect(urls).toEqual(Array(4).fill('https://api.parseapi.com/tariff?q=horses+%26+ponies'));
	expectTypeOf<TariffSearchHit['lineage']>().toEqualTypeOf<string[] | null | undefined>();
});

it('serializes edition/date on lookup and search while preserving nullable open reasons', async () => {
	const edition = 'a'.repeat(64);
	const requests: URL[] = [];
	const payload = { hts: '0101', revision: 'fixture', edition, date: '2026-09-15', deep: { effective_rate: null, reason: 'future_reason', measures: [] } };
	const client = parseAPI('test', { fetch: async input => { const url = new URL(String(input)); requests.push(url); return new Response(JSON.stringify({ ...payload, date: url.searchParams.get('date') })); } });
	expect(await client.tariff('0101', { edition, date: '2026-09-15', origin: 'CA', deep: true })).toEqual(payload);
	expect(Object.fromEntries(requests[0]!.searchParams)).toEqual({ edition, date: '2026-09-15', origin: 'CA', deep: 'true' });
	await client.tariff.search('horses', { edition, date: '2026-09-15' });
	expect(Object.fromEntries(requests[1]!.searchParams)).toEqual({ q: 'horses', edition, date: '2026-09-15' });
	await client.tariff('0101', { edition });
	expect(requests[2]!.searchParams.has('date')).toBe(false);
});

it('rejects an old server that silently ignores an explicit edition or date', async () => {
	const client = parseAPI('test', { fetch: async () => new Response(JSON.stringify({ hts: '0101', revision: 'old', lines: [] })) });
	await expect(client.tariff('0101', { edition: 'a'.repeat(64) })).rejects.toMatchObject({ code: 'tariff_selection_mismatch', status: 0 });
	await expect(client.tariff.search('horses', { date: '2026-09-15' })).rejects.toMatchObject({ code: 'tariff_selection_mismatch', status: 0 });
});

it.each(['legacy', '', 'A'.repeat(64), `${'a'.repeat(64)}\n`])('rejects a date response with invalid edition %j', async edition => {
	const client = parseAPI('test', { fetch: async () => new Response(JSON.stringify({ hts: '0101', revision: 'fixture', edition, date: '2026-09-15', lines: [] })) });
	await expect(client.tariff('0101', { date: '2026-09-15' })).rejects.toMatchObject({ code: 'tariff_selection_mismatch', status: 0 });
	await expect(client.tariff.search('horses', { date: '2026-09-15' })).rejects.toMatchObject({ code: 'tariff_selection_mismatch', status: 0 });
});
