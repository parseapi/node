import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Country, type Email, type Hlr, type Ip, type Useragent, type Weather } from '../src/index.js';

it('requests 2.1 and returns optional detail at its actual root home', async () => {
 const body = { country: 'US', population: 0, tax: { name: null, rate: 0 }, future: { enabled: false } };
 const fetch = vi.fn(async (_url: RequestInfo | URL, options?: RequestInit) => {
  expect(new Headers(options?.headers).get('X-API-Version')).toBe('2.1.0');
  return Response.json(body);
 });
 const result = await parseAPI('fixture', { fetch }).country('US', { deep: true });
 expect(result).toEqual(body); expect(result.population).toBe(0); expect(result.tax?.rate).toBe(0);
 expect(Object.hasOwn(result, 'deep')).toBe(false); expect(fetch).toHaveBeenCalledTimes(1);
 expectTypeOf<Country['population']>().toEqualTypeOf<number | null | undefined>();
 expectTypeOf<Ip['proxy']>().toEqualTypeOf<boolean | null | undefined>();
 expectTypeOf<Weather['current']['dewpoint']>().toEqualTypeOf<number | null | undefined>();
 expectTypeOf<Hlr['roaming']>().toEqualTypeOf<boolean | null | undefined>();
 expectTypeOf<Useragent['device']['type']>().toEqualTypeOf<string | null>();
});

it('keeps basic Email and explicit verification as distinct wire operations', async () => {
 const calls: Array<{ url: URL; options?: RequestInit }> = [];
 const body = { email: 'a+b@example.com', valid: true, deliverable: false, catchall: null, status: 'undeliverable', reason: 'mailbox_not_found' };
 const parse = parseAPI('fixture', { fetch: async (url, options) => { calls.push({ url: new URL(String(url)), options }); return Response.json(body); } });
 await parse.email(body.email);
 const result: Email = await parse.email.verify(body.email);
 await parse.email(body.email, { deep: true }); // A temporary call-site migration alias.
 expect(calls[0]!.url.pathname).toBe('/email/a%2Bb%40example.com');
 expect(calls[0]!.options?.body).toBeUndefined();
 for (const call of calls.slice(1)) {
  expect(call.url.pathname).toBe('/email/verify'); expect(call.url.search).toBe('');
  expect(call.options?.method).toBe('POST'); expect(JSON.parse(String(call.options?.body))).toEqual({ email: body.email });
 }
 expect(result.deliverable).toBe(false); expect(result.catchall).toBeNull(); expect(Object.hasOwn(result, 'deep')).toBe(false);
});

it('never automatically repeats a mailbox verification after an uncertain failure', async () => {
 const fetch = vi.fn(async () => new Response('{"code":"unavailable","message":"Unavailable"}', { status: 503, headers: { 'Retry-After': '0' } }));
 await expect(parseAPI('fixture', { fetch }).email.verify('person@example.com')).rejects.toMatchObject({ status: 503 });
 expect(fetch).toHaveBeenCalledTimes(1);
 const controller = new AbortController(); controller.abort(); fetch.mockClear();
 await expect(parseAPI('fixture', { fetch }).email.verify('person@example.com', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
 expect(fetch).not.toHaveBeenCalled();
});
