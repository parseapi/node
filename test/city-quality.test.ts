import { expect, it } from 'vitest';
import { parseAPI, type City } from '../src/index.js';

it('carries City scope and opt-in matching through every applicable operation', async () => {
	const urls: URL[] = [];
	const parse = parseAPI('test', { fetch: async input => {
		urls.push(new URL(String(input)));
		return new Response(JSON.stringify({ id: 'city_7aj899nvwyku', parent: null, grain: 'municipality' }));
	} });
	const scope = { country: 'JP', state: '27', type: 'city', grain: 'municipality' as const, hierarchy: true };
	const options = { ...scope, aliases: true, ambiguity: 'error' as const };
	await parse.city('Sakai', options);
	await parse.city.search('Sakai', { ...scope, aliases: true });
	await parse.city.nearest(34.57, 135.48, scope);
	await parse.city.nearby('Sakai', options);
	await parse.city.id('city_7aj899nvwyku', { hierarchy: true });
	expect(urls).toHaveLength(5);
	for (const url of urls.slice(0, 4)) for (const [key, value] of Object.entries(scope)) expect(url.searchParams.get(key)).toBe(String(value));
	expect(urls[0]!.searchParams.get('ambiguity')).toBe('error');
	expect(urls[0]!.searchParams.get('aliases')).toBe('true');
	expect(urls[1]!.searchParams.get('aliases')).toBe('true');
	expect(urls[2]!.searchParams.has('aliases')).toBe(false);
	expect(urls[3]!.searchParams.get('ambiguity')).toBe('error');
	expect(urls[4]!.searchParams.get('hierarchy')).toBe('true');
});

it('keeps disabled options absent and preserves parent null versus omitted', async () => {
	const older = { id: 'city_7aj899nvwyku', name: 'Vienna' };
	const parse = parseAPI('test', { fetch: async input => {
		const query = new URL(String(input)).searchParams;
		expect(query.has('aliases')).toBe(false);
		expect(query.has('hierarchy')).toBe(false);
		return new Response(JSON.stringify(older));
	} });
	const result: City = await parse.city('Vienna', { aliases: false, hierarchy: false });
	expect(result).toEqual(older);
	expect(Object.hasOwn(result, 'parent')).toBe(false);
});
