import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type Country, type State, type City, type CityNearest, type Language, type Holiday, type PointCity } from '../src/index.js';

it('uses a nullable name_local member on every named response', () => {
 type Named = Country | State | City | CityNearest | Language | Holiday | PointCity;
 expectTypeOf<Named['name_local']>().toEqualTypeOf<string | null>();
 expectTypeOf<'local_name'>().not.toMatchTypeOf<keyof Named>();
});

it.each(['München', null])('preserves the native-name wire value %s in direct and nested responses', async (name_local) => {
 const record = { name: 'Munich', name_local };
 let body: unknown = record;
 const parse = parseAPI('test', { fetch: async () => new Response(JSON.stringify(body)) });
 for (const invoke of [() => parse.country('DE'), () => parse.state('BY'), () => parse.city('Munich'), () => parse.city.id('city_test'), () => parse.city.nearest(48, 11), () => parse.language('de')]) {
  expect((await invoke()).name_local).toBe(name_local);
 }
 body = { cities: [record] };
 expect((await parse.city.search('Munich')).cities[0]!.name_local).toBe(name_local);
 body = { nearby: [record] };
 expect((await parse.city.nearby('Munich')).nearby[0]!.name_local).toBe(name_local);
 body = { holidays: [record] };
 expect((await parse.holiday('DE')).holidays[0]!.name_local).toBe(name_local);
 body = { holiday: record };
 expect((await parse.holiday.date('DE', '2026-12-25')).holiday?.name_local).toBe(name_local);
 body = { deep: { city: record } };
 expect((await parse.point(48, 11, { deep: true })).deep?.city?.name_local).toBe(name_local);
});
