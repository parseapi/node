import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Country, type CountryTax as CountryTaxReference, type Postal } from '../src/index.js';

it('keeps newly documented tax properties optional for existing typed consumers', () => {
	type CountryTax = 'tax' | 'tax_rate' | 'tax_id_format' | 'tax_id_regex';
	type PostalTax = 'tax';
	expectTypeOf<Omit<Country, CountryTax>>().toMatchTypeOf<Country>();
	expectTypeOf<Omit<Postal, PostalTax>>().toMatchTypeOf<Postal>();
	expectTypeOf<Country['tax']>().toEqualTypeOf<CountryTaxReference | null | undefined>();
	expectTypeOf<Country['tax_rate']>().toEqualTypeOf<number | null | undefined>();
	expectTypeOf<NonNullable<Postal['tax']>['rate_special']>().toEqualTypeOf<number | null>();
});

it('preserves reference percentages, known zero and unknown tax fields', async () => {
	const country = { country: 'DE', tax: { name: 'VAT', rate: 19 } };
	const postal = { postal: '12345', country: 'US', tax: { name: 'Sales tax', rate: 7.9, rate_state: 5, rate_county: 0, rate_city: null, rate_special: 2.9 } };
	const bodies = [country, postal, { ...postal, tax: { ...postal.tax, name: null, rate: 0 } }, { postal: '12345', country: 'US' }];
	const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
	expect(await parse.country('DE')).toEqual(country);
	expect(await parse.postal('12345')).toEqual(postal);
	expect(await parse.postal('12345')).toMatchObject({ tax: { name: null, rate: 0 } });
	expect((await parse.postal('12345')).tax?.rate).toBeUndefined();
});
