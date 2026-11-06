import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseAPI } from '../src/index.js';

it('keeps matched City facts and cursor when source and score are absent', async () => {
 const rows = JSON.parse(readFileSync(new URL('./fixtures/noise-approved.json', import.meta.url), 'utf8')).filter((row: { id: string }) => row.id.startsWith('city-'));
 let calls = 0;
 const client = parseAPI('fixture', { retries: 0, fetch: async (_url, init) => {
  expect(new Headers(init?.headers).get('X-API-Version')).toBe('2.1.0');
  return Response.json(rows[calls++].body);
 } });
 for (const row of rows) {
  const result = await client.city.search(row.body.q, { match: row.body.match });
  expect(result.cities).toEqual(row.body.data);
  expect(result.next_cursor).toBe(row.body.next_cursor);
 }
 expect(calls).toBe(rows.length);
});
