import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Name } from '../src/index.js';

it('keeps name membership and countries independent of gender and sends optional context', async () => {
	const urls: string[] = [];
	const parse = parseAPI('test_key', { fetch: async input => {
		urls.push(String(input));
		return new Response('{"name":"王","valid":true,"deep":{"known":true,"countries":["CN","TW"],"gender":null},"future":true}');
	} });
	const oldCall: (name: string) => Promise<Name> = parse.name;
	const result = await oldCall('王');
	expectTypeOf(result.deep?.known).toEqualTypeOf<boolean | null | undefined>();
	expectTypeOf(result.deep?.countries).toEqualTypeOf<string[] | null | undefined>();
	expect(result).toMatchObject({ deep: { known: true, countries: ['CN', 'TW'], gender: null }, future: true });
	await parse.name('Andrea / Smith', { country: 'IT', deep: true, retries: 0 });
	expect(urls).toEqual(['https://api.parseapi.com/name/%E7%8E%8B', 'https://api.parseapi.com/name/Andrea%20%2F%20Smith?country=IT&deep=true']);
});
