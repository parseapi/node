import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Country, type CountryDeep, type CountryElevationPoint } from '../src/index.js';

it('keeps Country geography optional for older typed consumers', () => {
	type Geography = 'land_area' | 'water_area' | 'coastline' | 'elevation' | 'lowest_point' | 'highest_point';
	expectTypeOf<Omit<CountryDeep, Geography>>().toMatchTypeOf<CountryDeep>();
	expectTypeOf<NonNullable<Country['deep']>['land_area']>().toEqualTypeOf<number | null | undefined>();
	expectTypeOf<NonNullable<Country['deep']>['lowest_point']>().toEqualTypeOf<CountryElevationPoint | null | undefined>();
});

it('preserves decimals, zero and negative elevations in Country deep', async () => {
	const deep = { land_area: 10010.5, water_area: 0, coastline: 0, elevation: 0,
		lowest_point: { name: null, elevation: -430.5 }, highest_point: { name: 'Summit', elevation: 8848.86 } };
	const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify({ country: 'XX', deep })) });
	expect((await parse.country('XX', { deep: true })).deep).toEqual(deep);
});

it('decodes older, locked and explicit null Country geography', async () => {
	for (const deep of [undefined, {}, { land_area: null, water_area: null, coastline: null, elevation: null, lowest_point: null, highest_point: null }]) {
		const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify({ country: 'XX', deep })) });
		expect((await parse.country('XX')).deep).toEqual(deep);
	}
});
