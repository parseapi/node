import { expect, it } from 'vitest';
import { parseAPI, type Npi } from '../src/index.js';

it('NPI forwards original input through one encoding step and returns invalid verdicts as data', async () => {
	const calls: URL[] = [];
	const invalid = { npi: '188101%208208', valid: false, registered: null, active: null, excluded: null };
	const parse = parseAPI('test_key', { fetch: async input => {
		calls.push(new URL(String(input)));
		return new Response(JSON.stringify(invalid));
	} });
	for (const npi of ['188101%208208', '188101%25208208', 'hello', '(188) 101-8208']) {
		await expect(parse.npi(npi)).resolves.toEqual(invalid);
		expect(decodeURIComponent(calls.at(-1)!.pathname.slice('/npi/'.length))).toBe(npi);
		expect(calls.at(-1)!.search).toBe('');
	}
});

it('NPI preserves unknown status, absent country and unavailable versus empty enrollment detail', async () => {
	const core: Npi = { npi: '1881018208', valid: true, registered: true,
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
		const record: Npi = { ...core, ...extra };
		const parse = parseAPI('test_key', { fetch: async () => new Response(JSON.stringify(record)) });
		await expect(parse.npi('1881018208', { deep: true })).resolves.toEqual(record);
	}
});
