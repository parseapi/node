import { expect, it } from 'vitest';
import { parseAPI, type CityList, type CityNearbyCoordinates } from '../src/index.js';

it('lists cities with exact filter names, zero populations and opaque continuations', async () => {
	const urls: URL[] = [];
	const first: CityList = { object: 'list', data: [], next_cursor: 'opaque+cursor/=' };
	const parse = parseAPI('test', { fetch: async input => {
		urls.push(new URL(String(input)));
		return new Response(JSON.stringify(urls.length === 1 ? first : { object: 'list', data: [], next_cursor: null }));
	} });
	const opts = { country: 'JP', minPopulation: 0, maxPopulation: 1000000, timezone: 'Asia/Tokyo', bbox: '170,-20,-170,20', sort: 'population' as const, order: 'desc' as const, limit: 7 };
	const result = await parse.city.list(opts);
	expect(result).toEqual(first);
	expect(await parse.city.list({ ...opts, cursor: result.next_cursor! })).toEqual({ object: 'list', data: [], next_cursor: null });
	expect(Object.fromEntries(urls[0]!.searchParams)).toEqual({ format: 'list', browse: 'true', country: 'JP', min_population: '0', max_population: '1000000', timezone: 'Asia/Tokyo', bbox: '170,-20,-170,20', sort: 'population', order: 'desc', limit: '7' });
	expect(urls[1]!.searchParams.get('cursor')).toBe('opaque+cursor/=');
});

it('adds coordinate-nearby lists without changing old nearest or named-nearby URLs', async () => {
	const urls: URL[] = [];
	const body: CityNearbyCoordinates = { latitude: 0, longitude: 0, radius: 3, unit: 'mi', object: 'list', data: [], next_cursor: null };
	const parse = parseAPI('test', { fetch: async input => {
		urls.push(new URL(String(input)));
		return new Response(JSON.stringify(body));
	} });
	expect(await parse.city.nearbyCoordinates(0, 0, { radius: 3, unit: 'mi', minPopulation: 0 })).toEqual(body);
	await parse.city.nearest(0, 0);
	await parse.city.nearby('Vienna');
	expect(Object.fromEntries(urls[0]!.searchParams)).toEqual({ lat: '0', lon: '0', nearby: 'true', format: 'list', radius: '3', unit: 'mi', min_population: '0' });
	expect(urls[1]!.pathname + urls[1]!.search).toBe('/city?lat=0&lon=0');
	expect(urls[2]!.pathname + urls[2]!.search).toBe('/city/Vienna/nearby');
});

it('opts search and named-nearby into paging while omitting disabled flags', async () => {
	const urls: URL[] = [];
	const old = { q: 'Wi', cities: [] };
	const parse = parseAPI('test', { fetch: async input => {
		urls.push(new URL(String(input)));
		return new Response(JSON.stringify(old));
	} });
	await parse.city.search('Wi', { page: true, cursor: 'cursor', minPopulation: 0, sort: 'name', order: 'asc' });
	await parse.city.nearby('Vienna', { page: true, cursor: 'cursor', maxPopulation: 0, timezone: 'Europe/Vienna', sort: 'distance' });
	expect(await parse.city.search('Wi', { page: false })).toEqual(old);
	expect(Object.fromEntries(urls[0]!.searchParams)).toEqual({ q: 'Wi', min_population: '0', page: 'true', cursor: 'cursor', sort: 'name', order: 'asc' });
	expect(urls[1]!.searchParams.get('max_population')).toBe('0');
	expect(urls[1]!.searchParams.get('page')).toBe('true');
	expect(urls[2]!.pathname + urls[2]!.search).toBe('/city?q=Wi');
});
