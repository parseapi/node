import { expect, it } from 'vitest';
import { parseAPI, type PointDeep } from '../src/index.js';

it('exposes Point terrain and electoral values, retaining zeros, nulls and leading zeros', async () => {
  const older: PointDeep = { city: null, elevation: null, elevation_ft: null, resolution: null };
  expect(older.electoral).toBeUndefined();
  const bodies = [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0, elevation: null, electoral: null },
    { latitude: 0, longitude: 0, elevation: 0, elevation_ft: 0, electoral: { code: '0801', name: null, congress: 119, future: true } },
    { latitude: 0, longitude: 0, elevation: -1.5, electoral: { code: '0200', name: 'At-large', congress: null } }];
  const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify(bodies.shift())) });
  expect(Object.hasOwn((await parse.point(0, 0)), 'deep')).toBe(false);
  expect(Object.hasOwn((await parse.point(0, 0, { deep: true })), 'deep')).toBe(false);
  expect((await parse.point(0, 0, { deep: true }))?.electoral).toBeNull();
  const zero = await parse.point(0, 0, { deep: true });
  expect(zero?.elevation).toBe(0);
  expect(zero?.electoral?.code).toBe('0801');
  expect(zero?.electoral?.name).toBeNull();
  expect(zero?.electoral?.congress).toBe(119);
  const belowSea = await parse.point(0, 0, { deep: true });
  expect(belowSea?.elevation).toBe(-1.5);
  expect(belowSea?.electoral?.congress).toBeNull();
});
