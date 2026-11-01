import { expect, it } from 'vitest';
import { parseAPI, type PointDeep } from '../src/index.js';

it('exposes Point terrain and electoral values, retaining zeros, nulls and leading zeros', async () => {
  const older: PointDeep = { city: null, elevation: null, elevation_ft: null, resolution: null };
  expect(older.electoral).toBeUndefined();
  const bodies = [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0, deep: {} },
    { latitude: 0, longitude: 0, deep: { elevation: null, electoral: null } },
    { latitude: 0, longitude: 0, deep: { elevation: 0, elevation_ft: 0, electoral: { code: '0801', name: null, congress: 119, future: true } } },
    { latitude: 0, longitude: 0, deep: { elevation: -1.5, electoral: { code: '0200', name: 'At-large', congress: null } } }];
  const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
  expect((await parse.point(0, 0)).deep).toBeUndefined();
  expect((await parse.point(0, 0, { deep: true })).deep).toEqual({});
  expect((await parse.point(0, 0, { deep: true })).deep?.electoral).toBeNull();
  const zero = await parse.point(0, 0, { deep: true });
  expect(zero.deep?.elevation).toBe(0);
  expect(zero.deep?.electoral?.code).toBe('0801');
  expect(zero.deep?.electoral?.name).toBeNull();
  expect(zero.deep?.electoral?.congress).toBe(119);
  const belowSea = await parse.point(0, 0, { deep: true });
  expect(belowSea.deep?.elevation).toBe(-1.5);
  expect(belowSea.deep?.electoral?.congress).toBeNull();
});
