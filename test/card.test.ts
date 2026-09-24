import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Card, type CardOptions, type RequestOptions } from '../src/index.js';

it('preserves string prefixes, false prepaid and null fields with a core-only call', async () => {
	const body = { bin: '00123456', prefix: '001234', country: null, issuer: 'Fixture Bank', brand: 'future-brand', type: null, prepaid: false, deep: {}, future: true };
	const fetch = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify(body)));
	const parse = parseAPI('test_key', { fetch });
	expect(parse).not.toHaveProperty('bin');
	await expect(parse.card('00 1234-56')).resolves.toEqual(body);
	expect(String(fetch.mock.calls[0]![0])).toBe('https://api.parseapi.com/card/00%201234-56');
	expectTypeOf<Card['prefix']>().toEqualTypeOf<string | null>();
	expectTypeOf<Card['prepaid']>().toEqualTypeOf<boolean | null>();
	expectTypeOf<CardOptions>().toEqualTypeOf<RequestOptions>();
	expectTypeOf<'deep' extends keyof Card ? true : false>().toEqualTypeOf<false>();
});

it('keeps an unknown prefix distinct from malformed input and omits unrequested deep', async () => {
	const body = { bin: '000000', prefix: null, country: null, issuer: null, brand: null, type: null, prepaid: null };
	const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(body)))
		.mockResolvedValueOnce(new Response('{"code":"invalid_input","message":"Expected 6-11 digits"}', { status: 400 }));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.card('000000')).resolves.toEqual(body);
	expect(String(fetch.mock.calls[0]![0])).toBe('https://api.parseapi.com/card/000000');
	await expect(parse.card('001234')).rejects.toMatchObject({ status: 400, code: 'invalid_input' });
	expect(String(fetch.mock.calls[1]![0])).toContain('/card/001234');
	expect(fetch).toHaveBeenCalledTimes(2);
});

it('rejects invalid or full card numbers before dispatch without echoing input', async () => {
	const fetch = vi.fn();
	const parse = parseAPI('fixture', { fetch });
	for (const input of ['', '12345', '123456789012', '4242424242424242', '００１２３４', '00\u00a01234', '00\v1234', '00%201234', '00+1234', '00/1234', '00_1234', ' '.repeat(59)+'001234', 123456, null, undefined]) {
		await expect(parse.card(input as string)).rejects.toThrow('parseAPI: Card requires a string containing 6 to 11 digits. Send a prefix only.');
	}
	expect(fetch).not.toHaveBeenCalled();
});

it('forwards the original accepted prefix and request controls', async () => {
	const fetch = vi.fn(async (_input: RequestInfo | URL) => new Response('{}'));
	const parse = parseAPI('fixture', { fetch });
	for (const input of ['001234', '00123456789', '00 1234-56', '00\t12\r34\n-56', ' '.repeat(58)+'001234']) {
		await parse.card(input, { retries: 0, timeoutMs: 1000 });
		expect(String(fetch.mock.calls.at(-1)![0])).toBe('https://api.parseapi.com/card/'+encodeURIComponent(input));
	}
	const controller = new AbortController(); controller.abort();
	await expect(parse.card('001234', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
	expect(fetch).toHaveBeenCalledTimes(5);
});
