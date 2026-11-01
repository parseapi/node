import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Card, type CardOptions, type CardDeep, type Deep } from '../src/index.js';

// An existing but empty Deep object does not guarantee an issuer field.
function unsafeIssuerAccess(card: Card) {
	if (card.deep && card.deep.issuer !== null) {
		// @ts-expect-error Card Deep may omit issuer, even when deep exists.
		return card.deep.issuer.toUpperCase();
	}
	return null;
}
void unsafeIssuerAccess;

it('returns core identity and requests typed optional Deep while preserving false and null', async () => {
	const body = { bin:'00123456', brand:null, brand_name:null, logo:'https://cdn.parseapi.com/card/generic.svg', deep:{prefix:'001234',issuer:null,country:null,type:null,prepaid:false} };
	const fetch = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify(body)));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.card('00 1234-56', { deep:true })).resolves.toEqual(body);
	expect(String(fetch.mock.calls[0]![0])).toBe('https://api.parseapi.com/card/00%201234-56?deep=true');
	expectTypeOf<CardDeep['prefix']>().toEqualTypeOf<string | null>();
	expectTypeOf<CardDeep['prepaid']>().toEqualTypeOf<boolean | null>();
	expectTypeOf<CardOptions['deep']>().toEqualTypeOf<boolean | undefined>();
	expectTypeOf<Card['deep']>().toEqualTypeOf<Deep<CardDeep> | undefined>();
});

it('preserves omitted, empty, unknown and populated Card details without inventing fields', async () => {
	const core = { bin: '411111', brand: 'visa', brand_name: 'Visa', logo: 'https://example.com/visa.svg' };
	const bodies = [core, { ...core, deep: {} }, { ...core, deep: { issuer: null, prepaid: false } },
		{ ...core, deep: { issuer: 'Example bank', prepaid: false, future: true } }];
	const expected = structuredClone(bodies);
	const fetch = vi.fn(async () => new Response(JSON.stringify(bodies.shift())));
	const parse = parseAPI('fixture', { fetch });
	for (const body of expected) {
		const card = await parse.card('411111', { deep: true });
		expect(card).toEqual(body);
		const issuer = card.deep?.issuer;
		expect(typeof issuer === 'string' ? issuer.toUpperCase() : null)
			.toBe('deep' in body && typeof body.deep.issuer === 'string' ? 'EXAMPLE BANK' : null);
	}
	expect(fetch).toHaveBeenCalledTimes(4);
});

it('keeps an unknown prefix distinct from malformed input and omits unrequested deep', async () => {
	const body = { bin: '000000', brand: null, brand_name:null, logo:'https://cdn.parseapi.com/card/generic.svg' };
	const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(body)))
		.mockResolvedValueOnce(new Response('{"code":"invalid_input","message":"Expected 2-11 digits"}', { status: 400 }));
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
	for (const input of ['', '1', '123456789012', '4242424242424242', '００１２３４', '00\u00a01234', '00\v1234', '00%201234', '00+1234', '00/1234', '00_1234', ' '.repeat(59)+'001234', 123456, null, undefined]) {
		await expect(parse.card(input as string)).rejects.toThrow('parseAPI: Card requires a string containing 2 to 11 digits. Send a prefix only.');
	}
	expect(fetch).not.toHaveBeenCalled();
});

it('forwards the original accepted prefix and request controls', async () => {
	const fetch = vi.fn(async (_input: RequestInfo | URL) => new Response('{}'));
	const parse = parseAPI('fixture', { fetch });
	for (const input of ['51', '411', '4111', '41111', '001234', '00123456789', '00 1234-56', '00\t12\r34\n-56', ' '.repeat(58)+'001234']) {
		await parse.card(input, { retries: 0, timeoutMs: 1000 });
		expect(String(fetch.mock.calls.at(-1)![0])).toBe('https://api.parseapi.com/card/'+encodeURIComponent(input));
	}
	const controller = new AbortController(); controller.abort();
	await expect(parse.card('001234', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
	expect(fetch).toHaveBeenCalledTimes(9);
});
