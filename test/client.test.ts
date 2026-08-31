import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseAPI, ParseAPIError } from '../src/index.js';

type Call = { url: string; headers: Record<string, string> };

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers },
	});
}

function stubClient(responses: Response[] | ((call: Call) => Response), options: Record<string, unknown> = {}) {
	const calls: Call[] = [];
	const queue = Array.isArray(responses) ? [...responses] : null;
	const fetchStub = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
		const call: Call = {
			url: String(input),
			headers: (init?.headers ?? {}) as Record<string, string>,
		};
		calls.push(call);
		if (queue) {
			const next = queue.shift();
			if (!next) throw new Error('stub exhausted');
			return next;
		}
		return (responses as (call: Call) => Response)(call);
	});
	const parse = parseAPI('test_key_123', { fetch: fetchStub as unknown as typeof fetch, retries: 0, ...options });
	return { parse, calls, fetchStub };
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('url mapping', () => {
	const table: [string, (parse: ReturnType<typeof parseAPI>) => Promise<unknown>, string][] = [
		['ip', (p) => p.ip('8.8.8.8'), 'https://api.parseapi.com/ip/8.8.8.8'],
		['ip.self', (p) => p.ip.self(), 'https://api.parseapi.com/ip'],
		['ip deep', (p) => p.ip('8.8.8.8', { deep: true }), 'https://api.parseapi.com/ip/8.8.8.8?deep=true'],
		['continent', (p) => p.continent('NA'), 'https://api.parseapi.com/continent/NA'],
		['continent.countries', (p) => p.continent.countries('NA'), 'https://api.parseapi.com/continent/NA/countries'],
		['bloc', (p) => p.bloc('EU'), 'https://api.parseapi.com/bloc/EU'],
		['bloc.countries', (p) => p.bloc.countries('SCHENGEN'), 'https://api.parseapi.com/bloc/SCHENGEN/countries'],
		['country', (p) => p.country('US'), 'https://api.parseapi.com/country/US'],
		['country.states', (p) => p.country.states('US'), 'https://api.parseapi.com/country/US/states'],
		['state', (p) => p.state('NC', { country: 'US' }), 'https://api.parseapi.com/state/NC?country=US'],
		['state by name', (p) => p.state('colorado'), 'https://api.parseapi.com/state/colorado'],
		[
			'state.districts',
			(p) => p.state.districts('NC', { country: 'US' }),
			'https://api.parseapi.com/state/NC/districts?country=US',
		],
		['district', (p) => p.district('37081'), 'https://api.parseapi.com/district/37081'],
		[
			'district by name',
			(p) => p.district('guilford county', { state: 'NC' }),
			'https://api.parseapi.com/district/guilford%20county?state=NC',
		],
		['city', (p) => p.city('charlotte', { state: 'NC' }), 'https://api.parseapi.com/city/charlotte?state=NC'],
		[
			'city.id',
			(p) => p.city.id('city_mb8mbqrkz8zb'),
			'https://api.parseapi.com/city/id/city_mb8mbqrkz8zb',
		],
		[
			'city.search',
			(p) => p.city.search('char', { country: 'US', limit: 10 }),
			'https://api.parseapi.com/city?q=char&country=US&limit=10',
		],
		['city.nearest', (p) => p.city.nearest(35.2271, -80.8431), 'https://api.parseapi.com/city?lat=35.2271&lon=-80.8431'],
		[
			'city.nearby',
			(p) => p.city.nearby('denver', { radius: 8, unit: 'mi', limit: 3 }),
			'https://api.parseapi.com/city/denver/nearby?radius=8&unit=mi&limit=3',
		],
		['postal', (p) => p.postal('28202', { country: 'US' }), 'https://api.parseapi.com/postal/28202?country=US'],
		['postal bare', (p) => p.postal('SW1A 1AA'), 'https://api.parseapi.com/postal/SW1A%201AA'],
		[
			'postal.nearby',
			(p) => p.postal.nearby('28202', { country: 'US', radius: 40, unit: 'km' }),
			'https://api.parseapi.com/postal/28202/nearby?country=US&radius=40&unit=km',
		],
		[
			'postal.distance',
			(p) => p.postal.distance('28202', '10001', { country: 'US' }),
			'https://api.parseapi.com/postal/28202/distance/10001?country=US',
		],
		['email', (p) => p.email('a@b.com'), 'https://api.parseapi.com/email/a%40b.com'],
		['vat', (p) => p.vat('DE136695976'), 'https://api.parseapi.com/vat/DE136695976'],
		[
			'iban',
			(p) => p.iban('DE89370400440532013000'),
			'https://api.parseapi.com/iban/DE89370400440532013000',
		],
		[
			'iban country',
			(p) => p.iban('89370400440532013000', { country: 'DE' }),
			'https://api.parseapi.com/iban/89370400440532013000?country=DE',
		],
		[
			'vat from deep',
			(p) => p.vat('DE136695976', { from: 'IE6388047V', deep: true }),
			'https://api.parseapi.com/vat/DE136695976?from=IE6388047V&deep=true',
		],
		[
			'phone encodes plus',
			(p) => p.phone('+14155552671', { deep: true }),
			'https://api.parseapi.com/phone/%2B14155552671?deep=true',
		],
		[
			'carrier encodes plus',
			(p) => p.carrier('+14155552671'),
			'https://api.parseapi.com/carrier/%2B14155552671',
		],
		[
			'caller with country',
			(p) => p.caller('4155552671', { country: 'US' }),
			'https://api.parseapi.com/caller/4155552671?country=US',
		],
		['hlr', (p) => p.hlr('+447712345678'), 'https://api.parseapi.com/hlr/%2B447712345678'],
		['domain', (p) => p.domain('example.com'), 'https://api.parseapi.com/domain/example.com'],
		['mx', (p) => p.mx('example.com'), 'https://api.parseapi.com/mx/example.com'],
		['useragent', (p) => p.useragent('TestUA/1.0'), 'https://api.parseapi.com/useragent'],
		['currency', (p) => p.currency('USD'), 'https://api.parseapi.com/currency/USD'],
		['currency.rate', (p) => p.currency.rate('USD', 'EUR'), 'https://api.parseapi.com/currency/USD/EUR'],
		[
			'currency.rate date amount',
			(p) => p.currency.rate('USD', 'JPY', { date: '2026-08-28', amount: 100 }),
			'https://api.parseapi.com/currency/USD/JPY?date=2026-08-28&amount=100',
		],
		['language', (p) => p.language('en'), 'https://api.parseapi.com/language/en'],
		['name encodes spaces', (p) => p.name('Smith, John'), 'https://api.parseapi.com/name/Smith%2C%20John'],
		[
			'timezone encodes slash',
			(p) => p.timezone('America/New_York'),
			'https://api.parseapi.com/timezone/America%2FNew_York',
		],
		[
			'timezone from coords',
			(p) => p.timezone(40.7128, -74.006),
			'https://api.parseapi.com/timezone?lat=40.7128&lon=-74.006',
		],
		[
			'timezone convert',
			(p) => p.timezone('America/New_York', { to: 'Asia/Tokyo', at: '2026-08-29T15:00' }),
			'https://api.parseapi.com/timezone/America%2FNew_York?at=2026-08-29T15%3A00&to=Asia%2FTokyo',
		],
		[
			'date encodes slashes',
			(p) => p.date('3/29/2026'),
			'https://api.parseapi.com/date/3%2F29%2F2026',
		],
		[
			'date with format and to',
			(p) => p.date('03/04/2026', { format: 'mdy', to: '2026-12-25' }),
			'https://api.parseapi.com/date/03%2F04%2F2026?format=mdy&to=2026-12-25',
		],
		['date.today', (p) => p.date.today({ to: '2026-12-25' }), 'https://api.parseapi.com/date?to=2026-12-25'],
		['holiday', (p) => p.holiday('US', { year: 1955 }), 'https://api.parseapi.com/holiday/US?year=1955'],
		['holiday.date', (p) => p.holiday.date('US', '2026-12-25'), 'https://api.parseapi.com/holiday/US/2026-12-25'],
		['elevation', (p) => p.elevation(35.2, -80.8), 'https://api.parseapi.com/elevation?lat=35.2&lon=-80.8'],
		['point', (p) => p.point(36.0726, -79.792, { deep: true }), 'https://api.parseapi.com/point?lat=36.0726&lon=-79.792&deep=true'],
		[
			'weather',
			(p) => p.weather(40.7128, -74.006, { deep: true }),
			'https://api.parseapi.com/weather?lat=40.7128&lon=-74.006&deep=true',
		],
		['emoji', (p) => p.emoji('rocket'), 'https://api.parseapi.com/emoji/rocket'],
		['emoji.search', (p) => p.emoji.search('fire', { limit: 20 }), 'https://api.parseapi.com/emoji?q=fire&limit=20'],
	];

	it.each(table)('%s', async (_name, invoke, expectedUrl) => {
		const { parse, calls } = stubClient(() => jsonResponse({}));
		await invoke(parse);
		expect(calls[0]?.url).toBe(expectedUrl);
	});
});

describe('headers', () => {
	it('sends X-API-Key and SDK user agent', async () => {
		const { parse, calls } = stubClient(() => jsonResponse({}));
		await parse.country('US');
		expect(calls[0]?.headers['X-API-Key']).toBe('test_key_123');
		expect(calls[0]?.headers['User-Agent']).toMatch(/^parseapi-node\/\d+\.\d+\.\d+$/);
	});

	it('useragent method replaces the UA header with its argument', async () => {
		const { parse, calls } = stubClient(() => jsonResponse({}));
		await parse.useragent('Mozilla/5.0 (Test)');
		expect(calls[0]?.headers['User-Agent']).toBe('Mozilla/5.0 (Test)');
	});
});

describe('construction', () => {
	it('throws without a key', () => {
		const saved = process.env.PARSEAPI_KEY;
		delete process.env.PARSEAPI_KEY;
		expect(() => parseAPI()).toThrow(/PARSEAPI_KEY/);
		if (saved !== undefined) process.env.PARSEAPI_KEY = saved;
	});

	it('falls back to PARSEAPI_KEY env', async () => {
		const saved = process.env.PARSEAPI_KEY;
		process.env.PARSEAPI_KEY = 'env_key_456';
		const calls: Call[] = [];
		const fetchStub = async (input: string | URL | Request, init?: RequestInit) => {
			calls.push({ url: String(input), headers: (init?.headers ?? {}) as Record<string, string> });
			return jsonResponse({});
		};
		const parse = parseAPI(undefined, { fetch: fetchStub as typeof fetch, retries: 0 });
		await parse.country('US');
		expect(calls[0]?.headers['X-API-Key']).toBe('env_key_456');
		if (saved !== undefined) process.env.PARSEAPI_KEY = saved;
		else delete process.env.PARSEAPI_KEY;
	});

	it('honors baseUrl override and strips trailing slash', async () => {
		const { parse, calls } = stubClient(() => jsonResponse({}), { baseUrl: 'http://localhost:3000/' });
		await parse.country('US');
		expect(calls[0]?.url).toBe('http://localhost:3000/country/US');
	});
});

describe('errors', () => {
	it('throws ParseAPIError with the live error shape', async () => {
		const { parse } = stubClient(() =>
			jsonResponse(
				{
					code: 'not_found',
					message: 'City not found',
					docs: 'https://parseapi.com/docs#not_found',
					request_id: 'req_abc',
				},
				404
			)
		);
		const err = await parse.city('notarealcityxyz').catch((e: unknown) => e);
		expect(err).toBeInstanceOf(ParseAPIError);
		const parseErr = err as ParseAPIError;
		expect(parseErr.status).toBe(404);
		expect(parseErr.code).toBe('not_found');
		expect(parseErr.message).toBe('City not found');
		expect(parseErr.docs).toBe('https://parseapi.com/docs#not_found');
		expect(parseErr.requestId).toBe('req_abc');
	});

	it('handles non-JSON error bodies', async () => {
		const { parse } = stubClient(() => new Response('gateway timeout', { status: 400 }));
		const err = await parse.country('US').catch((e: unknown) => e);
		expect(err).toBeInstanceOf(ParseAPIError);
		expect((err as ParseAPIError).code).toBe('unknown_error');
	});
});

describe('retries', () => {
	it('retries 5xx then succeeds', async () => {
		const { parse, fetchStub } = stubClient(
			[jsonResponse({ code: 'server_error', message: 'boom' }, 500), jsonResponse({ country: 'us' })],
			{ retries: 2 }
		);
		const result = await parse.country('US');
		expect(result.country).toBe('us');
		expect(fetchStub).toHaveBeenCalledTimes(2);
	});

	it('does not retry 404', async () => {
		const { parse, fetchStub } = stubClient(
			[jsonResponse({ code: 'not_found', message: 'nope' }, 404), jsonResponse({})],
			{ retries: 2 }
		);
		await expect(parse.country('XX')).rejects.toBeInstanceOf(ParseAPIError);
		expect(fetchStub).toHaveBeenCalledTimes(1);
	});

	it('gives up after configured retries', async () => {
		const { parse, fetchStub } = stubClient(
			[
				jsonResponse({ code: 'rate_limited', message: 'slow down' }, 429),
				jsonResponse({ code: 'rate_limited', message: 'slow down' }, 429),
				jsonResponse({ code: 'rate_limited', message: 'slow down' }, 429),
			],
			{ retries: 2 }
		);
		const err = await parse.country('US').catch((e: unknown) => e);
		expect((err as ParseAPIError).code).toBe('rate_limited');
		expect(fetchStub).toHaveBeenCalledTimes(3);
	});

	it('retries network errors', async () => {
		let first = true;
		const calls: Call[] = [];
		const fetchStub = async (input: string | URL | Request, init?: RequestInit) => {
			calls.push({ url: String(input), headers: (init?.headers ?? {}) as Record<string, string> });
			if (first) {
				first = false;
				throw new TypeError('fetch failed');
			}
			return jsonResponse({ country: 'us' });
		};
		const parse = parseAPI('k', { fetch: fetchStub as typeof fetch, retries: 1 });
		const result = await parse.country('US');
		expect(result.country).toBe('us');
		expect(calls.length).toBe(2);
	});
});
