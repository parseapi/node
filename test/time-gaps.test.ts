import { expect, it, vi } from 'vitest';
import { parseAPI, type TimeOptions } from '../src/index.js';
const rich = {"timezone_database_version": "2026c", "timezones": ["UTC"], "at": "1970-01-01T00:00:00.000Z", "zones": [{"timezone": "UTC", "countries": [], "area": null, "abbreviation": "UTC", "offset": "+00:00", "offset_seconds": 0, "dst": false, "observes_dst": false}]};
const located = {"timezone": null, "targets": null, "location": {"input": {"type": "city", "value": "Springfield"}, "status": "ambiguous", "candidates": [{"id": "city_a", "name": "Springfield", "country": "US", "state": "IL", "timezone": "America/Chicago", "latitude": 0, "longitude": 0}], "truncated": false, "source": "city_reference"}, "deep": {"standard_offset": "+01:00", "standard_offset_seconds": 3600, "dst_offset_seconds": -3600, "season": {"start": {"at": "2026-10-25T01:00:00Z", "before": {"offset_seconds": 3600, "dst": false}, "after": {"offset_seconds": 0, "dst": true}, "change_seconds": -3600}, "end": null}}};
it('serializes rich catalog filters including false and preserves exact result rows', async () => {
 const fetch = vi.fn(async (_url: string | URL | Request) => new Response(JSON.stringify(rich)));
 const parse = parseAPI('fixture', { fetch });
 const result = await parse.time.zones(undefined, { country: 'US', area: 'America', offset: '+00:00', abbreviation: 'UTC', dst: false, observes_dst: false, at: '1970-01-01T00:00:00Z', details: true, sort: 'offset' });
 expect(result).toEqual(rich);
 expect(Object.fromEntries(new URL(String(fetch.mock.calls[0]?.[0])).searchParams)).toEqual({"country": "US", "area": "America", "offset": "+00:00", "abbreviation": "UTC", "dst": "false", "observes_dst": "false", "at": "1970-01-01T00:00:00Z", "details": "true", "sort": "offset"});
});
it('passes explicit locations once and preserves ambiguous, null and negative-seasonal evidence', async () => {
 const fetch = vi.fn(async (_url: string | URL | Request) => new Response(JSON.stringify(located)));
 const parse = parseAPI('fixture', { fetch });
 for (const source of [{ip:'2001:db8::1'}, {city:'Springfield',country:'US',state:'IL'}, {country:'US'}, {iata:'JFK'}, {icao:'KJFK'}, {unlocode:'US NYC'}, {address:'1 Main Street',country:'US',state:'NY'}]) {
  const result = await parse.time(undefined, { ...source, targets:['UTC'], deep:true });
  const url = new URL(String(fetch.mock.calls.at(-1)?.[0])); expect(url.pathname).toBe('/time');
  for (const [key,value] of Object.entries(source)) expect(url.searchParams.get(key)).toBe(value);
  expect(result).toEqual(located); expect(result.deep?.dst_offset_seconds).toBe(-3600);
 }
 const count=fetch.mock.calls.length;
 for (const opts of [{ip:'8.8.8.8',city:'Paris'}, {ip:'8.8.8.8',country:'US'}, {state:'NY'}, {city:'Paris',state:'IDF'}, {address:'a'}, {ip:''}]) expect(()=>parse.time(undefined,opts as TimeOptions)).toThrow(/one Time source/);
 expect(()=>parse.time('UTC',{city:'Paris'})).toThrow(/one Time source/);
 expect(fetch).toHaveBeenCalledTimes(count);
});
