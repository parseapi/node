import type {
	Asn,
	Mac,
	Address,
	AddressSearch,
	Company,
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
	Tariff,
	TariffSearch,
	HolidayDate,
	HolidayYear,
	Ip,
	Language,
	Mx,
	Name,
	Npi,
	Phone,
	Point,
	Postal,
	PostalDistance,
	PostalNearby,
	State,
	StateDistricts,
	Timezone,
	Useragent,
	Vin,
	Weather,
} from './types.js';

export * from './types.js';

const VERSION = '0.3.1';
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

export interface RequestOptions {
	/** Cancel this call, including any retry wait. */
	signal?: AbortSignal;
	/** Timeout for each attempt, in milliseconds. Overrides the client setting. */
	timeoutMs?: number;
	/** Explicit retry count. Paid attempts can each consume usage. */
	retries?: number;
}

export interface ParseAPIOptions {
	/** Override https://api.parseapi.com (tests, canaries). Also read from PARSEAPI_BASE_URL. */
	baseUrl?: string;
	/** Per-attempt timeout in milliseconds. Default 10000. */
	timeoutMs?: number;
	/** Retries after the first attempt on network errors / 429 / 5xx. Default 2 for ordinary calls, 0 for paid checks. An explicit count overrides both. */
	retries?: number;
	/** Custom fetch implementation (instrumentation, proxies). */
	fetch?: typeof fetch;
}

export type IpOptions = DeepOption & RequestOptions;
export type IpSelfOptions = DeepOption & RequestOptions;
export type ContinentOptions = RequestOptions;
export type ContinentCountriesOptions = RequestOptions;
export type BlocOptions = RequestOptions;
export type BlocCountriesOptions = RequestOptions;
export type CountryOptions = RequestOptions;
export type CountryStatesOptions = RequestOptions;
export type StateOptions = { country?: string } & RequestOptions;
export type StateDistrictsOptions = { country?: string } & RequestOptions;
export type DistrictOptions = { country?: string; state?: string } & RequestOptions;
export type CityOptions = { country?: string; state?: string } & RequestOptions;
export type CityIdOptions = RequestOptions;
export type CitySearchOptions = { country?: string; state?: string; limit?: number } & RequestOptions;
export type CityNearestOptions = RequestOptions;
export type CityNearbyOptions = { radius?: number; unit?: 'km' | 'mi'; country?: string; state?: string; limit?: number } & RequestOptions;
export type PostalOptions = { country?: string } & RequestOptions;
export type PostalNearbyOptions = { country?: string; radius?: number; unit?: 'km' | 'mi' } & RequestOptions;
export type PostalDistanceOptions = { country?: string } & RequestOptions;
export type AddressOptions = { country?: string } & DeepOption & RequestOptions;
export type AddressSearchOptions = { country?: string; postal?: string; city?: string; state?: string; ip?: string } & RequestOptions;
export type CompanyOptions = { country?: string } & DeepOption & RequestOptions;
export type EmailOptions = DeepOption & RequestOptions;
export type VatOptions = { country?: string; from?: string } & DeepOption & RequestOptions;
export type IbanOptions = { country?: string } & RequestOptions;
export type NpiOptions = DeepOption & RequestOptions;
export type PhoneOptions = { country?: string } & DeepOption & RequestOptions;
export type CarrierOptions = { country?: string } & RequestOptions;
export type CallerOptions = { country?: string } & RequestOptions;
export type HlrOptions = { country?: string } & RequestOptions;
export type DomainOptions = DeepOption & RequestOptions;
export type AsnOptions = RequestOptions;
export type MacOptions = RequestOptions;
export type MxOptions = RequestOptions;
export type UseragentOptions = DeepOption & RequestOptions;
export type VinOptions = DeepOption & RequestOptions;
export type TariffOptions = { origin?: string } & DeepOption & RequestOptions;
export type TariffSearchOptions = RequestOptions;
export type CurrencyOptions = RequestOptions;
export type CurrencyRateOptions = { date?: string; amount?: number } & RequestOptions;
export type LanguageOptions = RequestOptions;
export type NameOptions = RequestOptions;
export type TimezoneOptions = { at?: string; to?: string } & RequestOptions;
export type TimezoneAtOptions = { at?: string } & RequestOptions;
export type DateOptions = { format?: 'mdy' | 'dmy'; to?: string } & RequestOptions;
export type DateTodayOptions = { to?: string } & RequestOptions;
export type HolidayOptions = { year?: number } & RequestOptions;
export type HolidayDateOptions = RequestOptions;
export type ElevationOptions = RequestOptions;
export type PointOptions = DeepOption & RequestOptions;
export type WeatherOptions = DeepOption & { date?: string } & RequestOptions;
export type EmojiOptions = RequestOptions;
export type EmojiSearchOptions = { limit?: number } & RequestOptions;

interface DeepOption {
	/** Request richer fields. Availability and usage depend on the endpoint. */
	deep?: boolean;
}

type Query = Record<string, string | number | boolean | undefined>;

function env(name: string): string | undefined {
	return typeof process !== 'undefined' ? process.env?.[name] : undefined;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) { reject(signal.reason); return; }
		const onAbort = () => { clearTimeout(timer); reject(signal!.reason); };
		const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, ms);
		signal?.addEventListener('abort', onAbort, { once: true });
	});
}

function validateTimeout(value: number): void {
	if (!Number.isInteger(value) || value <= 0 || value > 2_147_483_647) {
		throw new RangeError('parseAPI: timeoutMs must be an integer from 1 to 2147483647.');
	}
}

function validateRetries(value: number | undefined): void {
	if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
		throw new RangeError('parseAPI: retries must be a non-negative integer.');
	}
}

function metered(path: string, query?: Query): boolean {
	const product = path.split('/')[1];
	return ['carrier', 'caller', 'hlr', 'litigator', 'reassigned'].includes(product ?? '')
		|| (['email', 'vat', 'address'].includes(product ?? '') && query?.deep === true);
}

function retryDelayMs(attempt: number, retryAfter: string | null): number {
	if (retryAfter) {
		const seconds = Number(retryAfter);
		if (Number.isFinite(seconds) && seconds >= 0) {
			return Math.min(seconds * 1000, RETRY_AFTER_CAP_MS);
		}
		if (Number.isNaN(seconds)) {
			const date = Date.parse(retryAfter);
			if (Number.isFinite(date)) return Math.min(Math.max(date - Date.now(), 0), RETRY_AFTER_CAP_MS);
		}
	}
	return Math.random() * 250 * 2 ** attempt;
}

export function parseAPI(apiKey?: string, options: ParseAPIOptions = {}) {
	const key = apiKey || env('PARSEAPI_KEY');
	if (!key) {
		throw new Error('parseAPI: missing API key. Pass one or set PARSEAPI_KEY.');
	}

	const baseUrl = (options.baseUrl ?? env('PARSEAPI_BASE_URL') ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const configuredRetries = options.retries;
	validateTimeout(timeoutMs);
	validateRetries(configuredRetries);
	const doFetch = options.fetch ?? fetch;

	async function request<T>(path: string, query?: Query, headers?: Record<string, string>, controls: RequestOptions = {}): Promise<T> {
		const signal = controls.signal;
		signal?.throwIfAborted();
		const attemptTimeout = controls.timeoutMs ?? timeoutMs;
		const retries = controls.retries ?? configuredRetries ?? (metered(path, query) ? 0 : DEFAULT_RETRIES);
		validateTimeout(attemptTimeout);
		validateRetries(retries);
		const url = new URL(baseUrl + path);
		for (const [name, value] of Object.entries(query ?? {})) {
			if (value !== undefined) url.searchParams.set(name, String(value));
		}

		for (let attempt = 0; ; attempt++) {
			signal?.throwIfAborted();
			const controller = new AbortController();
			const onAbort = () => controller.abort(signal!.reason);
			signal?.addEventListener('abort', onAbort, { once: true });
			const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), attemptTimeout);
			let retryAfter: string | null = null;
			try {
				let res: Response | undefined;
				try {
					res = await doFetch(url, {
						redirect: 'manual',
						headers: { 'X-API-Key': key!, 'User-Agent': `parseapi-node/${VERSION}`, ...headers },
						signal: controller.signal,
					});
				} catch (error) {
					signal?.throwIfAborted();
					if (attempt >= retries) throw error;
				}
				signal?.throwIfAborted();
				if (res?.ok) {
					try {
						const result = await res.json() as T;
						signal?.throwIfAborted();
						return result;
					} catch (error) {
						signal?.throwIfAborted();
						if (error instanceof SyntaxError || attempt >= retries) throw error;
						res = undefined;
					}
				}
				if (res && RETRY_STATUS.has(res.status) && attempt < retries) {
					retryAfter = res.headers.get('Retry-After');
					await res.body?.cancel().catch(() => {});
				} else if (res) {
					let body: Record<string, unknown> = {};
					try {
						const parsed: unknown = await res.json();
						if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
					} catch {
						controller.signal.throwIfAborted();
					}
					signal?.throwIfAborted();
					throw new ParseAPIError(
						res.status,
						typeof body.code === 'string' ? body.code : 'unknown_error',
						typeof body.message === 'string' ? body.message : `Request failed with status ${res.status}`,
						typeof body.docs === 'string' ? body.docs : null,
						typeof body.request_id === 'string' ? body.request_id : null
					);
				}
			} finally {
				clearTimeout(timer);
				signal?.removeEventListener('abort', onAbort);
			}
			await sleep(retryDelayMs(attempt, retryAfter), signal);
		}
	}

	const enc = encodeURIComponent;
	const deepQuery = (opts?: DeepOption): Query => (opts?.deep ? { deep: true } : {});


	return {
		ip: Object.assign(
			(ip: string, opts?: IpOptions): Promise<Ip> => request(`/ip/${enc(ip)}`, deepQuery(opts), undefined, opts),
			{
				self: (opts?: IpSelfOptions): Promise<Ip> => request('/ip', deepQuery(opts), undefined, opts),
			}
		),

		continent: Object.assign(
			(code: string, opts?: ContinentOptions): Promise<Continent> => request(`/continent/${enc(code)}`, undefined, undefined, opts),
			{
				countries: (code: string, opts?: ContinentCountriesOptions): Promise<ContinentCountries> => request(`/continent/${enc(code)}/countries`, undefined, undefined, opts),
			}
		),

		bloc: Object.assign(
			(code: string, opts?: BlocOptions): Promise<Bloc> => request(`/bloc/${enc(code)}`, undefined, undefined, opts),
			{
				countries: (code: string, opts?: BlocCountriesOptions): Promise<BlocCountries> => request(`/bloc/${enc(code)}/countries`, undefined, undefined, opts),
			}
		),

		country: Object.assign(
			(code: string, opts?: CountryOptions): Promise<Country> => request(`/country/${enc(code)}`, undefined, undefined, opts),
			{
				states: (code: string, opts?: CountryStatesOptions): Promise<CountryStates> => request(`/country/${enc(code)}/states`, undefined, undefined, opts),
			}
		),

		state: Object.assign(
			(code: string, opts?: StateOptions): Promise<State> =>
				request(`/state/${enc(code)}`, { country: opts?.country }, undefined, opts),
			{
				districts: (code: string, opts?: StateDistrictsOptions): Promise<StateDistricts> =>
					request(`/state/${enc(code)}/districts`, { country: opts?.country }, undefined, opts),
			}
		),

		district: (code: string, opts?: DistrictOptions): Promise<District> =>
			request(`/district/${enc(code)}`, { country: opts?.country, state: opts?.state }, undefined, opts),

		city: Object.assign(
			(name: string, opts?: CityOptions): Promise<City> =>
				request(`/city/${enc(name)}`, { country: opts?.country, state: opts?.state }, undefined, opts),
			{
				id: (id: string, opts?: CityIdOptions): Promise<City> => request(`/city/id/${enc(id)}`, undefined, undefined, opts),
				search: (query: string, opts?: CitySearchOptions): Promise<CitySearch> =>
					request('/city', { q: query, country: opts?.country, state: opts?.state, limit: opts?.limit }, undefined, opts),
				nearest: (lat: number, lon: number, opts?: CityNearestOptions): Promise<CityNearest> => request('/city', { lat, lon }, undefined, opts),
				nearby: (
					name: string,
					opts?: CityNearbyOptions
				): Promise<CityNearby> =>
					request(`/city/${enc(name)}/nearby`, {
						radius: opts?.radius,
						unit: opts?.unit,
						country: opts?.country,
						state: opts?.state,
						limit: opts?.limit,
					}, undefined, opts),
			}
		),

		postal: Object.assign(
			(code: string, opts?: PostalOptions): Promise<Postal> =>
				request(`/postal/${enc(code)}`, { country: opts?.country }, undefined, opts),
			{
				nearby: (
					code: string,
					opts?: PostalNearbyOptions
				): Promise<PostalNearby> =>
					request(`/postal/${enc(code)}/nearby`, {
						country: opts?.country,
						radius: opts?.radius,
						unit: opts?.unit,
					}, undefined, opts),
				distance: (from: string, to: string, opts?: PostalDistanceOptions): Promise<PostalDistance> =>
					request(`/postal/${enc(from)}/distance/${enc(to)}`, { country: opts?.country }, undefined, opts),
			}
		),

		address: Object.assign(
			(address: string, opts?: AddressOptions): Promise<Address> =>
				request(`/address/${enc(address)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),
			{
				search: (query: string, opts?: AddressSearchOptions): Promise<AddressSearch> =>
					request('/address', { q: query, country: opts?.country, postal: opts?.postal, city: opts?.city, state: opts?.state, ip: opts?.ip }, undefined, opts),
			}
		),

		company: (number: string, opts?: CompanyOptions): Promise<Company> =>
			request(`/company/${enc(number)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),

		email: (email: string, opts?: EmailOptions): Promise<Email> => request(`/email/${enc(email)}`, deepQuery(opts), undefined, opts),

		vat: (
			number: string,
			opts?: VatOptions
		): Promise<Vat> =>
			request(`/vat/${enc(number)}`, {
				country: opts?.country,
				from: opts?.from,
				...deepQuery(opts),
			}, undefined, opts),

		iban: (iban: string, opts?: IbanOptions): Promise<Iban> =>
			request(`/iban/${enc(iban)}`, { country: opts?.country }, undefined, opts),

		npi: (npi: string, opts?: NpiOptions): Promise<Npi> =>
			request(`/npi/${enc(npi)}`, deepQuery(opts), undefined, opts),

		phone: (number: string, opts?: PhoneOptions): Promise<Phone> =>
			request(`/phone/${enc(number)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),

		carrier: (number: string, opts?: CarrierOptions): Promise<Carrier> =>
			request(`/carrier/${enc(number)}`, { country: opts?.country }, undefined, opts),

		caller: (number: string, opts?: CallerOptions): Promise<Caller> =>
			request(`/caller/${enc(number)}`, { country: opts?.country }, undefined, opts),

		hlr: (number: string, opts?: HlrOptions): Promise<Hlr> =>
			request(`/hlr/${enc(number)}`, { country: opts?.country }, undefined, opts),

		domain: (domain: string, opts?: DomainOptions): Promise<Domain> =>
			request(`/domain/${enc(domain)}`, deepQuery(opts), undefined, opts),

		asn: (asn: string, opts?: AsnOptions): Promise<Asn> => request(`/asn/${enc(asn)}`, undefined, undefined, opts),

		mac: (mac: string, opts?: MacOptions): Promise<Mac> => request(`/mac/${enc(mac)}`, undefined, undefined, opts),

		mx: (domain: string, opts?: MxOptions): Promise<Mx> => request(`/mx/${enc(domain)}`, undefined, undefined, opts),

		useragent: (ua: string, opts?: UseragentOptions): Promise<Useragent> =>
			request('/useragent', deepQuery(opts), { 'User-Agent': ua }, opts),

		vin: (vin: string, opts?: VinOptions): Promise<Vin> =>
			request(`/vin/${enc(vin)}`, deepQuery(opts), undefined, opts),

		tariff: Object.assign(
			(code: string, opts?: TariffOptions): Promise<Tariff> =>
				request(`/tariff/${enc(code)}`, { origin: opts?.origin, ...deepQuery(opts) }, undefined, opts),
			{
				search: (query: string, opts?: TariffSearchOptions): Promise<TariffSearch> => request('/tariff', { q: query }, undefined, opts),
			}
		),

		currency: Object.assign(
			(code: string, opts?: CurrencyOptions): Promise<Currency> => request(`/currency/${enc(code)}`, undefined, undefined, opts),
			{
				rate: (
					base: string,
					quote: string,
					opts?: CurrencyRateOptions
				): Promise<CurrencyRate> =>
					request(`/currency/${enc(base)}/${enc(quote)}`, {
						date: opts?.date,
						amount: opts?.amount,
					}, undefined, opts),
			}
		),

		language: (code: string, opts?: LanguageOptions): Promise<Language> => request(`/language/${enc(code)}`, undefined, undefined, opts),

		name: (name: string, opts?: NameOptions): Promise<Name> => request(`/name/${enc(name)}`, undefined, undefined, opts),

		timezone: Object.assign(
			(id: string, opts?: TimezoneOptions): Promise<Timezone> =>
				request(`/timezone/${enc(id)}`, { at: opts?.at, to: opts?.to }, undefined, opts),
			{
				at: (lat: number, lon: number, opts?: TimezoneAtOptions): Promise<Timezone> =>
					request('/timezone', { lat, lon, at: opts?.at }, undefined, opts),
			}
		),

		date: Object.assign(
			(date: string, opts?: DateOptions): Promise<DateInfo> =>
				request(`/date/${enc(date)}`, { format: opts?.format, to: opts?.to }, undefined, opts),
			{
				today: (opts?: DateTodayOptions): Promise<DateInfo> => request('/date', { to: opts?.to }, undefined, opts),
			}
		),

		holiday: Object.assign(
			(country: string, opts?: HolidayOptions): Promise<HolidayYear> =>
				request(`/holiday/${enc(country)}`, { year: opts?.year }, undefined, opts),
			{
				date: (country: string, date: string, opts?: HolidayDateOptions): Promise<HolidayDate> =>
					request(`/holiday/${enc(country)}/${enc(date)}`, undefined, undefined, opts),
			}
		),

		elevation: (lat: number, lon: number, opts?: ElevationOptions): Promise<Elevation> => request('/elevation', { lat, lon }, undefined, opts),

		point: (lat: number, lon: number, opts?: PointOptions): Promise<Point> =>
			request('/point', { lat, lon, ...deepQuery(opts) }, undefined, opts),

		weather: (lat: number, lon: number, opts?: WeatherOptions): Promise<Weather> =>
			request('/weather', { lat, lon, date: opts?.date, ...deepQuery(opts) }, undefined, opts),

		emoji: Object.assign(
			(emoji: string, opts?: EmojiOptions): Promise<Emoji> => request(`/emoji/${enc(emoji)}`, undefined, undefined, opts),
			{
				search: (query: string, opts?: EmojiSearchOptions): Promise<EmojiSearch> =>
					request('/emoji', { q: query, limit: opts?.limit }, undefined, opts),
			}
		),
	};
}

export type ParseAPIClient = ReturnType<typeof parseAPI>;
