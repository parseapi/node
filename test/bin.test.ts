import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Bin } from '../src/index.js';

it('preserves string prefixes, false prepaid, null fields, and empty deep', async () => {
	const body = { bin: '00123456', prefix: '001234', country: null, issuer: 'Fixture Bank', brand: 'future-brand', type: null, prepaid: false, deep: {}, future: true };
	const fetch = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify(body)));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.bin('00 1234-56', { deep: true })).resolves.toEqual(body);
	expect(String(fetch.mock.calls[0]![0])).toBe('https://api.parseapi.com/bin/00%201234-56?deep=true');
	expectTypeOf<Bin['prefix']>().toEqualTypeOf<string | null>();
	expectTypeOf<Bin['prepaid']>().toEqualTypeOf<boolean | null>();
});

it('keeps an unknown prefix distinct from malformed input and omits unrequested deep', async () => {
	const body = { bin: '000000', prefix: null, country: null, issuer: null, brand: null, type: null, prepaid: null };
	const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(body)))
		.mockResolvedValueOnce(new Response('{"code":"invalid_input","message":"Expected 6-11 digits"}', { status: 400 }));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.bin('000000')).resolves.toEqual(body);
	expect(String(fetch.mock.calls[0]![0])).toBe('https://api.parseapi.com/bin/000000');
	await expect(parse.bin('bad/input')).rejects.toMatchObject({ status: 400, code: 'invalid_input' });
	expect(String(fetch.mock.calls[1]![0])).toContain('/bin/bad%2Finput');
	expect(fetch).toHaveBeenCalledTimes(2);
});
