import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseAPI } from '../src/index.js';

it('reads all approved compact Time bodies without adding resolver fields or requests', async () => {
 const rows = JSON.parse(readFileSync(new URL('./fixtures/time-compact.json', import.meta.url), 'utf8'));
 let calls = 0;
 const client = parseAPI('fixture', { retries: 0, fetch: async (_url, init) => {
  expect(new Headers(init?.headers).get('X-API-Version')).toBe('2.1.0');
  return new Response(JSON.stringify(rows[calls++].body));
 } });
 for (const row of rows) {
  const result = await client.time();
  expect(result).toEqual(row.body);
  expect(JSON.stringify(result)).toBe(JSON.stringify(row.body));
 }
 expect(calls).toBe(rows.length);
});
