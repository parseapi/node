import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, type County, type CountyOptions, type District, type DistrictOptions, type StateCounties, type StateCountyItem, type StateDistricts } from '../src/index.js';

it('uses canonical and preserved legacy paths with 2.2 County results without duplicating fields', async () => {
  const calls: URL[] = [];
  const county = { county: 'E09000033', iso_code: 'GB-WSM', name: 'City of Westminster', type: 'district', population: 0, property_tax: null };
  const list = { state: 'ENG', country: 'GB', counties: [county] };
  const client = parseAPI('fixture', { fetch: async (input, init) => {
    const url = new URL(String(input)); calls.push(url);
    expect(new Headers(init?.headers).get('X-API-Version')).toBe('2.2.0');
    return Response.json(/\/(?:counties|districts)$/.test(url.pathname) ? list : county);
  } });
  for (const call of [client.county, client.district]) {
    const result = await call('Westminster', { country: 'GB', state: 'ENG' });
    expect(result).toEqual(county);
    expect(result).not.toHaveProperty('district');
  }
  for (const call of [client.state.counties, client.state.districts]) {
    expect(await call('ENG', { country: 'GB' })).toEqual(list);
  }
  expect(calls.map(url => url.pathname)).toEqual(['/county/Westminster', '/district/Westminster', '/state/ENG/counties', '/state/ENG/districts']);
  expectTypeOf<District>().toEqualTypeOf<County>();
  expectTypeOf<DistrictOptions>().toEqualTypeOf<CountyOptions>();
  expectTypeOf<StateDistricts>().toEqualTypeOf<StateCounties>();
  expectTypeOf<County['iso_code']>().toEqualTypeOf<string | null | undefined>();
  expectTypeOf<StateCountyItem['iso_code']>().toEqualTypeOf<string | null | undefined>();
});

it('preserves legacy routes and raw responses when an existing adapter explicitly pins 2.1', async () => {
  const calls: { path: string; version: string | null }[] = [];
  const district = { district: 'E09000033', name: 'Westminster', type: 'district' };
  const list = { state: 'ENG', country: 'GB', districts: [district] };
  const client = parseAPI('fixture', { fetch: async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    expect(headers.get('X-API-Version')).toBe('2.2.0');
    // Public MCP api21 uses its own fetch adapter to retain this exact pin.
    headers.set('X-API-Version', '2.1.0');
    calls.push({ path: url.pathname, version: headers.get('X-API-Version') });
    if (url.pathname === '/district/Westminster') return Response.json(district);
    if (url.pathname === '/state/ENG/districts') return Response.json(list);
    return Response.json({ code: 'not_found', message: 'Unknown route in 2.1' }, { status: 404 });
  } });
  expect(await client.district('Westminster', { country: 'GB' })).toEqual(district);
  expect(await client.state.districts('ENG', { country: 'GB' })).toEqual(list);
  expect(calls).toEqual([
    { path: '/district/Westminster', version: '2.1.0' },
    { path: '/state/ENG/districts', version: '2.1.0' },
  ]);
});

it('preserves the State iso_code value or null without inventing older response keys', async () => {
  for (const iso_code of ['US-CO', null]) {
    const body = { state: 'CO', iso_code, country: 'US' };
    const client = parseAPI('fixture', { fetch: async () => Response.json(body) });
    const result = await client.state('CO');
    expect(result).toEqual(body);
    expect(result).not.toHaveProperty('iso_subdivision');
    expect(result).not.toHaveProperty('iso');
  }
});

it('keeps linked County facts, native names, nulls, zeroes and genuine district types intact', async () => {
  const body = { postal: '100-0001', county: null, county_name: 'Chiyoda', county_name_local: '千代田', type: 'district', population: 0 };
  const client = parseAPI('fixture', { fetch: async () => Response.json(body) });
  expect(await client.postal('100-0001', { country: 'JP' })).toEqual(body);
  const older = { district: '08031', district_name: 'Denver', future: 0 };
  const historical = parseAPI('fixture', { fetch: async () => Response.json(older) });
  expect(await historical.point(0, 0)).toEqual(older);
});
