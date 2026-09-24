import { expect, expectTypeOf, it } from 'vitest';
import { parseAPI, ParseAPIError, type Elevation, type ElevationLocations, type ElevationOptions } from '../src/index.js';

const samples: ElevationLocations = { points: [
	{ latitude: 0, longitude: 0, elevation: 0, elevation_ft: 0, resolution: 460 },
	{ latitude: 1, longitude: 2, elevation: -427, elevation_ft: -1401, resolution: 30 },
	{ latitude: 0, longitude: 0, elevation: null, elevation_ft: null, resolution: null },
] };
function setup(result: unknown = samples) {
	const calls: { url: URL; init?: RequestInit }[] = [];
	const parse = parseAPI('fixture', { fetch: async (input, init) => {
		calls.push({ url: new URL(String(input)), init });
		return new Response(JSON.stringify(result));
	} });
	return { parse, calls };
}

it('preserves the single-point callable and typed ordered batch results', async () => {
	const { parse, calls } = setup();
	const single: (lat: number, lon: number, opts?: ElevationOptions) => Promise<Elevation> = parse.elevation;
	expectTypeOf(parse.elevation.points).returns.toEqualTypeOf<Promise<ElevationLocations>>();
	await single(0, 0);
	expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({ lat: '0', lon: '0' });
	const points = parse.elevation.points;
	expect(await points([[0, 0], [1, 2], [0, 0]])).toEqual(samples);
	expect(calls[1]!.url.searchParams.get('points')).toBe('0,0|1,2|0,0');
	expect(calls[1]!.init?.method).toBeUndefined();
	expect(calls[1]!.init?.body).toBeUndefined();
});

it.each(['0,0|1,2|0,0', 'enc:_p~iF~ps|U_ulLnnqC_mqNvxq`@'])('encodes a short points string exactly once: %s', async points => {
	const { parse, calls } = setup();
	await parse.elevation.points(points);
	expect(calls).toHaveLength(1);
	expect(calls[0]!.url.searchParams.get('points')).toBe(points);
	expect(calls[0]!.init?.method).toBeUndefined();
});

it.each([
	{ path: [[0, 0], [0, 2]] as Array<[number, number]>, encoded: '0,0|0,2' },
	{ path: '0,0|0,2', encoded: '0,0|0,2' },
	{ path: 'enc:_p~iF~ps|U_ulLnnqC_mqNvxq`@', encoded: 'enc:_p~iF~ps|U_ulLnnqC_mqNvxq`@' },
])('forwards path vertices and the required sample count without client-side interpolation: $encoded', async ({ path, encoded }) => {
	const { parse, calls } = setup();
	expectTypeOf(parse.elevation.path).parameters.toEqualTypeOf<[path: Array<[number, number]> | string, samples: number, opts?: ElevationOptions]>();
	expectTypeOf(parse.elevation.path).returns.toEqualTypeOf<Promise<ElevationLocations>>();
	const samplePath = parse.elevation.path;
	expect(await samplePath(path, 3)).toEqual(samples);
	expect(calls).toHaveLength(1);
	expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({ path: encoded, samples: '3' });
	expect(calls[0]!.init?.method).toBeUndefined();
	expect(calls[0]!.init?.body).toBeUndefined();
});

it.each(['tuples', 'string'])('posts long path %s with the original vertices and sample count', async format => {
	const vertices: Array<[number, number]> = Array.from({ length: 400 }, (_, index) => [1.12345, 2.12345 + index / 1000]);
	const path = format === 'tuples' ? vertices : vertices.map(pair => pair.join(',')).join('|');
	const { parse, calls } = setup();
	expect(await parse.elevation.path(path, 512, { retries: 0, timeoutMs: 1000 })).toEqual(samples);
	expect(calls).toHaveLength(1);
	const { url, init } = calls[0]!;
	expect(url.href).toBe('https://api.parseapi.com/elevation');
	expect(init?.method).toBe('POST');
	expect(JSON.parse(String(init?.body))).toEqual({ path, samples: 512 });
	expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
	expect(new Headers(init?.headers).get('Parse-Version')).toBe('2.0.0');
	expect(new Headers(init?.headers).get('X-API-Key')).toBe('fixture');
});

it.each(['points', 'path'] as const)('preserves tiny signed numeric coordinates and zero using JSON for %s', async selector => {
	const coordinates: Array<[number, number]> = [[-1e-7, 0], [0, -1e-7], [1e-7, 0], [0, 1e-7]];
	const { parse, calls } = setup();
	if (selector === 'points') await parse.elevation.points(coordinates);
	else await parse.elevation.path(coordinates, 3);
	expect(calls).toHaveLength(1);
	const { url, init } = calls[0]!;
	expect(url.search).toBe('');
	expect(init?.method).toBe('POST');
	expect(JSON.parse(String(init?.body))).toEqual(selector === 'points'
		? { points: coordinates } : { path: coordinates, samples: 3 });
});

it('keeps explicit string coordinates unchanged rather than repairing their numeric syntax', async () => {
	const { parse, calls } = setup();
	await parse.elevation.points('0,0|0,1e-7');
	await parse.elevation.path('0,0|0,1e-7', 3);
	expect(Object.fromEntries(calls[0]!.url.searchParams)).toEqual({ points: '0,0|0,1e-7' });
	expect(Object.fromEntries(calls[1]!.url.searchParams)).toEqual({ path: '0,0|0,1e-7', samples: '3' });
	expect(calls.every(call => call.init?.method === undefined)).toBe(true);
});

it('preserves the API error for an ambiguous antipodal path without retry', async () => {
	const calls: URL[] = [];
	const parse = parseAPI('fixture', { fetch: async input => {
		calls.push(new URL(String(input)));
		return new Response(JSON.stringify({ code: 'invalid_request', message: 'Antipodal path segment', request_id: 'req_path' }), { status: 400 });
	} });
	await expect(parse.elevation.path([[0, 0], [0, 180]], 5)).rejects.toMatchObject({
		name: 'ParseAPIError', status: 400, code: 'invalid_request', requestId: 'req_path',
	} satisfies Partial<ParseAPIError>);
	expect(calls).toHaveLength(1);
});

it.each(['tuples', 'string'])('uses POST when the encoded URL grows too long for %s', async format => {
	const tuples: Array<[number, number]> = Array.from({ length: 400 }, () => [1.12345, 2.12345]);
	const value = tuples.map(pair => pair.join(',')).join('|');
	const getUrl = new URL('https://api.parseapi.com/elevation');
	getUrl.searchParams.set('points', value);
	expect(value.length).toBeLessThan(8000);
	expect(getUrl.href.length).toBeGreaterThan(8000);
	const points = format === 'tuples' ? tuples : value;
	const { parse, calls } = setup();
	expect(await parse.elevation.points(points, { retries: 0, timeoutMs: 1000 })).toEqual(samples);
	expect(calls).toHaveLength(1);
	const { url, init } = calls[0]!;
	expect(url.href).toBe('https://api.parseapi.com/elevation');
	expect(init?.method).toBe('POST');
	expect(JSON.parse(String(init?.body))).toEqual({ points });
	expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
	expect(new Headers(init?.headers).get('Parse-Version')).toBe('2.0.0');
	expect(new Headers(init?.headers).get('X-API-Key')).toBe('fixture');
	expect(init?.redirect).toBe('manual');
});

it.each(['points', 'path'] as const)('keeps the original %s POST body through retry and honors caller cancellation', async selector => {
	const points = Array.from({ length: 512 }, () => '38.5,-120.2').join('|');
	const calls: RequestInit[] = [];
	const parse = parseAPI('fixture', { fetch: async (_input, init) => {
		calls.push(init!);
		return calls.length === 1
			? new Response('{}', { status: 503, headers: { 'Retry-After': '0' } })
			: new Response(JSON.stringify(samples));
	} });
	const request = (opts: ElevationOptions) => selector === 'points'
		? parse.elevation.points(points, opts) : parse.elevation.path(points, 3, opts);
	expect(await request({ retries: 1 })).toEqual(samples);
	expect(calls).toHaveLength(2);
	for (const call of calls) {
		expect(call.method).toBe('POST');
		expect(JSON.parse(String(call.body))).toEqual(selector === 'points' ? { points } : { path: points, samples: 3 });
	}
	const controller = new AbortController();
	const reason = new Error('Cancelled');
	controller.abort(reason);
	await expect(request({ signal: controller.signal })).rejects.toBe(reason);
	expect(calls).toHaveLength(2);
});
