import { expect, it, vi } from 'vitest';
import { parseAPI, type TimeOptions } from '../src/index.js';

it('rejects invalid target arrays before dispatch, preserving valid order and duplicates', async () => {
 const fetch = vi.fn(async (_input: string | URL | Request) => new Response('{"targets":null}'));
 const parse = parseAPI('fixture', { fetch, retries: 0 });
 for (const targets of [[], [''], ['  '], ['UTC,UTC'], Array(11).fill('UTC'), Array<string>(1), ['UTC', , 'Asia/Tokyo'], [null], 'UTC']) {
  for (const call of [() => parse.time('UTC', { targets } as TimeOptions), () => parse.time.at(0, 0, { targets } as TimeOptions)]) expect(call).toThrow(/1 to 10/);
 }
 expect(() => parse.time('UTC', { targets: ['UTC'], to: 'UTC' })).toThrow(/combined/);
 expect(fetch).not.toHaveBeenCalled();
 const targets = Object.freeze(['UTC', 'Asia/Tokyo', 'UTC']);
 expect(await parse.time('UTC', { targets })).toEqual({ targets: null });
 expect(new URL(String(fetch.mock.calls[0]?.[0])).searchParams.get('targets')).toBe('UTC,Asia/Tokyo,UTC');
});

it('preserves target observation states and zone discovery metadata', async () => {
 let result: unknown;
 const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify(result)), retries: 0 });
 for (const targets of [undefined, null, [], [{ timezone: 'UTC', unix: 0 }, { timezone: 'UTC', unix: 0 }]]) {
  result = targets === undefined ? {} : { targets };
  expect(await parse.time('UTC', { targets: ['UTC'] })).toEqual(result);
 }
 result = { timezone_database_version: '2026c', timezones: [] };
 expect(await parse.time.zones('not-a-zone')).toEqual(result);
});


it('rejects reserved source routes before dispatch', () => {
 const fetch = vi.fn(); const parse = parseAPI('fixture', { fetch });
 for (const zone of ['zones', 'help', ' ZONES ', 'Help']) expect(() => parse.time(zone)).toThrow(/IANA timezone ID/);
 expect(fetch).not.toHaveBeenCalled();
});

it('keeps rule provenance, exact resolution and null observations without inference', async () => {
 const payload = {"deep":{"timezone_database_version":"2026c","resolution":{"kind":"gap","policy":"earlier","adjustment_seconds":-1800,"alternatives":[{"at":"1970-01-01T00:00:00.123+00:00","unix":0,"offset":"+00:00"},{"at":"1970-01-01T00:30:00.123+00:00","unix":1800,"offset":"+00:00"}],"future":true}}};
 const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify(payload)) });
 const result = await parse.time('UTC', { to: 'UTC', deep: true });
 expect(result.deep?.timezone_database_version).toBe('2026c');
 expect(result.deep?.resolution?.adjustment_seconds).toBe(-1800);
 expect(result.deep?.resolution?.alternatives?.[0]?.unix).toBe(0);
 expect(result.deep?.resolution?.alternatives?.[0]?.at).toContain('.123');
 expect(result).toEqual(payload);
});

it.each(['zones', 'time', 'at'] as const)('preserves Time request cancellation and retry controls on %s', async operation => {
 let started!: () => void;
 const fetching = new Promise<void>(resolve => { started = resolve; });
 const fetch = vi.fn((_input: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
  init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true }); started();
 }));
 const parse = parseAPI('fixture', { fetch }); const controller = new AbortController(); const reason = new Error('Stopped Time');
 const controls = { signal: controller.signal, retries: 3, timeoutMs: 1000 };
 const pending = operation === 'zones' ? parse.time.zones('New York', controls) : operation === 'at' ? parse.time.at(0, 0, { ...controls, targets: ['UTC'] }) : parse.time('UTC', { ...controls, targets: ['UTC'] });
 await fetching; controller.abort(reason);
 await expect(pending).rejects.toBe(reason);
 expect(fetch).toHaveBeenCalledTimes(1);
 const query = new URL(String(fetch.mock.calls[0]?.[0])).searchParams;
 for (const key of ['signal', 'retries', 'timeoutMs']) expect(query.has(key)).toBe(false);
});
