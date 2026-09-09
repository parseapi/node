import { expect, expectTypeOf, it, vi } from 'vitest';
import { parseAPI, type Naics, type NaicsOptions } from '../src/index.js';

const record = { naics: '31-33', name: 'Manufacturing', description: null, level: 2, parent: null, parent_name: null, children: [{ naics: '311', name: 'Food Manufacturing' }], country: 'US', year: 2022, future: true };

it('looks up ranged sectors and preserves hierarchy, nulls and unknown fields', async () => {
 const urls: string[] = [];
 const parse = parseAPI('test_key', { fetch: async (input) => { urls.push(String(input)); return new Response(JSON.stringify(record)); } });
 await expect(parse.naics('31-33')).resolves.toEqual(record);
 await parse.naics('54/11');
 expect(urls).toEqual(['https://api.parseapi.com/naics/31-33', 'https://api.parseapi.com/naics/54%2F11']);
 expectTypeOf<Naics['parent']>().toEqualTypeOf<string | null>();
 expectTypeOf<Naics['description']>().toEqualTypeOf<string | null>();
 expectTypeOf<'deep'>().not.toMatchTypeOf<keyof NaicsOptions>();
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
