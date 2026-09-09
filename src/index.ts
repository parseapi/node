import type {
	SwiftCode,
	Asn,
	Mac,
	Bin,
	Measure,
	MeasureUnits,
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
	Dns,
	Domain,
	Elevation,
	Email,
	Vat,
	Iban,
	Emoji,
	EmojiSearch,
	Hlr,
	Naics,
	NaicsSearch,
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
	Time,
	Useragent,
	Vin,
	Weather,
} from './types.js';

export * from './types.js';

const VERSION = '0.3.2';
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

/** IP enrichment is included with a paid plan. `deep` does not use a separate check meter. */
export type IpOptions = DeepOption & RequestOptions;
export type IpSelfOptions = DeepOption & RequestOptions;
export type ContinentOptions = RequestOptions;
export type ContinentCountriesOptions = RequestOptions;
export type BlocOptions = RequestOptions;
export type BlocCountriesOptions = RequestOptions;
export type CountryOptions = DeepOption & RequestOptions;
export type CountryStatesOptions = RequestOptions;
export type StateOptions = { country?: string } & DeepOption & RequestOptions;
export type StateDistrictsOptions = { country?: string } & DeepOption & RequestOptions;
export type DistrictOptions = { country?: string; state?: string } & DeepOption & RequestOptions;
export type CityOptions = { country?: string; state?: string } & DeepOption & RequestOptions;
export type CityIdOptions = DeepOption & RequestOptions;
export type CitySearchOptions = { country?: string; state?: string; limit?: number } & DeepOption & RequestOptions;
export type CityNearestOptions = DeepOption & RequestOptions;
export type CityNearbyOptions = { radius?: number; unit?: 'km' | 'mi'; country?: string; state?: string; limit?: number } & DeepOption & RequestOptions;
/** Pass country when known. Codes shared by multiple countries need it. */
export type PostalOptions = { country?: string } & DeepOption & RequestOptions;
export type PostalNearbyOptions = { country?: string; radius?: number; unit?: 'km' | 'mi' } & DeepOption & RequestOptions;
export type PostalDistanceOptions = { country?: string } & DeepOption & RequestOptions;
export type AddressOptions = { country?: string } & DeepOption & RequestOptions;
/** Address suggestions report why a result is empty. Operational failures remain errors. */
export type AddressSearchOptions = {
	/** Country scope. Pass the country known by the form. */
	country?: string;
	/** Postal-code scope from the form. */
	postal?: string;
	/** City scope, paired with state for US searches when no postal code is available. */
	city?: string;
	/** State scope for US searches. */
	state?: string;
	/** Actual end-user IP as an optional locality hint for server-side calls. */
	ip?: string;
} & RequestOptions;
export type CompanyOptions = { country?: string } & DeepOption & RequestOptions;
/** `deep: true` requests a metered deliverability check. No automatic retries by default. */
export type EmailOptions = DeepOption & RequestOptions;
/** `deep: true` requests a metered registry check where supported. `from` is your own VAT number. */
export type VatOptions = { country?: string; from?: string } & DeepOption & RequestOptions;
export type SwiftOptions = RequestOptions;
export type IbanOptions = { country?: string } & DeepOption & RequestOptions;
export type NpiOptions = DeepOption & RequestOptions;
/** Country resolves national-number ambiguity. Deep adds numbering-plan geography on every plan. */
export type PhoneOptions = { country?: string } & DeepOption & RequestOptions;
/** Deep discloses location detail within the same carrier unit. */
export type CarrierOptions = { country?: string } & DeepOption & RequestOptions;
export type CallerOptions = { country?: string } & RequestOptions;
/** Look up phone status at the last check. Live means assigned and connected means reachable at that check. Cached results may be returned. Null means unconfirmed. Deep adds network diagnostics within the same metered lookup. No automatic retries by default. */
export type HlrOptions = { country?: string } & DeepOption & RequestOptions;
export type DomainOptions = DeepOption & RequestOptions;
export type AsnOptions = RequestOptions;
export type MacOptions = RequestOptions;
/** Card-prefix reference lookup. Deep returns an empty object on every plan. */
export type BinOptions = DeepOption & RequestOptions;
/** Parse a measurement, optionally converting it. Locale and system resolve explicit ambiguity. */
export type MeasureOptions = { to?: string; locale?: string; system?: 'us' | 'imperial' } & RequestOptions;
export type MeasureUnitsOptions = { query?: string; type?: string; unit?: string } & RequestOptions;
/** Published DNS records. Omit type to check all ten supported types. Values retain DNS presentation syntax. */
export type DnsOptions = { type?: string } & RequestOptions;
export type MxOptions = RequestOptions;
export type UseragentOptions = DeepOption & RequestOptions;
export type VinOptions = DeepOption & RequestOptions;
/** US NAICS 2022 code lookup, using pooled requests. */
export type NaicsOptions = DeepOption & RequestOptions;
/** Keyword search. Limit defaults to 10 and accepts 1-50. */
export type NaicsSearchOptions = { limit?: number } & DeepOption & RequestOptions;
/** Look up the general US duty schedule line. Paid deep adds units and the special and other schedule columns. Add origin with deep to resolve country-specific measures. Without origin, schedule detail remains available and origin-dependent fields are null. A null effective rate is not a zero rate. */
export type TariffOptions = {
	/** Origin country (ISO2). With paid deep, resolves country-specific measures. */
	origin?: string;
} & DeepOption & RequestOptions;
export type TariffSearchOptions = RequestOptions;
export type CurrencyOptions = DeepOption & RequestOptions;
export type CurrencyRateOptions = { date?: string; amount?: number } & RequestOptions;
export type LanguageOptions = DeepOption & RequestOptions;
/** Country is an ISO2 context for paid deep name evidence. */
export type NameOptions = { country?: string } & DeepOption & RequestOptions;
export type TimeOptions = { at?: string; to?: string } & DeepOption & RequestOptions;
export type TimeAtOptions = { at?: string; to?: string } & DeepOption & RequestOptions;
export type TimezoneOptions = { at?: string; to?: string } & DeepOption & RequestOptions;
export type TimezoneAtOptions = { at?: string } & DeepOption & RequestOptions;
export type DateOptions = { format?: 'mdy' | 'dmy'; to?: string } & DeepOption & RequestOptions;
export type DateTodayOptions = { to?: string } & DeepOption & RequestOptions;
export type HolidayOptions = { year?: number } & RequestOptions;
export type HolidayDateOptions = RequestOptions;
export type ElevationOptions = RequestOptions;
/** Resolve the country, state, district and timezone at coordinates. Deep adds terrain and compact nearest-city context on every plan. The timezone ID stays in core. The nearest city is null when none is within 200 km. */
export type PointOptions = DeepOption & RequestOptions;
/** Get current conditions in metric and imperial units. Paid deep adds specialist current measurements, forecasts and related detail. With deep, date selects a past UTC day (YYYY-MM-DD) in deep.history alongside current conditions. Date alone does not request history. */
export type WeatherOptions = DeepOption & {
	/** Past UTC day, YYYY-MM-DD. Requires paid deep and populates deep.history alongside current. */
	date?: string;
} & RequestOptions;
export type EmojiOptions = DeepOption & RequestOptions;
export type EmojiSearchOptions = { limit?: number } & DeepOption & RequestOptions;

interface DeepOption {
	/** Request endpoint-specific enrichment. Email/VAT checks are metered. Reference depth can be pooled or included with a paid plan. See the operation's help. */
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
		/** Look up an IP. `deep: true` adds enrichment included with a paid plan, without a separate check meter. */
		ip: Object.assign(
			(ip: string, opts?: IpOptions): Promise<Ip> => request(`/ip/${enc(ip)}`, deepQuery(opts), undefined, opts),
			{
				/** Look up the public IP making this request. On a server, this is the server's IP. */
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
			(code: string, opts?: CountryOptions): Promise<Country> => request(`/country/${enc(code)}`, deepQuery(opts), undefined, opts),
			{
				states: (code: string, opts?: CountryStatesOptions): Promise<CountryStates> => request(`/country/${enc(code)}/states`, undefined, undefined, opts),
			}
		),

		state: Object.assign(
			(code: string, opts?: StateOptions): Promise<State> =>
				request(`/state/${enc(code)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),
			{
				districts: (code: string, opts?: StateDistrictsOptions): Promise<StateDistricts> =>
					request(`/state/${enc(code)}/districts`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),
			}
		),

		district: (code: string, opts?: DistrictOptions): Promise<District> =>
			request(`/district/${enc(code)}`, { country: opts?.country, state: opts?.state, ...deepQuery(opts) }, undefined, opts),

		city: Object.assign(
			(name: string, opts?: CityOptions): Promise<City> =>
				request(`/city/${enc(name)}`, { country: opts?.country, state: opts?.state, ...deepQuery(opts) }, undefined, opts),
			{
				id: (id: string, opts?: CityIdOptions): Promise<City> => request(`/city/id/${enc(id)}`, deepQuery(opts), undefined, opts),
				search: (query: string, opts?: CitySearchOptions): Promise<CitySearch> =>
					request('/city', { q: query, country: opts?.country, state: opts?.state, limit: opts?.limit, ...deepQuery(opts) }, undefined, opts),
				nearest: (lat: number, lon: number, opts?: CityNearestOptions): Promise<CityNearest> => request('/city', { lat, lon, ...deepQuery(opts) }, undefined, opts),
				nearby: (
					name: string,
					opts?: CityNearbyOptions
				): Promise<CityNearby> =>
					request(`/city/${enc(name)}/nearby`, {
						radius: opts?.radius,
						unit: opts?.unit,
						country: opts?.country,
						state: opts?.state,
						limit: opts?.limit, ...deepQuery(opts) }, undefined, opts),
			}
		),

		/** Look up a postal area. Pass country when known. Check nullable latitude/longitude before another location lookup. */
		postal: Object.assign(
			(code: string, opts?: PostalOptions): Promise<Postal> =>
				request(`/postal/${enc(code)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),
			{
				nearby: (
					code: string,
					opts?: PostalNearbyOptions
				): Promise<PostalNearby> =>
					request(`/postal/${enc(code)}/nearby`, {
						country: opts?.country,
						radius: opts?.radius,
						unit: opts?.unit, ...deepQuery(opts) }, undefined, opts),
				distance: (from: string, to: string, opts?: PostalDistanceOptions): Promise<PostalDistance> =>
					request(`/postal/${enc(from)}/distance/${enc(to)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),
			}
		),

		address: Object.assign(
			(address: string, opts?: AddressOptions): Promise<Address> =>
				request(`/address/${enc(address)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),
			{
				/** Find address suggestions using the context supplied. Prefer postal, or city and state, from the form. ip is an optional end-user locality hint for server-side calls. An empty result has reason more_input, missing_context or no_matches. Suggestions have reason null. Operational failures are errors. */
				search: (query: string, opts?: AddressSearchOptions): Promise<AddressSearch> =>
					request('/address', { q: query, country: opts?.country, postal: opts?.postal, city: opts?.city, state: opts?.state, ip: opts?.ip }, undefined, opts),
			}
		),

		company: (number: string, opts?: CompanyOptions): Promise<Company> =>
			request(`/company/${enc(number)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),

		/**
		 * Parse an email and check its format and domain.
		 * `deep: true` explicitly requests a metered deliverability check using included checks or enabled on-demand usage.
		 * Deep checks default to one attempt. An explicit retry count can repeat paid usage.
		 */
		email: (email: string, opts?: EmailOptions): Promise<Email> => request(`/email/${enc(email)}`, deepQuery(opts), undefined, opts),

		/** Check VAT format and checksum. `deep: true` requests a metered registry check where supported, with no automatic retries by default. */
		vat: (
			number: string,
			opts?: VatOptions
		): Promise<Vat> =>
			request(`/vat/${enc(number)}`, {
				country: opts?.country,
				from: opts?.from,
				...deepQuery(opts),
			}, undefined, opts),

		/** Check BIC syntax and look up a known institution. A null name means unknown, not invalid. */
		swift: (code: string, opts?: SwiftOptions): Promise<SwiftCode> => request(`/swift/${enc(code)}`, undefined, undefined, opts),
		iban: (iban: string, opts?: IbanOptions): Promise<Iban> =>
			request(`/iban/${enc(iban)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),

		npi: (npi: string, opts?: NpiOptions): Promise<Npi> =>
			request(`/npi/${enc(npi)}`, deepQuery(opts), undefined, opts),

		/** Parse a phone number and its formats. Pass country for national numbers when needed. Deep adds numbering-plan geography. */
		phone: (number: string, opts?: PhoneOptions): Promise<Phone> =>
			request(`/phone/${enc(number)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),

		/** Request a metered carrier lookup. No automatic retries by default. */
		carrier: (number: string, opts?: CarrierOptions): Promise<Carrier> =>
			request(`/carrier/${enc(number)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),

		/** Request a metered caller-name lookup for a NANP number. No automatic retries by default. */
		caller: (number: string, opts?: CallerOptions): Promise<Caller> =>
			request(`/caller/${enc(number)}`, { country: opts?.country }, undefined, opts),

		/** Look up phone status at the last check. Live means assigned and connected means reachable at that check. Cached results may be returned. Null means unconfirmed. Deep adds network diagnostics within the same metered lookup. No automatic retries by default. */
		hlr: (number: string, opts?: HlrOptions): Promise<Hlr> =>
			request(`/hlr/${enc(number)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),

		/** Check whether a domain is registered. Deep adds registration dates, registrar, status and DNSSEC on paid plans. */
		domain: (domain: string, opts?: DomainOptions): Promise<Domain> =>
			request(`/domain/${enc(domain)}`, deepQuery(opts), undefined, opts),

		asn: (asn: string, opts?: AsnOptions): Promise<Asn> => request(`/asn/${enc(asn)}`, undefined, undefined, opts),

		mac: (mac: string, opts?: MacOptions): Promise<Mac> => request(`/mac/${enc(mac)}`, undefined, undefined, opts),

		/** Look up a 6-11 digit card prefix. Keep leading zeros in the input string. */
		bin: (bin: string, opts?: BinOptions): Promise<Bin> =>
			request(`/bin/${enc(bin)}`, { deep: opts?.deep }, undefined, opts),

		/** Parse a measurement or convert it to `to`. Without `to`, use its type's canonical unit. Invalid input is plain data with `valid: false`. */
		measure: Object.assign(
			(measure: string, opts?: MeasureOptions): Promise<Measure> =>
				request(`/measure/${enc(measure)}`, { to: opts?.to, locale: opts?.locale, system: opts?.system }, undefined, opts),
			{
				/** Discover reviewed units. Pass `unit` to find compatible conversion targets. */
				units: (opts?: MeasureUnitsOptions): Promise<MeasureUnits> =>
					request('/measure/units', { q: opts?.query, type: opts?.type, unit: opts?.unit }, undefined, opts),
			}
		),

		/** Look up DNS records with TTLs. Type selects the question and may include its CNAME chain. Pooled on every plan. */
		dns: (domain: string, opts?: DnsOptions): Promise<Dns> =>
			request(`/dns/${enc(domain)}`, { type: opts?.type }, undefined, opts),

		mx: (domain: string, opts?: MxOptions): Promise<Mx> => request(`/mx/${enc(domain)}`, undefined, undefined, opts),

		useragent: (ua: string, opts?: UseragentOptions): Promise<Useragent> =>
			request('/useragent', deepQuery(opts), { 'User-Agent': ua }, opts),

		vin: (vin: string, opts?: VinOptions): Promise<Vin> =>
			request(`/vin/${enc(vin)}`, deepQuery(opts), undefined, opts),

		/** US NAICS 2022 definitions and hierarchy. */
		naics: Object.assign(
			(code: string, opts?: NaicsOptions): Promise<Naics> => request(`/naics/${enc(code)}`, deepQuery(opts), undefined, opts),
			{
				search: (query: string, opts?: NaicsSearchOptions): Promise<NaicsSearch> =>
					request('/naics', { q: query, limit: opts?.limit, ...deepQuery(opts) }, undefined, opts),
			}
		),
		/** Look up the general US duty schedule line. Paid deep adds units and the special and other schedule columns. Add origin with deep to resolve country-specific measures. Without origin, schedule detail remains available and origin-dependent fields are null. A null effective rate is not a zero rate. */
		tariff: Object.assign(
			(code: string, opts?: TariffOptions): Promise<Tariff> =>
				request(`/tariff/${enc(code)}`, { origin: opts?.origin, ...deepQuery(opts) }, undefined, opts),
			{
				search: (query: string, opts?: TariffSearchOptions): Promise<TariffSearch> => request('/tariff', { q: query }, undefined, opts),
			}
		),

		currency: Object.assign(
			(code: string, opts?: CurrencyOptions): Promise<Currency> => request(`/currency/${enc(code)}`, deepQuery(opts), undefined, opts),
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

		language: (code: string, opts?: LanguageOptions): Promise<Language> => request(`/language/${enc(code)}`, deepQuery(opts), undefined, opts),

		name: (name: string, opts?: NameOptions): Promise<Name> => request(`/name/${enc(name)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),

		/** Current local time, UTC by default. With to, offsetless at is source wall time. */
		time: Object.assign(
			(timezone?: string, opts?: TimeOptions): Promise<Time> =>
				request(timezone === undefined ? '/time' : `/time/${enc(timezone)}`, { at: opts?.at, to: opts?.to, ...deepQuery(opts) }, undefined, opts),
			{
				at: (lat: number, lon: number, opts?: TimeAtOptions): Promise<Time> =>
					request('/time', { lat, lon, at: opts?.at, to: opts?.to, ...deepQuery(opts) }, undefined, opts),
			}
		),

		timezone: Object.assign(
			(id: string, opts?: TimezoneOptions): Promise<Timezone> =>
				request(`/timezone/${enc(id)}`, { at: opts?.at, to: opts?.to, ...deepQuery(opts) }, undefined, opts),
			{
				at: (lat: number, lon: number, opts?: TimezoneAtOptions): Promise<Timezone> =>
					request('/timezone', { lat, lon, at: opts?.at, ...deepQuery(opts) }, undefined, opts),
			}
		),

		date: Object.assign(
			(date: string, opts?: DateOptions): Promise<DateInfo> =>
				request(`/date/${enc(date)}`, { format: opts?.format, to: opts?.to, ...deepQuery(opts) }, undefined, opts),
			{
				today: (opts?: DateTodayOptions): Promise<DateInfo> => request('/date', { to: opts?.to, ...deepQuery(opts) }, undefined, opts),
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

		/** Resolve the country, state, district and timezone at coordinates. Deep adds terrain and compact nearest-city context on every plan. The timezone ID stays in core. The nearest city is null when none is within 200 km. */
		point: (lat: number, lon: number, opts?: PointOptions): Promise<Point> =>
			request('/point', { lat, lon, ...deepQuery(opts) }, undefined, opts),

		/** Get current conditions in metric and imperial units. Paid deep adds specialist current measurements, forecasts and related detail. With deep, date selects a past UTC day (YYYY-MM-DD) in deep.history alongside current conditions. Date alone does not request history. */
		weather: (lat: number, lon: number, opts?: WeatherOptions): Promise<Weather> =>
			request('/weather', { lat, lon, date: opts?.date, ...deepQuery(opts) }, undefined, opts),

		emoji: Object.assign(
			(emoji: string, opts?: EmojiOptions): Promise<Emoji> => request(`/emoji/${enc(emoji)}`, deepQuery(opts), undefined, opts),
			{
				search: (query: string, opts?: EmojiSearchOptions): Promise<EmojiSearch> =>
					request('/emoji', { q: query, limit: opts?.limit, ...deepQuery(opts) }, undefined, opts),
			}
		),
	};
}

export type ParseAPIClient = ReturnType<typeof parseAPI>;
