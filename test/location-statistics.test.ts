import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type PostalDeep, type DistrictDeep, type PropertyTax, type PostalPropertyTax, type AddressSearch, type Continent, type CountryDeep, type StateDeep, type CityDeep, type StateDistrictDeep } from '../src/index.js';

it('adds optional location context without requiring existing consumers to supply it', () => {
 expectTypeOf<Omit<PostalDeep, 'property_tax' | 'population_period'>>().toMatchTypeOf<PostalDeep>();
 expectTypeOf<Omit<DistrictDeep, 'property_tax' | 'population_period'>>().toMatchTypeOf<DistrictDeep>();
 expectTypeOf<Omit<AddressSearch, 'reason'>>().toMatchTypeOf<AddressSearch>();
 expectTypeOf<PostalDeep['property_tax']>().toEqualTypeOf<PostalPropertyTax | null | undefined>();
 expectTypeOf<DistrictDeep['property_tax']>().toEqualTypeOf<PropertyTax | null | undefined>();
 type Profiles = Continent | CountryDeep | StateDeep | CityDeep | DistrictDeep | PostalDeep | StateDistrictDeep;
 expectTypeOf<Profiles['population_period']>().toEqualTypeOf<string | null | undefined>();
});

it('preserves omitted, null and zero statistics and future address reasons', async () => {
 const bodies = [{ postal: '12345', country: 'US',  }, { postal: '12345', country: 'US', population: null, population_period: null, property_tax: null }, { postal: '12345', country: 'US', population: 0, population_period: '2020', currency: 'USD', property_tax: { annual_median: 0 } }, { q: 'a', addresses: [], reason: 'future_reason' }];
 const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
 expect((await parse.postal('12345'))?.property_tax).toBeUndefined();
 expect((await parse.postal('12345'))?.property_tax).toBeNull();
 const place = await parse.postal('12345', { country: 'US', deep: true });
 expect(place?.population).toBe(0);
 expect(place?.population_period).toBe('2020');
 expect(place?.property_tax).toEqual({ annual_median: 0 });
 expect((await parse.address.search('a')).reason).toBe('future_reason');
});
