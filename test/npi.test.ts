import { expect, it } from 'vitest';
import { parseAPI, type Provider } from '../src/index.js';

it('NPI forwards original input through one encoding step and returns invalid verdicts as data', async () => {
	const calls: URL[] = [];
	const invalid = { npi: '188101%208208', valid: false, registered: null, active: null, excluded: null };
	const parse = parseAPI('test_key', { fetch: async input => {
		calls.push(new URL(String(input)));
		return new Response(JSON.stringify(invalid));
	} });
	for (const npi of ['188101%208208', '188101%25208208', 'hello', '(188) 101-8208']) {
		await expect(parse.provider(npi)).resolves.toEqual(invalid);
		expect(decodeURIComponent(calls.at(-1)!.pathname.slice('/provider/'.length))).toBe(npi);
		expect(calls.at(-1)!.search).toBe('');
	}
});

it('NPI preserves unknown status, absent country and unavailable versus empty enrollment detail', async () => {
	const core: Provider = { npi: '1881018208', valid: true, registered: true,
		active: null, excluded: null, country: null, type: 'organization',
		name: null, first: null, last: null, credential: null, specialty: null,
		taxonomy: null, address: null, city: null, state: null, state_name: null, postal: null, phone: null };
	for (const extra of [{}, { deep: {} },
		{ deep: { deactivated_at: null, medicare: null, opt_out: null, enrollments: null } },
		{ deep: { deactivated_at: null, medicare: true, opt_out: false, enrollments: null } },
		{ deep: { deactivated_at: null, medicare: false, opt_out: false, enrollments: [] } },
		{ deep: { deactivated_at: null, medicare: true, opt_out: null,
			enrollments: [{ type: 'future_type', specialty: null, state: null }] } },
	]) {
		const record: Provider = { ...core, ...extra };
		const parse = parseAPI('test_key', { fetch: async () => new Response(JSON.stringify(record)) });
		await expect(parse.provider('1881018208', { deep: true })).resolves.toEqual(record);
	}
});

it('NPI source metadata and full taxonomy detail survive the client unchanged', async () => {
 const response = { npi: '1881018208', valid: true, registered: true,
  sources: { nppes: { edition: 'a'.repeat(64), published_at: null, through: '2026-09-20', imported_at: '2026-09-24T12:00:00.000Z' }, leie: null, pecos: null, optout: null },
  deep: { deactivated_at: null, enumerated_at: '2007-01-02', updated_at: '2026-09-18', reactivated_at: null,
   taxonomies: [{ taxonomy: '207Q00000X', specialty: 'Family Medicine Physician', primary: true, license: '000123', state: 'NY' }] } };
 const parse = parseAPI('test_key', { fetch: async () => new Response(JSON.stringify(response)) });
 const actual = await parse.provider('1881018208', { deep: true });
 expect(actual).toEqual(response);
 expect(actual.sources?.nppes?.published_at).toBeNull();
 expect(actual.deep?.taxonomies?.[0]?.license).toBe('000123');
});
