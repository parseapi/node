import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Naics, type NaicsDeep, type NaicsOptions } from '../src/index.js';

const record = { naics: '31-33', name: 'Manufacturing', description: null, level: 2, parent: null, parent_name: null, children: [{ naics: '311', name: 'Food Manufacturing' }], country: 'US', year: 2022, future: true };

it('looks up ranged sectors and preserves hierarchy, nulls and unknown fields', async () => {
 const urls: string[] = [];
 const parse = parseAPI('test_key', { fetch: async (input) => { urls.push(String(input)); return new Response(JSON.stringify(record)); } });
 await expect(parse.naics('31-33')).resolves.toEqual(record);
 await parse.naics('54/11');
 expect(urls).toEqual(['https://api.parseapi.com/naics/31-33', 'https://api.parseapi.com/naics/54%2F11']);
 expectTypeOf<Naics['parent']>().toEqualTypeOf<string | null>();
 expectTypeOf<NaicsDeep['description']>().toEqualTypeOf<string | null>();
 expectTypeOf<'deep'>().toMatchTypeOf<keyof NaicsOptions>();
});

it('searches with encoded keywords and optional limits, preserving empty results', async () => {
 const urls: string[] = [];
 const body = { q: 'coffee & tea', country: 'US', year: 2022, results: [] };
 const parse = parseAPI('test_key', { fetch: async (input) => { urls.push(String(input)); return new Response(JSON.stringify(body)); } });
 await expect(parse.naics.search('coffee & tea', { limit: 5 })).resolves.toEqual(body);
 await parse.naics.search('plumbing');
 expect(urls).toEqual(['https://api.parseapi.com/naics?q=coffee+%26+tea&limit=5', 'https://api.parseapi.com/naics?q=plumbing']);
});

it('keeps honest code misses on the API error path without retrying 404', async () => {
 const fetch = vi.fn(async () => new Response('{"code":"not_found","message":"Unknown code","request_id":"req_naics"}', { status: 404 }));
 const parse = parseAPI('test_key', { fetch });
 await expect(parse.naics('999999')).rejects.toMatchObject({ status: 404, code: 'not_found', requestId: 'req_naics' });
 expect(fetch).toHaveBeenCalledTimes(1);
});


it('preserves classification exclusions and search evidence without requiring new fields', async () => {
 const legacy: Naics = {"naics":"541511","name":"Custom Computer Programming Services","level":6,"parent":"54151","parent_name":"Computer Systems Design and Related Services","year":2022,"country":"US"};
 const records = [{"naics":"541511","name":"Custom Computer Programming Services","description":null,"level":6,"parent":"54151","parent_name":"Computer Systems Design and Related Services","children":[],"year":2022,"country":"US"},{"naics":"541511","name":"Custom Computer Programming Services","description":null,"level":6,"parent":"54151","parent_name":"Computer Systems Design and Related Services","children":[],"year":2022,"country":"US","exclusions":null,"match":null},{"naics":"541511","name":"Custom Computer Programming Services","description":null,"level":6,"parent":"54151","parent_name":"Computer Systems Design and Related Services","children":[],"year":2022,"country":"US","exclusions":[],"match":{"field":"future-field","text":"Future matching evidence","corrections":[],"future":true}},{"naics":"541511","name":"Custom Computer Programming Services","description":null,"level":6,"parent":"54151","parent_name":"Computer Systems Design and Related Services","children":[],"year":2022,"country":"US","exclusions":[{"description":"Designing integrated computer systems","codes":[{"naics":"541512","name":"Computer Systems Design Services"}]},{"description":"Activities classified elsewhere","codes":[]}],"match":{"field":"term","text":"Computer software programming services","corrections":[{"from":"sofware","to":"software"}]},"future":true}];
 for (const row of records) {
  const data = row as Record<string, unknown>;
  data.deep = { description: data.description, children: data.children, ...("exclusions" in data ? { exclusions: data.exclusions } : {}) };
  delete data.description; delete data.children; delete data.exclusions;
 }
 const parse = parseAPI('test_key', { fetch: async () => new Response(JSON.stringify({ q: 'sofware', year: 2022, country: 'US', results: records })) });
 const search = await parse.naics.search('sofware');
 expect(search.results).toEqual(records);
 expect(search.results[0]?.match).toBeUndefined();
 expect(search.results[1]?.deep?.exclusions).toBeNull();
 expect(search.results[2]?.match?.field).toBe('future-field');
 expect(search.results[2]?.match?.corrections).toEqual([]);
 expect(search.results[3]?.deep?.exclusions?.[1]).toEqual({ description: 'Activities classified elsewhere', codes: [] });
 expect(search.results[3]?.match?.corrections[0]).toEqual({ from: 'sofware', to: 'software' });
 expect(legacy.naics).toBe('541511');
});
