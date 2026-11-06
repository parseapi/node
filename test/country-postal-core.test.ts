import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Country } from '../src/index.js';

const base: Country = {
	country: 'US', name: 'United States', name_local: null, continent: 'NA',
	currency: 'USD', currency_name: 'US Dollar', currency_symbol: '$',
	calling_code: '+1', flag: '🇺🇸', languages: ['en'], timezones: ['America/New_York'],
};

it('reads Core postal guidance without requesting paid detail and preserves older missing fields', async () => {
	const bodies = [
		{ ...base, postal_format: '#####', postal_regex: '^(?:\\d{5}(?:-\\d{4})?)$' },
		{ ...base, postal_format: null, postal_regex: null },
		base,
	];
	const calls: URL[] = [];
	const client = parseAPI('fixture', { fetch: async (input, init) => {
		calls.push(new URL(String(input)));
		expect(new Headers(init?.headers).get('X-API-Version')).toBe('2.1.0');
		return new Response(JSON.stringify(bodies[calls.length - 1]));
	} });
	for (const expected of bodies) expect(await client.country('US')).toEqual(expected);
	expect(calls).toHaveLength(3);
	for (const url of calls) {
		expect(url.pathname).toBe('/country/US');
		expect(url.search).toBe('');
	}
	expectTypeOf<Country['postal_format']>().toEqualTypeOf<string | null | undefined>();
	expectTypeOf<Country['postal_regex']>().toEqualTypeOf<string | null | undefined>();
});
