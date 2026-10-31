import { readFileSync } from 'node:fs';
import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Country, type State, type Language } from '../src/index.js';
const cases = JSON.parse(readFileSync(new URL('./fixtures/iso-contract.json', import.meta.url), 'utf8'));

it('types the explicit ISO representations while retaining old-server declarations', () => {
 expectTypeOf<Country['iso_alpha3']>().toEqualTypeOf<string | null | undefined>();
 expectTypeOf<Country['iso_numeric']>().toEqualTypeOf<number | null | undefined>();
 expectTypeOf<State['iso_subdivision']>().toEqualTypeOf<string | null | undefined>();
 expectTypeOf<Language['iso_alpha3']>().toEqualTypeOf<string | null | undefined>();
 expectTypeOf<Country['iso3']>().toEqualTypeOf<string | null | undefined>();
 expectTypeOf<Country['numeric']>().toEqualTypeOf<number | null | undefined>();
});

it('preserves both server contracts, zero, null and equal-role strings through existing methods', async () => {
 for (const sample of cases) {
  const calls: URL[] = [];
  const client = parseAPI('fixture', { fetch: async input => {
   calls.push(new URL(String(input))); return Response.json(sample.body);
  } });
  const options = { deep: sample.deep, ...(sample.country ? { country: sample.country } : {}) };
  const result = await client[sample.operation as 'country'](sample.code, options);
  expect(result).toEqual(sample.body);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.pathname).toBe(`/${sample.operation}/${sample.code}`);
  expect(calls[0]?.searchParams.get('deep')).toBe(sample.deep ? 'true' : null);
 }
});

it('makes the raw-key migration visible to callers instead of fabricating legacy aliases', async () => {
 const client = parseAPI('fixture', { fetch: async () => Response.json({ country: 'US', iso_alpha3: 'USA', iso_numeric: 840 }) });
 const result = await client.country('US');
 expect(result.iso_alpha3).toBe('USA'); expect(result.iso_numeric).toBe(840);
 expect(result.iso3).toBeUndefined(); expect(result.numeric).toBeUndefined();
});
