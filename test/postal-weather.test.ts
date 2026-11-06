import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type DistrictDeep, type PostalDeep, type PostalPropertyTax, type PropertyTax, type WeatherMinute } from '../src/index.js';

it('reads compact Postal estimates and earlier metadata without changing District', async () => {
	expectTypeOf<PostalDeep['property_tax']>().toEqualTypeOf<PostalPropertyTax | null | undefined>();
	expectTypeOf<DistrictDeep['property_tax']>().toEqualTypeOf<PropertyTax | null | undefined>();
	const bodies = [{ postal: '10001', country: 'US' }, {}, { property_tax: null },
		{ currency: 'USD', property_tax: { annual_median: 0 }, future: true },
		{ property_tax: { annual_median: 1234.5, currency: 'USD', period: '2020-2024' } }];
	const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
	expect(Object.hasOwn((await parse.postal('10001')), 'deep')).toBe(false);
	expect(Object.hasOwn((await parse.postal('10001', { deep: true })), 'deep')).toBe(false);
	expect((await parse.postal('10001', { deep: true }))?.property_tax).toBeNull();
	const compact = await parse.postal('10001', { deep: true });
	expect(compact?.property_tax).toEqual({ annual_median: 0 });
	expect(compact?.currency).toBe('USD');
	expect(compact?.property_tax?.currency).toBeUndefined();
	expect(compact?.property_tax?.period).toBeUndefined();
	const legacy = await parse.postal('10001', { deep: true });
	expect(legacy?.property_tax).toEqual({ annual_median: 1234.5, currency: 'USD', period: '2020-2024' });
});

it('declares minute rates while forwarding server JSON without a response adapter', async () => {
	expectTypeOf<WeatherMinute['precipitation_rate']>().toEqualTypeOf<number | null>();
	expectTypeOf<WeatherMinute['precipitation_rate_in']>().toEqualTypeOf<number | null>();
	const bodies = [{ minutes: [
        { at: '2026-10-31T12:00:00Z', precipitation_rate: 1.8, precipitation_rate_in: 0.071, type: 'rain' },
        { at: '2026-10-31T12:01:00Z', precipitation_rate: 0, precipitation_rate_in: 0, type: null },
        { at: '2026-10-31T12:02:00Z', precipitation_rate: null, precipitation_rate_in: null, type: null },
    ], history: { precipitation: 12.3, precipitation_in: 0.484 } },
	{ minutes: [{ at: '2026-10-31T12:00:00Z', precipitation: 1.8, precipitation_in: 0.071, type: 'rain' }] }];
	let index = 0;
	const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify(bodies[index++])) });
	expect(await parse.weather(0, 0, { deep: true })).toEqual(bodies[0]);
	expect(await parse.weather(0, 0, { deep: true })).toEqual(bodies[1]);
});
