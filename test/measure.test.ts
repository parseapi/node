import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Measure, type MeasureOptions } from '../src/index.js';

const fixture = { measure: '5 ft 11 in', valid: true, type: 'length', amount: '180.34', unit: 'cm', reason: null, choices: [], future: null };

it('encodes mixed measurements and compound units while preserving decimal strings', async () => {
	const urls: string[] = [];
	const fetch = vi.fn(async (input: unknown) => { urls.push(String(input)); return new Response(JSON.stringify(fixture)); });
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.measure('5 ft 11 in', { to: 'cm', locale: 'en-US', system: 'us', retries: 0 })).resolves.toEqual(fixture);
	await parse.measure('1 kg/m^3', { to: 'g/L' });
	await parse.measure.units({ query: 'US gallon', type: 'volume', unit: 'L' });
	await parse.measure.units();
	expect(urls).toEqual([
		'https://api.parseapi.com/measure/5%20ft%2011%20in?to=cm&locale=en-US&system=us',
		'https://api.parseapi.com/measure/1%20kg%2Fm%5E3?to=g%2FL',
		'https://api.parseapi.com/measure/units?q=US+gallon&type=volume&unit=L',
		'https://api.parseapi.com/measure/units',
	]);
	expectTypeOf<Measure['amount']>().toEqualTypeOf<string | null>();
	expectTypeOf<'deep'>().not.toMatchTypeOf<keyof MeasureOptions>();
});

it('preserves unknown types, nulls, ambiguity choices and decimal zero', async () => {
	for (const body of [
		{ ...fixture, amount: '0', type: 'future-type' },
		{ ...fixture, measure: '1 gallon', valid: false, type: null, amount: null, unit: null, reason: 'ambiguous_unit', choices: [{ unit: 'us_gal', name: 'US liquid gallon' }] },
	]) {
		const parse = parseAPI('test_key', { fetch: async () => new Response(JSON.stringify(body)) });
		await expect(parse.measure(body.measure)).resolves.toEqual(body);
	}
});

it('keeps incompatible targets on the normal API error path without retrying 400', async () => {
	const fetch = vi.fn(async () => new Response('{"code":"bad_request","message":"Incompatible units","request_id":"req_measure"}', { status: 400 }));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.measure('1 m', { to: 'kg' })).rejects.toMatchObject({ status: 400, code: 'bad_request', requestId: 'req_measure' });
	expect(fetch).toHaveBeenCalledTimes(1);
});
