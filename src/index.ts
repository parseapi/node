import type {
	City,
	CityNearest,
	CitySearch,
	Continent,
	ContinentCountries,
	Country,
	CountryStates,
	Currency,
	CurrencyRate,
	District,
	Domain,
	Elevation,
	Email,
	Emoji,
	EmojiSearch,
	HolidayDate,
	HolidayYear,
	Ip,
	Language,
	Mx,
	Phone,
	Point,
	Postal,
	PostalDistance,
	PostalNearby,
	State,
	StateDistricts,
	Timezone,
	Useragent,
	Weather,
} from './types.js';

export * from './types.js';

const VERSION = '0.1.0';
const DEFAULT_BASE_URL = 'https://api.parseapi.com';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_AFTER_CAP_MS = 5_000;

/** Every non-2xx response from the API. Branch on `code`, never on `message`. */
export class ParseAPIError extends Error {
	/** HTTP status */
	readonly status: number;
	/** Machine-readable error code, e.g. 'not_found', 'invalid_api_key', 'rate_limited' */
	readonly code: string;
	/** Link to the docs section for this error */
	readonly docs: string | null;
	/** Send this if you contact support */
	readonly requestId: string | null;

	constructor(status: number, code: string, message: string, docs: string | null, requestId: string | null) {
		super(message);
		this.name = 'ParseAPIError';
		this.status = status;
		this.code = code;
		this.docs = docs;
		this.requestId = requestId;
	}
}

export interface ParseAPIOptions {
	/** Override https://api.parseapi.com (tests, canaries). Also read from PARSEAPI_BASE_URL. */
	baseUrl?: string;
	/** Per-attempt timeout in milliseconds. Default 10000. */
	timeoutMs?: number;
	/** Retries after the first attempt on network errors / 429 / 5xx. Default 2, 0 disables. */
	retries?: number;
	/** Custom fetch implementation (instrumentation, proxies). */
	fetch?: typeof fetch;
}

interface DeepOption {
	/** Request the nested deep object. Paid on most endpoints. */
	deep?: boolean;
}

type Query = Record<string, string | number | boolean | undefined>;

function env(name: string): string | undefined {
	return typeof process !== 'undefined' ? process.env?.[name] : undefined;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(attempt: number, retryAfter: string | null): number {
	if (retryAfter) {
		const seconds = Number(retryAfter);
		if (Number.isFinite(seconds) && seconds >= 0) {
			return Math.min(seconds * 1000, RETRY_AFTER_CAP_MS);
		}
	}
	return Math.random() * 250 * 2 ** attempt;
}

export function parseAPI(apiKey?: string, options: ParseAPIOptions = {}) {
	const key = apiKey ?? env('PARSEAPI_KEY');
	if (!key) {
		throw new Error('parseAPI: missing API key. Pass one or set PARSEAPI_KEY.');
	}

	const baseUrl = (options.baseUrl ?? env('PARSEAPI_BASE_URL') ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const retries = options.retries ?? DEFAULT_RETRIES;
	const doFetch = options.fetch ?? fetch;

	async function request<T>(path: string, query?: Query, headers?: Record<string, string>): Promise<T> {
		const url = new URL(baseUrl + path);
		for (const [name, value] of Object.entries(query ?? {})) {
			if (value !== undefined) url.searchParams.set(name, String(value));
		}

		for (let attempt = 0; ; attempt++) {
			let res: Response;
			try {
				res = await doFetch(url, {
					headers: {
						'X-API-Key': key!,
						'User-Agent': `parseapi-node/${VERSION}`,
						...headers,
					},
					signal: AbortSignal.timeout(timeoutMs),
				});
			} catch (err) {
				if (attempt < retries) {
					await sleep(retryDelayMs(attempt, null));
					continue;
				}
				throw err;
			}

			if (res.ok) {
				return (await res.json()) as T;
			}

			if (RETRY_STATUS.has(res.status) && attempt < retries) {
				await sleep(retryDelayMs(attempt, res.headers.get('Retry-After')));
				continue;
			}

			let body: Record<string, unknown> = {};
			try {
				body = (await res.json()) as Record<string, unknown>;
			} catch {
				// non-JSON error body, fall through to defaults
			}
			throw new ParseAPIError(
				res.status,
				typeof body.code === 'string' ? body.code : 'unknown_error',
				typeof body.message === 'string' ? body.message : `Request failed with status ${res.status}`,
				typeof body.docs === 'string' ? body.docs : null,
				typeof body.request_id === 'string' ? body.request_id : null
			);
		}
	}

	const enc = encodeURIComponent;
	const deepQuery = (opts?: DeepOption): Query => (opts?.deep ? { deep: true } : {});

	return {
		ip: Object.assign(
			(ip: string, opts?: DeepOption): Promise<Ip> => request(`/ip/${enc(ip)}`, deepQuery(opts)),
			{
				me: (opts?: DeepOption): Promise<Ip> => request('/ip/me', deepQuery(opts)),
			}
		),

		continent: Object.assign(
			(code: string): Promise<Continent> => request(`/continent/${enc(code)}`),
			{
				countries: (code: string): Promise<ContinentCountries> => request(`/continent/${enc(code)}/countries`),
			}
		),

		country: Object.assign(
			(code: string): Promise<Country> => request(`/country/${enc(code)}`),
			{
				states: (code: string): Promise<CountryStates> => request(`/country/${enc(code)}/states`),
			}
		),

		state: Object.assign(
			(code: string, opts: { country: string }): Promise<State> =>
				request(`/state/${enc(code)}`, { country: opts.country }),
			{
				districts: (code: string, opts: { country: string }): Promise<StateDistricts> =>
					request(`/state/${enc(code)}/districts`, { country: opts.country }),
			}
		),

		district: (code: string, opts?: { country?: string }): Promise<District> =>
			request(`/district/${enc(code)}`, { country: opts?.country }),

		city: Object.assign(
			(name: string, opts?: { country?: string; state?: string }): Promise<City> =>
				request(`/city/${enc(name)}`, { country: opts?.country, state: opts?.state }),
			{
				id: (id: string): Promise<City> => request(`/city/id/${enc(id)}`),
				search: (q: string, opts?: { country?: string; state?: string; limit?: number }): Promise<CitySearch> =>
					request('/city', { q, country: opts?.country, state: opts?.state, limit: opts?.limit }),
				nearest: (lat: number, lon: number): Promise<CityNearest> => request('/city', { lat, lon }),
			}
		),

		postal: Object.assign(
			(code: string, opts: { country: string }): Promise<Postal> =>
				request(`/postal/${enc(code)}`, { country: opts.country }),
			{
				nearby: (
					code: string,
					opts: { country: string; radius?: number; unit?: 'km' | 'mi' }
				): Promise<PostalNearby> =>
					request(`/postal/${enc(code)}/nearby`, {
						country: opts.country,
						radius: opts.radius,
						unit: opts.unit,
					}),
				distance: (from: string, to: string, opts: { country: string }): Promise<PostalDistance> =>
					request(`/postal/${enc(from)}/distance/${enc(to)}`, { country: opts.country }),
			}
		),

		email: (email: string, opts?: DeepOption): Promise<Email> => request(`/email/${enc(email)}`, deepQuery(opts)),

		phone: (number: string, opts?: { country?: string } & DeepOption): Promise<Phone> =>
			request(`/phone/${enc(number)}`, { country: opts?.country, ...deepQuery(opts) }),

		domain: (domain: string, opts?: DeepOption): Promise<Domain> =>
			request(`/domain/${enc(domain)}`, deepQuery(opts)),

		mx: (domain: string): Promise<Mx> => request(`/mx/${enc(domain)}`),

		useragent: (ua: string, opts?: DeepOption): Promise<Useragent> =>
			request('/useragent', deepQuery(opts), { 'User-Agent': ua }),

		currency: Object.assign(
			(code: string): Promise<Currency> => request(`/currency/${enc(code)}`),
			{
				rate: (base: string, quote: string): Promise<CurrencyRate> =>
					request(`/currency/${enc(base)}/${enc(quote)}`),
			}
		),

		language: (code: string): Promise<Language> => request(`/language/${enc(code)}`),

		timezone: (id: string, opts?: { at?: string }): Promise<Timezone> =>
			request(`/timezone/${enc(id)}`, { at: opts?.at }),

		holiday: Object.assign(
			(country: string, opts?: { year?: number }): Promise<HolidayYear> =>
				request(`/holiday/${enc(country)}`, { year: opts?.year }),
			{
				date: (country: string, date: string): Promise<HolidayDate> =>
					request(`/holiday/${enc(country)}/${enc(date)}`),
			}
		),

		elevation: (lat: number, lon: number): Promise<Elevation> => request('/elevation', { lat, lon }),

		point: (lat: number, lon: number, opts?: DeepOption): Promise<Point> =>
			request('/point', { lat, lon, ...deepQuery(opts) }),

		weather: (lat: number, lon: number, opts?: { unit?: 'metric' | 'imperial' } & DeepOption): Promise<Weather> =>
			request('/weather', { lat, lon, unit: opts?.unit, ...deepQuery(opts) }),

		emoji: Object.assign(
			(query: string): Promise<Emoji> => request(`/emoji/${enc(query)}`),
			{
				search: (q: string, opts?: { limit?: number }): Promise<EmojiSearch> =>
					request('/emoji', { q, limit: opts?.limit }),
			}
		),
	};
}

export type ParseAPIClient = ReturnType<typeof parseAPI>;
