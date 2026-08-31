import type {
	Bloc,
	BlocCountries,
	Caller,
	Carrier,
	City,
	CityNearby,
	CityNearest,
	CitySearch,
	Continent,
	ContinentCountries,
	Country,
	CountryStates,
	Currency,
	CurrencyRate,
	DateInfo,
	District,
	Domain,
	Elevation,
	Email,
	Vat,
	Iban,
	Emoji,
	EmojiSearch,
	Hlr,
	HolidayDate,
	HolidayYear,
	Ip,
	Language,
	Mx,
	Name,
	Phone,
	Point,
	Postal,
	PostalDistance,
	PostalNearby,
	Sanctions,
	State,
	StateDistricts,
	Timezone,
	Useragent,
	Vin,
	Weather,
} from './types.js';

export * from './types.js';

const VERSION = '0.1.3';
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

	function timezone(id: string, opts?: { at?: string; to?: string }): Promise<Timezone>;
	function timezone(lat: number, lon: number, opts?: { at?: string }): Promise<Timezone>;
	function timezone(
		idOrLat: string | number,
		lonOrOpts?: number | { at?: string; to?: string },
		opts?: { at?: string }
	): Promise<Timezone> {
		if (typeof idOrLat === 'number') {
			return request('/timezone', {
				lat: idOrLat,
				lon: typeof lonOrOpts === 'number' ? lonOrOpts : undefined,
				at: opts?.at,
			});
		}
		const idOpts = lonOrOpts && typeof lonOrOpts === 'object' ? lonOrOpts : undefined;
		return request(`/timezone/${enc(idOrLat)}`, {
			at: idOpts?.at,
			to: idOpts?.to,
		});
	}

	return {
		ip: Object.assign(
			(ip: string, opts?: DeepOption): Promise<Ip> => request(`/ip/${enc(ip)}`, deepQuery(opts)),
			{
				self: (opts?: DeepOption): Promise<Ip> => request('/ip', deepQuery(opts)),
			}
		),

		continent: Object.assign(
			(code: string): Promise<Continent> => request(`/continent/${enc(code)}`),
			{
				countries: (code: string): Promise<ContinentCountries> => request(`/continent/${enc(code)}/countries`),
			}
		),

		bloc: Object.assign(
			(code: string): Promise<Bloc> => request(`/bloc/${enc(code)}`),
			{
				countries: (code: string): Promise<BlocCountries> => request(`/bloc/${enc(code)}/countries`),
			}
		),

		country: Object.assign(
			(code: string): Promise<Country> => request(`/country/${enc(code)}`),
			{
				states: (code: string): Promise<CountryStates> => request(`/country/${enc(code)}/states`),
			}
		),

		state: Object.assign(
			(code: string, opts?: { country?: string }): Promise<State> =>
				request(`/state/${enc(code)}`, { country: opts?.country }),
			{
				districts: (code: string, opts?: { country?: string }): Promise<StateDistricts> =>
					request(`/state/${enc(code)}/districts`, { country: opts?.country }),
			}
		),

		district: (code: string, opts?: { country?: string; state?: string }): Promise<District> =>
			request(`/district/${enc(code)}`, { country: opts?.country, state: opts?.state }),

		city: Object.assign(
			(name: string, opts?: { country?: string; state?: string }): Promise<City> =>
				request(`/city/${enc(name)}`, { country: opts?.country, state: opts?.state }),
			{
				id: (id: string): Promise<City> => request(`/city/id/${enc(id)}`),
				search: (q: string, opts?: { country?: string; state?: string; limit?: number }): Promise<CitySearch> =>
					request('/city', { q, country: opts?.country, state: opts?.state, limit: opts?.limit }),
				nearest: (lat: number, lon: number): Promise<CityNearest> => request('/city', { lat, lon }),
				nearby: (
					name: string,
					opts?: { radius?: number; unit?: 'km' | 'mi'; country?: string; state?: string; limit?: number }
				): Promise<CityNearby> =>
					request(`/city/${enc(name)}/nearby`, {
						radius: opts?.radius,
						unit: opts?.unit,
						country: opts?.country,
						state: opts?.state,
						limit: opts?.limit,
					}),
			}
		),

		postal: Object.assign(
			(code: string, opts?: { country?: string }): Promise<Postal> =>
				request(`/postal/${enc(code)}`, { country: opts?.country }),
			{
				nearby: (
					code: string,
					opts?: { country?: string; radius?: number; unit?: 'km' | 'mi' }
				): Promise<PostalNearby> =>
					request(`/postal/${enc(code)}/nearby`, {
						country: opts?.country,
						radius: opts?.radius,
						unit: opts?.unit,
					}),
				distance: (from: string, to: string, opts?: { country?: string }): Promise<PostalDistance> =>
					request(`/postal/${enc(from)}/distance/${enc(to)}`, { country: opts?.country }),
			}
		),

		email: (email: string, opts?: DeepOption): Promise<Email> => request(`/email/${enc(email)}`, deepQuery(opts)),

		vat: (
			number: string,
			opts?: { country?: string; from?: string } & DeepOption
		): Promise<Vat> =>
			request(`/vat/${enc(number)}`, {
				country: opts?.country,
				from: opts?.from,
				...deepQuery(opts),
			}),

		iban: (iban: string, opts?: { country?: string }): Promise<Iban> =>
			request(`/iban/${enc(iban)}`, { country: opts?.country }),

		phone: (number: string, opts?: { country?: string } & DeepOption): Promise<Phone> =>
			request(`/phone/${enc(number)}`, { country: opts?.country, ...deepQuery(opts) }),

		carrier: (number: string, opts?: { country?: string }): Promise<Carrier> =>
			request(`/carrier/${enc(number)}`, { country: opts?.country }),

		caller: (number: string, opts?: { country?: string }): Promise<Caller> =>
			request(`/caller/${enc(number)}`, { country: opts?.country }),

		hlr: (number: string, opts?: { country?: string }): Promise<Hlr> =>
			request(`/hlr/${enc(number)}`, { country: opts?.country }),

		domain: (domain: string, opts?: DeepOption): Promise<Domain> =>
			request(`/domain/${enc(domain)}`, deepQuery(opts)),

		mx: (domain: string): Promise<Mx> => request(`/mx/${enc(domain)}`),

		useragent: (ua: string, opts?: DeepOption): Promise<Useragent> =>
			request('/useragent', deepQuery(opts), { 'User-Agent': ua }),

		vin: (vin: string, opts?: DeepOption): Promise<Vin> =>
			request(`/vin/${enc(vin)}`, deepQuery(opts)),

		currency: Object.assign(
			(code: string): Promise<Currency> => request(`/currency/${enc(code)}`),
			{
				rate: (
					base: string,
					quote: string,
					opts?: { date?: string; amount?: number }
				): Promise<CurrencyRate> =>
					request(`/currency/${enc(base)}/${enc(quote)}`, {
						date: opts?.date,
						amount: opts?.amount,
					}),
			}
		),

		language: (code: string): Promise<Language> => request(`/language/${enc(code)}`),

		name: (name: string): Promise<Name> => request(`/name/${enc(name)}`),

		sanctions: (name: string): Promise<Sanctions> => request(`/sanctions/${enc(name)}`),

		timezone,

		date: Object.assign(
			(date: string, opts?: { format?: 'mdy' | 'dmy'; to?: string }): Promise<DateInfo> =>
				request(`/date/${enc(date)}`, { format: opts?.format, to: opts?.to }),
			{
				today: (opts?: { to?: string }): Promise<DateInfo> => request('/date', { to: opts?.to }),
			}
		),

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

		weather: (lat: number, lon: number, opts?: DeepOption & { date?: string }): Promise<Weather> =>
			request('/weather', { lat, lon, date: opts?.date, ...deepQuery(opts) }),

		emoji: Object.assign(
			(emoji: string): Promise<Emoji> => request(`/emoji/${enc(emoji)}`),
			{
				search: (q: string, opts?: { limit?: number }): Promise<EmojiSearch> =>
					request('/emoji', { q, limit: opts?.limit }),
			}
		),
	};
}

export type ParseAPIClient = ReturnType<typeof parseAPI>;
