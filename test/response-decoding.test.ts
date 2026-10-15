import { readFileSync } from 'node:fs';
import { expect, expectTypeOf, it, vi } from 'vitest';
import { EmojiCatalog, parseAPI, type TimeZones, type TimeLocation, type TimeLocationCandidate, type Tariff, type TariffSearch, type EmojiMetadata, type CompanyCoverage, type CompanyProfileEmployees } from '../src/index.js';

it('describes removed metadata and compact candidates as optional', () => {
  expectTypeOf<TimeZones['timezone_database_version']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<TimeLocation['source']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Tariff['revision']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<TariffSearch['revision']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<EmojiMetadata['source_version']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<CompanyCoverage['snapshot_at']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<CompanyProfileEmployees['method']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<CompanyProfileEmployees['approximate']>().toEqualTypeOf<boolean>();
  expectTypeOf<TimeLocationCandidate['id']>().toEqualTypeOf<string | null | undefined>();
});

it('uses ordinary requests, preserves retries and cancellation', async () => {
  const calls: Headers[] = [];
  const parse = parseAPI('fixture', { retries: 1, fetch: async (_input, init) => {
    calls.push(new Headers(init?.headers));
    return calls.length === 1 ? new Response('{"code":"unavailable"}', { status: 503, headers: { 'Retry-After': '0' } }) : new Response('{"timezones":[]}');
  } });
  await parse.time.zones(); expect(calls).toHaveLength(2);
  for (const headers of calls) { expect(headers.get('Parse-Response')).toBeNull(); expect(headers.get('Parse-Version')).toBe('2.0.0'); }
  const fetch = vi.fn(); const signal = AbortSignal.abort(new Error('cancelled'));
  await expect(parseAPI('fixture', { fetch }).time.zones(undefined, { signal })).rejects.toThrow('cancelled');
  expect(fetch).not.toHaveBeenCalled();
});

it('returns the ordinary API object without adding metadata or changing nulls', async () => {
 const payload={timezone:'UTC',unix:0,dst:false,location:{status:'resolved',candidates:[{name:'Example',country:null}],truncated:false},future:{zero:0,unknown:null}};
 const parse=parseAPI('fixture',{retries:0,fetch:async()=>new Response(JSON.stringify(payload))});
 const result=await parse.time(undefined,{iata:'ZZZ'});
 expect(result).toEqual(payload);expect(JSON.stringify(result)).toBe(JSON.stringify(payload));
 expect(Object.hasOwn(result.location!,'source')).toBe(false);expect(Object.hasOwn(result.location!.candidates[0]!,'id')).toBe(false);
 expect(Object.getOwnPropertyNames(result.location!)).toEqual(Object.keys(payload.location));
});

it('reads an offline EmojiCatalog without a source version and preserves metadata verbatim', () => {
 const data=JSON.parse(readFileSync(new URL('./fixtures/emoji-catalog.json',import.meta.url),'utf8'));
 delete data.metadata.source_version;const before=structuredClone(data.metadata);
 const catalog=new EmojiCatalog(data);
 expect(catalog.metadata()).toEqual(before);expect(Object.hasOwn(catalog.metadata(),'source_version')).toBe(false);
 expect(catalog.lookup(data.emojis[0].emoji).emoji).toBe(data.emojis[0].emoji);
 expect(catalog.browse({maxVersion:data.metadata.max_version,limit:1}).emojis).toHaveLength(1);
 expect(()=>catalog.browse({maxVersion:'99.0'})).toThrow(/no newer/);
 const historical=structuredClone(data);historical.metadata.source_version='18.0';historical.metadata.max_version='1.0';
 expect(()=>new EmojiCatalog(historical).browse({maxVersion:'18.0'})).not.toThrow();
});

it('decodes the actual API handler standard and clean representations with the old getter types', async () => {
  for (const profile of ['standard', 'clean'] as const) {
    const fixtures = ['timezones', 'time', 'tariff', 'tariff-search', 'emoji-metadata', 'emoji-catalog', 'company-coverage', 'company-profile'];
    const calls: Headers[] = []; const original: unknown[] = [];
    const parse = parseAPI('fixture', { retries: 0, fetch: async (_input, init) => {
      calls.push(new Headers(init?.headers)); const name = fixtures.shift()!;
      const body = readFileSync(new URL(`./fixtures/response-fixtures/${profile}-${name}.json`, import.meta.url), 'utf8');
      original.push(JSON.parse(body));
      return new Response(body);
    } });
    const zones = await parse.time.zones(); const time = await parse.time(undefined, { iata: 'JFK' });
    const tariff = await parse.tariff('8471'); const search = await parse.tariff.search('computer');
    const metadata = await parse.emoji.metadata(); const downloaded = await parse.emoji.catalog();
    const coverage = await parse.company.coverage(); const company = await parse.company.id('co_fixture', { deep: true });
    const oldMetadata = [zones.timezone_database_version, time.location!.source, tariff.revision, search.revision, metadata.source_version, coverage.snapshot_at, company.deep!.employees!.method];
    if(profile === 'clean') expect(oldMetadata).toEqual(Array(7).fill(undefined));
    expect(company.deep!.employees!.approximate).toBe(false);
    expect(company.deep!.employees!.count).toBe(12);
    expect(new EmojiCatalog(downloaded).browse({ maxVersion: metadata.max_version!, limit: 1 }).emojis).toHaveLength(1);
    for (const headers of calls) expect(headers.get('Parse-Response')).toBeNull();
    const actual = [zones,time,tariff,search,metadata,downloaded,coverage,company];
    expect(actual.map(value => JSON.parse(JSON.stringify(value)))).toEqual(original);
  }
});
