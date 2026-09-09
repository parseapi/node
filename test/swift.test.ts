import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type SwiftCode, type SwiftOptions } from '../src/index.js';

it('encodes the original code and preserves unknown institution names and future fields', async () => {
	const body = { swift: 'ZZZZUS33', valid: true, country: 'US', name: null, future: 'retained' };
	const fetch = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify(body)));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.swift(' bofa/us3n? ')).resolves.toEqual(body);
	expect(String(fetch.mock.calls[0]![0])).toBe('https://api.parseapi.com/swift/%20bofa%2Fus3n%3F%20');
	expectTypeOf<SwiftCode['name']>().toEqualTypeOf<string | null>();
	expectTypeOf<'deep'>().not.toMatchTypeOf<keyof SwiftOptions>();
});

it('keeps malformed-code data distinct from request failures', async () => {
	const fetch = vi.fn()
		.mockResolvedValueOnce(new Response('{"swift":"JUNK","valid":false,"country":null,"name":null}'))
		.mockResolvedValueOnce(new Response('{"code":"service_unavailable","message":"Lookup unavailable"}', { status: 503 }));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.swift('junk')).resolves.toMatchObject({ valid: false, name: null });
	await expect(parse.swift('BOFAUS3N', { retries: 0 })).rejects.toMatchObject({ status: 503, code: 'service_unavailable' });
	expect(fetch).toHaveBeenCalledTimes(2);
});
