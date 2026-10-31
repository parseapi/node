import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type CountryCapital, type StateCapital } from '../src/index.js';

it('exposes one public spelling on both capital models', () => {
 expectTypeOf<keyof CountryCapital>().toEqualTypeOf<'name' | 'latitude' | 'longitude'>();
 expectTypeOf<keyof StateCapital>().toEqualTypeOf<'name' | 'latitude' | 'longitude'>();
});

it('reads Country and State coordinates in Core and Deep without changing zero or null', async () => {
 for (const deep of [false, true]) {
  const capital = { name: 'Example', latitude: 0, longitude: null };
  const parse = parseAPI('fixture', { fetch: async () => Response.json({ capital, ...(deep ? { deep: {} } : {}) }) });
  const country = await parse.country('DE', { deep });
  const state = await parse.state('BY', { country: 'DE', deep });
  expect(country.capital).toEqual(capital);
  expect(state.capital).toEqual(capital);
  expect(country.capital?.latitude).toBe(0);
  expect(state.capital?.longitude).toBeNull();
 }
});
