import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Country, type CountryDeep, type CountryElevationPoint } from '../src/index.js';

it('keeps Country geography optional for older typed consumers', () => {
	type Geography = 'land_area' | 'water_area' | 'coastline' | 'elevation' | 'lowest_point' | 'highest_point';
	expectTypeOf<Omit<CountryDeep, Geography>>().toMatchTypeOf<CountryDeep>();
	expectTypeOf<Country['land_area']>().toEqualTypeOf<number | null | undefined>();
	expectTypeOf<Country['lowest_point']>().toEqualTypeOf<CountryElevationPoint | null | undefined>();
});

it('preserves decimals, zero and negative elevations in Country deep', async () => {
	const deep = { land_area: 10010.5, water_area: 0, coastline: 0, elevation: 0,
		lowest_point: { name: null, elevation: -430.5 }, highest_point: { name: 'Summit', elevation: 8848.86 } };
	const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify({ country: 'XX', ...deep })) });
	expect((await parse.country('XX', { deep: true }))).toEqual({ country: 'XX', ...deep });
});

it('decodes older, locked and explicit null Country geography', async () => {
	for (const deep of [undefined, {}, { land_area: null, water_area: null, coastline: null, elevation: null, lowest_point: null, highest_point: null }]) {
		const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify({ country: 'XX', ...deep })) });
		expect((await parse.country('XX'))).toEqual({ country: 'XX', ...deep });
	}
});

it('keeps the five Country statistics optional and preserves their numeric values', async () => {
 type Statistics = 'gdp_usd' | 'gdp_per_capita_usd' | 'population_growth_percent' | 'urban_population_percent' | 'internet_users_percent';
 expectTypeOf<Omit<CountryDeep, Statistics>>().toMatchTypeOf<CountryDeep>();
 const deep = { gdp_usd: 30769700000000, gdp_per_capita_usd: 90026.5163, population_growth_percent: -0.25, urban_population_percent: 0, internet_users_percent: 95.5 };
 const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify({ country: 'US', ...deep })) });
 expect((await parse.country('US', { deep: true }))).toEqual({ country: 'US', ...deep });
});
