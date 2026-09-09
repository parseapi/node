import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Carrier, type Hlr, type Time, type TimezoneConversionTarget, type Weather, type Name } from '../src/index.js';
const rows = [["country", ["US"], {}], ["state", ["NC"], {"country": "US"}], ["state.districts", ["NC"], {"country": "US"}], ["district", ["37081"], {"country": "US", "state": "NC"}], ["city", ["Charlotte"], {"country": "US", "state": "NC"}], ["city.id", ["city_test"], {}], ["city.search", ["Charlotte"], {"country": "US", "state": "NC", "limit": 2}], ["city.nearest", [0, 0], {}], ["city.nearby", ["Charlotte"], {"radius": 0, "unit": "km", "country": "US", "state": "NC", "limit": 2}], ["postal", ["28202"], {"country": "US"}], ["postal.nearby", ["28202"], {"country": "US", "radius": 0, "unit": "km"}], ["postal.distance", ["28202", "10001"], {"country": "US"}], ["iban", ["DE89370400440532013000"], {"country": "DE"}], ["carrier", ["+14155552671"], {"country": "US"}], ["hlr", ["+447712345678"], {"country": "GB"}], ["naics", ["31-33"], {}], ["naics.search", ["coffee"], {"limit": 2}], ["currency", ["USD"], {}], ["language", ["ar"], {}], ["name", ["Andrea"], {"country": "IT"}], ["time", [], {"at": "2026-09-08", "to": "UTC"}], ["time.at", [0, 0], {"at": "2026-09-08", "to": "UTC"}], ["timezone", ["UTC"], {"at": "2026-09-08", "to": "UTC"}], ["timezone.at", [0, 0], {"at": "2026-09-08"}], ["date", ["03/04/2026"], {"format": "dmy", "to": "2026-09-08"}], ["date.today", [], {"to": "2026-09-08"}], ["emoji", ["fire"], {}], ["emoji.search", ["fire"], {"limit": 2}]] as const;
it.each(rows)('%s adds optional detail to the same operation', async (method, args, options) => {
 const urls: URL[] = [];
 const data = { deep: { zero: 0, missing: null, empty: [], future: true } };
 const parse = parseAPI('k', { fetch: async input => { urls.push(new URL(String(input))); return new Response(JSON.stringify(data)); } });
 const fn = method.split('.').reduce((value, key) => (value as Record<string, unknown>)[key], parse as unknown) as (...args: unknown[]) => Promise<unknown>;
 const input: unknown[] = [...args];
 if (method === 'time' && !input.length) input.push(undefined);
 await expect(fn(...input, options)).resolves.toEqual(data);
 await expect(fn(...input, { ...options, deep: true })).resolves.toEqual(data);
 expect(urls[1]!.pathname).toBe(urls[0]!.pathname);
 expect(Object.fromEntries(urls[1]!.searchParams)).toEqual({ ...Object.fromEntries(urls[0]!.searchParams), deep: 'true' });
});
it('keeps metered-core depth inside the same one-attempt policy', async () => {
 for (const method of ['carrier','hlr'] as const) {
  const fetch = vi.fn(async () => new Response('{}', { status: 503 }));
  await expect(parseAPI('k', { fetch })[method]('+14155552671', { deep: true })).rejects.toMatchObject({ status: 503 });
  expect(fetch).toHaveBeenCalledTimes(1);
 }
});
it('core types have the task answer while deep types remain optional and null-aware', () => {
 expectTypeOf<'city'>().not.toMatchTypeOf<keyof Carrier>();
 expectTypeOf<'roaming'>().not.toMatchTypeOf<keyof Hlr>();
 expectTypeOf<'known'>().not.toMatchTypeOf<keyof Name>();
 expectTypeOf<Time['at']>().toEqualTypeOf<string | null>();
 expectTypeOf<'next_dst'>().not.toMatchTypeOf<keyof NonNullable<TimezoneConversionTarget['deep']>>();
 expectTypeOf<'dewpoint'>().not.toMatchTypeOf<keyof Weather['current']>();
 expectTypeOf<NonNullable<Weather['deep']>['current']>().not.toEqualTypeOf<never>();
});
