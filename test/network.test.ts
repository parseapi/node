import { afterEach, expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, ParseAPIError, type Asn, type Mac } from '../src/index.js';

afterEach(() => vi.restoreAllMocks());

it('ASN and MAC preserve unknown fields and nulls as plain data', async () => {
	const asn: Asn = { asn: 4294967295, name: null, country: null, country_name: null };
	const mac: Mac = { mac: 'junk', valid: false, vendor: null, local: null, multicast: null };
	const values = [{ ...asn, future: true }, { ...mac, future: null }];
	const fetch = vi.fn(async () => Response.json(values[fetch.mock.calls.length - 1]));
	const parse = parseAPI('test_key', { fetch });
	expectTypeOf(parse.asn).returns.toEqualTypeOf<Promise<Asn>>();
	expectTypeOf(parse.mac).returns.toEqualTypeOf<Promise<Mac>>();
	expect(await parse.asn('4294967295')).toEqual(values[0]);
	expect(await parse.mac('junk')).toEqual(values[1]);
});

it.each(['asn', 'mac'] as const)('%s uses ordinary retries and supports request controls', async method => {
	const fetch = vi.fn(async () => new Response('{"code":"unavailable","message":"Try later"}', { status: 503, headers: { 'Retry-After': '0' } }));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse[method]('input')).rejects.toBeInstanceOf(ParseAPIError);
	expect(fetch).toHaveBeenCalledTimes(3);
	fetch.mockClear();
	await expect(parse[method]('input', { retries: 0 })).rejects.toBeInstanceOf(ParseAPIError);
	expect(fetch).toHaveBeenCalledTimes(1);
});

it('an unknown ASN remains a catchable 404 without retries', async () => {
	const fetch = vi.fn(async () => new Response('{"code":"not_found","message":"Unknown ASN","request_id":"req_test"}', { status: 404 }));
	await expect(parseAPI('test_key', { fetch }).asn('AS64512')).rejects.toMatchObject({ status: 404, code: 'not_found', requestId: 'req_test' });
	expect(fetch).toHaveBeenCalledTimes(1);
});
