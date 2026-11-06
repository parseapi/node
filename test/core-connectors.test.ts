import { readFileSync } from 'node:fs';
import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Country, type Language, type Currency, type Postal, type PostalDeep, type Point, type Industry, type Emoji, type CompanyProfile } from '../src/index.js';
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/core-connectors.json', import.meta.url), 'utf8'));
it('exposes optional Core reference types and preserves richer Deep models', () => {
 expectTypeOf<Country['iso3']>().toEqualTypeOf<string | null | undefined>();
 expectTypeOf<Country['borders']>().toEqualTypeOf<string[] | null | undefined>();
 expectTypeOf<Language['countries']>().toEqualTypeOf<string[] | null | undefined>();
 expectTypeOf<Currency['countries']>().toEqualTypeOf<string[] | null>();
 expectTypeOf<PostalDeep['currency']>().toEqualTypeOf<string | null>();
 const industry: Industry = fixtures.industry;
 expect(industry).toHaveProperty('children'); expect(industry).not.toHaveProperty('exclusion_codes');
 expect(industry?.children?.[0]?.naics).toBe('111');
 const emoji: Emoji = fixtures.emoji; expect(emoji?.base).toBe('👍'); expect(emoji).not.toHaveProperty('deep');
 const company: CompanyProfile = fixtures.company;
 expect(company?.identifiers?.[0]?.value).toBe('0000320193');
 expect(company?.phone_numbers?.[0]?.country).toBe('US'); expect(company?.phone_numbers?.[0]?.e164).toBe('+14089961010');
 expectTypeOf<NonNullable<CompanyProfile['phone_numbers']>[number]['e164']>().toEqualTypeOf<string | null | undefined>();
 expect(company?.industries?.[0]?.code).toBe('3571');
 expect(company?.industries?.[0]?.name).toBe('Electronic Computers');
});
it('ordinary transport retains Core refs without enabling Deep or additional calls', async () => {
 const calls: URL[] = [];
 const client = parseAPI('fixture', { fetch: async input => { calls.push(new URL(String(input))); return new Response(JSON.stringify(fixtures.country)); } });
 const country = await client.country('US');
 expect(country.iso_alpha3).toBe('USA'); expect(country.capital?.latitude).toBe(0); expect(country.borders).toEqual(['CA', 'MX']);
 expect(calls).toHaveLength(1); expect(calls[0]?.searchParams.has('deep')).toBe(false);
 const older: Partial<Country> = { country:'US', name:'United States', name_local:null, continent:'NA', currency:'USD',currency_name:null,currency_symbol:null,calling_code:null,emoji:null,languages:[],timezones:null };
 expect(older.iso3).toBeUndefined();
});

it('keeps Point city identity and qualified Postal neighbors in Deep', () => {
 expectTypeOf<NonNullable<Point['city']>['id']>().toEqualTypeOf<string>();
 expectTypeOf<PostalDeep['neighbors']>().toEqualTypeOf<string[]>();
 const point: Point = fixtures.point, postal: Postal = fixtures.postal;
 expect(point).not.toHaveProperty('city_id'); expect(point?.city?.id).toBe('city_7aj899nvwyku');
 expect(postal.country).toBe('US'); expect(postal?.neighbors).toEqual(['00544']); expect(postal).not.toHaveProperty('deep');
 const older: Point = {latitude:0,longitude:0,country:null,country_name:null,state:null,state_name:null,district:null,district_name:null,timezone:null};
 expect(older.city).toBeUndefined();
 const detail: Partial<PostalDeep> = { neighbors: [] }; expect(detail.neighbors).toEqual([]); expect(detail.currency).toBeUndefined();
});

it('decodes the approved Industry search without duplicating its Deep facts or adding calls', async () => {
 const calls: URL[] = [];
 const client = parseAPI('fixture', { fetch: async input => { calls.push(new URL(String(input))); return Response.json(fixtures.industry_search); } });
 const result = await client.industry.search('coffee shop', { deep: true, limit: 2 });
 expect(calls).toHaveLength(1); expect(calls[0]?.pathname).toBe('/industry'); expect(calls[0]?.searchParams.get('deep')).toBe('true');
 expect(result).toMatchObject({country:'US',year:2022,q:'coffee shop'});
 expect(result.results[0]).toHaveProperty('children'); expect(result.results[0]).not.toHaveProperty('exclusion_codes');
 expect(result.results[0]?.match?.text).toBe('Coffee shops, on premise brewing');
 expect(result.results[0]?.children).toEqual([]); expect(result.results[0]?.exclusions).toHaveLength(3);
});
