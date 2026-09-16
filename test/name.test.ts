import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Name, type NameDeep } from '../src/index.js';

it('preserves nullable name evidence and sends optional context', async () => {
	const urls: string[] = [];
	const parse = parseAPI('test_key', { fetch: async input => {
		urls.push(String(input));
		return new Response('{"name":"王","valid":true,"deep":{"gender":null,"salutation":null},"future":true}');
	} });
	const oldCall: (name: string) => Promise<Name> = parse.name;
	const result = await oldCall('王');
	expectTypeOf<'known'>().not.toMatchTypeOf<keyof NameDeep>();
	expectTypeOf(result.deep?.gender).toEqualTypeOf<'male' | 'female' | null | undefined>();
	expect(result.deep).not.toHaveProperty('known');
	expect(result.deep).not.toHaveProperty('countries');
	expect(result).toMatchObject({ deep: { gender: null, salutation: null }, future: true });
	await parse.name('Andrea / Smith', { country: 'IT', deep: true, retries: 0 });
	expect(urls).toEqual(['https://api.parseapi.com/name/%E7%8E%8B', 'https://api.parseapi.com/name/Andrea%20%2F%20Smith?country=IT&deep=true']);
});

it('passes the formatting locale and preserves flat, nullable and older name detail', async () => {
	const urls: URL[] = [];
	const details = [
		{ gender: 'male', salutation: 'Mr', short: 'R.J. Smith', directory: 'Smith, Robert James', initials: 'RJS' },
		{ gender: null, salutation: null, short: null, directory: null, initials: null },
		{ gender: null, salutation: null },
		{},
	];
	const parse = parseAPI('test_key', { fetch: async input => {
		urls.push(new URL(String(input)));
		return Response.json({ name: 'Robert James Smith', deep: details[urls.length - 1] });
	} });
	for (const detail of details) {
		const result = await parse.name('Robert James Smith', { deep: true, country: 'US', name_locale: 'en-GB' });
		expect(result.deep).toEqual(detail);
		expectTypeOf(result.deep?.short).toEqualTypeOf<string | null | undefined>();
		expectTypeOf(result.deep?.directory).toEqualTypeOf<string | null | undefined>();
		expectTypeOf(result.deep?.initials).toEqualTypeOf<string | null | undefined>();
	}
	for (const url of urls) expect(Object.fromEntries(url.searchParams)).toEqual({ country: 'US', deep: 'true', name_locale: 'en-GB' });
});
