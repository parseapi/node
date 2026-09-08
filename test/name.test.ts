import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Name } from '../src/index.js';

it('keeps name membership and countries independent of gender and sends optional context', async () => {
	const urls: string[] = [];
	const parse = parseAPI('test_key', { fetch: async input => {
		urls.push(String(input));
		return new Response('{"name":"王","valid":true,"known":true,"countries":["CN","TW"],"gender":null,"future":true}');
	} });
	const oldCall: (name: string) => Promise<Name> = parse.name;
	const result = await oldCall('王');
	expectTypeOf(result.known).toEqualTypeOf<boolean>();
	expectTypeOf(result.countries).toEqualTypeOf<string[]>();
	expect(result).toMatchObject({ known: true, countries: ['CN', 'TW'], gender: null, future: true });
	await parse.name('Andrea / Smith', { country: 'IT', retries: 0 });
	expect(urls).toEqual(['https://api.parseapi.com/name/%E7%8E%8B', 'https://api.parseapi.com/name/Andrea%20%2F%20Smith?country=IT']);
});
