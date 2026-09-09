import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Country, type Postal } from '../src/index.js';

it('keeps newly documented tax properties optional for existing typed consumers', () => {
	type CountryTax = 'tax' | 'tax_rate' | 'tax_id_format' | 'tax_id_regex';
	type PostalTax = 'tax' | 'tax_rate' | 'tax_rate_state' | 'tax_rate_county' | 'tax_rate_city' | 'tax_rate_special';
	expectTypeOf<Omit<Country, CountryTax>>().toMatchTypeOf<Country>();
	expectTypeOf<Omit<Postal, PostalTax>>().toMatchTypeOf<Postal>();
	expectTypeOf<NonNullable<Country['deep']>['tax']>().toEqualTypeOf<string | null | undefined>();
	expectTypeOf<NonNullable<Country['deep']>['tax_rate']>().toEqualTypeOf<number | null | undefined>();
	expectTypeOf<NonNullable<Postal['deep']>['tax_rate_special']>().toEqualTypeOf<number | null | undefined>();
});

it('preserves reference percentages, known zero and unknown tax fields', async () => {
	const country = { country: 'DE', deep: { tax: 'VAT', tax_rate: 19, tax_id_format: 'DE999999999', tax_id_regex: '^DE[0-9]{9}$' } };
	const postal = { postal: '12345', country: 'US', deep: { tax: 'Sales tax', tax_rate: 7.9, tax_rate_state: 5, tax_rate_county: 0, tax_rate_city: null, tax_rate_special: 2.9 } };
	const bodies = [country, postal, { ...postal, deep: { tax: null, tax_rate: 0 } }, { postal: '12345', country: 'US' }];
	const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
	expect(await parse.country('DE')).toEqual(country);
	expect(await parse.postal('12345')).toEqual(postal);
	expect(await parse.postal('12345')).toMatchObject({ deep: { tax: null, tax_rate: 0 } });
	expect((await parse.postal('12345')).deep?.tax_rate).toBeUndefined();
});
