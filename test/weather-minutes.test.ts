import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type WeatherMinute } from '../src/index.js';

it('preserves minute precipitation rates without renaming historical amounts', async () => {
  expectTypeOf<WeatherMinute['precipitation_rate']>().toEqualTypeOf<number | null>();
  expectTypeOf<WeatherMinute['precipitation_rate_in']>().toEqualTypeOf<number | null>();
  const deep = {
    minutes: [
      { at: '2026-10-27T12:00:00Z', precipitation_rate: 1.8, precipitation_rate_in: 0.071, type: 'rain' },
      { at: '2026-10-27T12:01:00Z', precipitation_rate: 0, precipitation_rate_in: 0, type: null },
      { at: '2026-10-27T12:02:00Z', precipitation_rate: null, precipitation_rate_in: null, type: null },
    ],
    history: { date: '2026-10-26', precipitation: 12.3, precipitation_in: 0.484 },
  };
  const parse = parseAPI('fixture', { fetch: async () => new Response(JSON.stringify({ latitude: 0, longitude: 0, ...deep })) });
  const result = await parse.weather(0, 0, { deep: true, date: '2026-10-26' });
  expect(result).toMatchObject(deep);
  expect(result?.minutes?.[0]?.precipitation_rate).toBe(1.8);
  expect(result?.history?.precipitation).toBe(12.3);
});
