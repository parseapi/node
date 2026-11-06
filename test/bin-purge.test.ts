import { expect, test, vi } from 'vitest';
import { parseAPI } from '../src/index.js';

test('legacy bin method is absent while Card keeps its prefix argument and response field', async () => {
 const row = { bin: '424242', brand: 'visa', brand_name: 'Visa', logo: 'https://cdn.parseapi.com/card/visa.svg' };
 const fetch = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify(row)));
 const parse = parseAPI('fixture', { fetch });
 expect(Object.hasOwn(parse, 'bin')).toBe(false);
 expect(typeof parse.card).toBe('function');
 expect(await parse.card('424242')).toEqual(row);
 expect(String(fetch.mock.calls[0]?.[0])).toBe('https://api.parseapi.com/card/424242');
 expect(fetch).toHaveBeenCalledTimes(1);
});
