import { readFileSync } from 'node:fs';
import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Postal, type PostalMetro } from '../src/index.js';
const cases = JSON.parse(readFileSync(new URL('./fixtures/postal-additive.json', import.meta.url), 'utf8')) as Record<string, unknown>;

it('reads already-served Postal fields without changing legacy values or adding requests', async () => {
 for (const [name, fixture] of Object.entries(cases)) {
  let calls = 0;
  const client = parseAPI('fixture', { retries: 0, fetch: async input => {
   calls++; const url = new URL(String(input));
   expect(url.pathname).toBe('/postal/10001');
   expect(url.searchParams.get('country')).toBe('US'); expect(url.searchParams.get('deep')).toBe('true');
   return new Response(JSON.stringify(fixture));
  } });
  const result = await client.postal('10001', { country: 'US', deep: true });
  expect(result, name).toEqual(fixture); expect(calls, name).toBe(1);
  expect(result.deep?.metros?.[0]?.share, name).toBe(0.125);
 }
 expectTypeOf<Postal['type']>().toEqualTypeOf<string | null | undefined>();
 expectTypeOf<PostalMetro['share_percent']>().toEqualTypeOf<number | null | undefined>();
 expectTypeOf<PostalMetro['share']>().toEqualTypeOf<number | null>();
});
