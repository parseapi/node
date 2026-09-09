import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type PostalDeep, type DistrictDeep, type PropertyTax, type AddressSearch, type Continent, type CountryDeep, type StateDeep, type CityDeep, type StateDistrictDeep } from '../src/index.js';

it('adds optional location context without requiring existing consumers to supply it', () => {
 expectTypeOf<Omit<PostalDeep, 'property_tax' | 'population_period'>>().toMatchTypeOf<PostalDeep>();
 expectTypeOf<Omit<DistrictDeep, 'property_tax' | 'population_period'>>().toMatchTypeOf<DistrictDeep>();
 expectTypeOf<Omit<AddressSearch, 'reason'>>().toMatchTypeOf<AddressSearch>();
 expectTypeOf<PostalDeep['property_tax']>().toEqualTypeOf<PropertyTax | null | undefined>();
 type Profiles = Continent | CountryDeep | StateDeep | CityDeep | DistrictDeep | PostalDeep | StateDistrictDeep;
 expectTypeOf<Profiles['population_period']>().toEqualTypeOf<string | null | undefined>();
});

it('preserves omitted, null and zero statistics and future address reasons', async () => {
 const bodies = [{ postal: '12345', country: 'US', deep: {} }, { postal: '12345', country: 'US', deep: { population: null, population_period: null, property_tax: null } }, { postal: '12345', country: 'US', deep: { population: 0, population_period: '2020', property_tax: { annual_median: 0, currency: 'USD', period: '2020-2024' } } }, { q: 'a', addresses: [], reason: 'future_reason' }];
 const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
 expect((await parse.postal('12345')).deep?.property_tax).toBeUndefined();
 expect((await parse.postal('12345')).deep?.property_tax).toBeNull();
 const place = await parse.postal('12345', { country: 'US', deep: true });
 expect(place.deep?.population).toBe(0);
 expect(place.deep?.population_period).toBe('2020');
 expect(place.deep?.property_tax).toEqual({ annual_median: 0, currency: 'USD', period: '2020-2024' });
 expect((await parse.address.search('a')).reason).toBe('future_reason');
});
