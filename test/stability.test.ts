import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, ParseAPIError, type ParseAPIClient, type Company, type Address } from '../src/index.js';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const success = () => new Response('{"ok":true}', { status: 200 });
const failed = () => new Response('{"code":"unavailable"}', { status: 503, headers: { 'Retry-After': '0' } });

describe('product retry defaults', () => {
	const paid: [string, (p: ParseAPIClient) => Promise<unknown>][] = [
		['carrier', p => p.carrier('555-0100')], ['caller', p => p.caller('555-0100')],
		['hlr', p => p.hlr('555-0100')], ['email deep', p => p.email('a@example.com', { deep: true })],
		['vat deep', p => p.vat('junk', { deep: true })], ['address deep', p => p.address('junk', { deep: true })],
	];
	it.each(paid)('%s makes one attempt by default', async (_name, invoke) => {
		const fetch = vi.fn(async () => failed());
		await expect(invoke(parseAPI('test_key', { fetch }))).rejects.toBeInstanceOf(ParseAPIError);
		expect(fetch).toHaveBeenCalledTimes(1);
	});
	it('does not replay a paid call after a lost response', async () => {
		const fetch = vi.fn(async () => { throw new TypeError('connection lost'); });
		await expect(parseAPI('test_key', { fetch }).carrier('555-0100')).rejects.toThrow('connection lost');
		expect(fetch).toHaveBeenCalledTimes(1);
	});
	it('retries an ordinary response interrupted after its headers arrive', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const fetch = vi.fn(async () => new Response(new ReadableStream({
			start(controller) { controller.error(new TypeError('body connection lost')); },
		})));
		await expect(parseAPI('test_key', { fetch }).country('US')).rejects.toThrow('body connection lost');
		expect(fetch).toHaveBeenCalledTimes(3);
	});
	it('does not replay a paid response interrupted after its headers arrive', async () => {
		const fetch = vi.fn(async () => new Response(new ReadableStream({
			start(controller) { controller.error(new TypeError('body connection lost')); },
		})));
		await expect(parseAPI('test_key', { fetch }).carrier('555-0100')).rejects.toThrow('body connection lost');
		expect(fetch).toHaveBeenCalledTimes(1);
	});
	it('does not retry malformed successful JSON', async () => {
		const fetch = vi.fn(async () => new Response('{invalid'));
		await expect(parseAPI('test_key', { fetch }).country('US')).rejects.toBeInstanceOf(SyntaxError);
		expect(fetch).toHaveBeenCalledTimes(1);
	});
	it('ordinary lookups retain two retries', async () => {
		const fetch = vi.fn(async () => failed());
		await expect(parseAPI('test_key', { fetch }).email('a@example.com')).rejects.toBeInstanceOf(ParseAPIError);
		expect(fetch).toHaveBeenCalledTimes(3);
	});
	it('explicit client and per-call retry counts override the product defaults', async () => {
		const fetch = vi.fn(async () => failed());
		const parse = parseAPI('test_key', { fetch, retries: 1 });
		await expect(parse.carrier('555-0100')).rejects.toBeInstanceOf(ParseAPIError);
		expect(fetch).toHaveBeenCalledTimes(2);
		fetch.mockClear();
		await expect(parse.carrier('555-0100', { retries: 0 })).rejects.toBeInstanceOf(ParseAPIError);
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});

describe('request controls', () => {
	it('an already cancelled request never reaches the transport', async () => {
		const fetch = vi.fn(async () => success());
		const controller = new AbortController();
		const reason = new Error('cancelled by caller');
		controller.abort(reason);
		await expect(parseAPI('test_key', { fetch }).country.states('US', { signal: controller.signal })).rejects.toBe(reason);
		expect(fetch).not.toHaveBeenCalled();
	});
	it('cancellation stops an in-flight request without retrying', async () => {
		const controller = new AbortController();
		const fetch = vi.fn((_input: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
			init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
		}));
		const call = parseAPI('test_key', { fetch }).country('US', { signal: controller.signal });
		const reason = new Error('navigation changed');
		controller.abort(reason);
		await expect(call).rejects.toBe(reason);
		expect(fetch).toHaveBeenCalledTimes(1);
	});
	it('cancellation stops a Retry-After wait and releases its timer', async () => {
		vi.useFakeTimers();
		const controller = new AbortController();
		const fetch = vi.fn(async () => new Response('{}', { status: 429, headers: { 'Retry-After': '5' } }));
		const call = parseAPI('test_key', { fetch }).country('US', { signal: controller.signal });
		const rejection = expect(call).rejects.toMatchObject({ name: 'AbortError' });
		await vi.advanceTimersByTimeAsync(0);
		controller.abort();
		await rejection;
		await vi.advanceTimersByTimeAsync(6000);
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(vi.getTimerCount()).toBe(0);
	});
	it('a per-call timeout overrides the client and does not become a query parameter', async () => {
		vi.useFakeTimers();
		let url = '';
		const fetch = vi.fn((input: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
			url = String(input);
			init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
		}));
		const call = parseAPI('test_key', { fetch, timeoutMs: 10000 }).postal('SW1A 1AA', { country: 'GB', timeoutMs: 20, retries: 0 });
		const rejection = expect(call).rejects.toMatchObject({ name: 'TimeoutError' });
		await vi.advanceTimersByTimeAsync(20);
		await rejection;
		expect(url).toBe('https://api.parseapi.com/postal/SW1A%201AA?country=GB');
		expect(vi.getTimerCount()).toBe(0);
	});
});

it('new public products keep inputs encoded and unknown response data intact', async () => {
	const urls: string[] = [];
	const fetch = vi.fn(async (input: unknown) => { urls.push(String(input)); return new Response('{"future":null,"valid":false}'); });
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.address('10 rue / Paris', { country: 'FR' })).resolves.toMatchObject({ future: null, valid: false });
	await parse.address.search('10 rue', { country: 'FR', postal: '75001' });
	await parse.company('51 824 753 556');
	await parse.timezone.at(0, 0);
	expect(urls).toEqual([
		'https://api.parseapi.com/address/10%20rue%20%2F%20Paris?country=FR',
		'https://api.parseapi.com/address?q=10+rue&country=FR&postal=75001',
		'https://api.parseapi.com/company/51%20824%20753%20556',
		'https://api.parseapi.com/timezone?lat=0&lon=0',
	]);
});

it('invalid company and address answers can contain a null normalized input', async () => {
	expectTypeOf<Company['company']>().toEqualTypeOf<string | null>();
	expectTypeOf<Address['address']>().toEqualTypeOf<string | null>();
	const fetch = vi.fn(async () => new Response('{"company":null,"address":null,"valid":false}'));
	const parse = parseAPI('test_key', { fetch });
	await expect(parse.company(' ')).resolves.toMatchObject({ company: null, valid: false });
	await expect(parse.address(' ')).resolves.toMatchObject({ address: null, valid: false });
});
