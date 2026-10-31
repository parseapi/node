export * from './bulk.js';
import type { Bin, Asn, Card, Address, AddressSearch, Company, CompanyProfile, CompanySearch, CompanyCoverage, Caller, Carrier, City, CityNearby, CityNearest, CitySearch, Continent, ContinentCountries, Country, CountryStates, DateInfo, District, Dns, Stack, Domain, Elevation, ElevationLocations, Email, Emoji, EmojiSearch, EmojiBrowse, EmojiCategories, EmojiParse, EmojiConversion, EmojiCatalogData, EmojiMetadata, Hlr, Industry, IndustrySearch, HolidayDate, HolidayYear, Ip, Language, Mx, Name, Phone, Point, Postal, PostalDistance, PostalNearby, State, StateDistricts, Timezone, Time, TimeZones, Useragent, Weather, CityGrain, CityResource, CityCollection, CityRelations, CityDistance, CityAmbiguityCandidate, CityList, CityNearbyCoordinates } from './types.js';
import { ParseAPIError } from './errors.js';
export { ParseAPIError } from './errors.js';
import type { Preflight, PreflightTask } from './preflight.js';
import type { AgentTask, AgentTaskInput, AgentTaskLookupInput, AgentTaskResult } from './task.js';

export * from './types.js';
export type { DomainResult, DomainResultDeep, DomainRegistrationResult, StackResult } from './response-results.js';
import type { DomainResult } from './response-results.js';
export * from './emoji-catalog.js';
export * from './preflight.js';
export * from './task.js';

const VERSION = '1.12.6';
const API_VERSION = '2.0.0';
const DEFAULT_BASE_URL = 'https://api.parseapi.com';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_AFTER_CAP_MS = 5_000;

/** Optional output language for supported display fields. Input parsing stays unchanged. */
export interface LanguageOption {
	lang?: string;
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
	/** Per-attempt timeout in milliseconds. Defaults to 35000 for Stack and 10000 otherwise. An explicit value applies to every operation. */
	timeoutMs?: number;
	/** Retries after the first attempt on network errors / 429 / 5xx. Default 2 for ordinary calls, 0 for paid checks. An explicit count overrides both. */
	retries?: number;
	/** Custom fetch implementation (instrumentation, proxies). */
	fetch?: typeof fetch;
}

/** IP enrichment is included with a paid plan. `deep` does not use a separate check meter. */
export type IpOptions = LanguageOption & DeepOption & RequestOptions;
export type IpSelfOptions = LanguageOption & DeepOption & RequestOptions;
export type ContinentOptions = LanguageOption & RequestOptions;
export type ContinentCountriesOptions = LanguageOption & RequestOptions;
export type CountryOptions = LanguageOption & DeepOption & RequestOptions;
export type CountryStatesOptions = LanguageOption & RequestOptions;
export type StateOptions = LanguageOption & { country?: string } & DeepOption & RequestOptions;
export type StateDistrictsOptions = LanguageOption & { country?: string } & DeepOption & RequestOptions;
export type DistrictOptions = LanguageOption & { country?: string; state?: string } & DeepOption & RequestOptions;
export type CityOptions = LanguageOption & CityScopeOptions & CityResponseOptions & { format?: 'resource'; aliases?: boolean; ambiguity?: 'error' } & DeepOption & RequestOptions;
export type CityIdOptions = LanguageOption & CityResponseOptions & { format?: 'resource'; hierarchy?: boolean } & DeepOption & RequestOptions;
export type CitySearchOptions = LanguageOption & CityScopeOptions & CityCollectionFilters & CityPagingOptions & CityResponseOptions & { format?: 'list'; aliases?: boolean; limit?: number; sort?: CitySort; match?: 'exact' | 'prefix' | 'fuzzy'; maxDistance?: 1 | 2 } & DeepOption & RequestOptions;
export type CityNearestOptions = LanguageOption & CityScopeOptions & CityResponseOptions & { format?: 'resource' } & DeepOption & RequestOptions;
export type CityNearbyOptions = LanguageOption & CityScopeOptions & CityCollectionFilters & CityPagingOptions & CityResponseOptions & { format?: 'list'; aliases?: boolean; ambiguity?: 'error'; radius?: number; unit?: 'km' | 'mi'; limit?: number; sort?: CitySort } & DeepOption & RequestOptions;
/** Pass country when known. Codes shared by multiple countries need it. */
export type PostalOptions = LanguageOption & { country?: string } & DeepOption & RequestOptions;
export type PostalNearbyOptions = LanguageOption & { country?: string; radius?: number; unit?: 'km' | 'mi' } & DeepOption & RequestOptions;
export type PostalDistanceOptions = LanguageOption & { country?: string } & DeepOption & RequestOptions;
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
export type CompanyOptions = LanguageOption & { country?: string } & DeepOption & RequestOptions;
/** Refetch a directory company by its stable co_ ID. */
export type CompanyIdOptions = DeepOption & RequestOptions;
/** Choose at most one selector, or discover by country, exact industry. The API validates filters and cursors. */
export type CompanySearchOptions = {
	/** Company name search. Sent as q. */
	query?: string;
	domain?: string;
	ticker?: string;
	identifier?: string;
	/** ISO2 country filter. */
	country?: string;
	/** Exact four-digit SIC code string, preserving leading zeros. Requires industry_type. */
	industry?: string;
	/** Industry namespace; currently sic. Requires industry. */
	industry_type?: string;
	/** Exchange filter for ticker searches. */
	exchange?: string;
	/** Issuing authority filter for identifier searches. */
	authority?: string;
	limit?: number;
	/** Opaque next-page cursor. Keep the same selector and filters. */
	cursor?: string;
} & DeepOption & RequestOptions;
export type CompanyCoverageOptions = RequestOptions;
/** `deep: true` requests a metered deliverability check. No automatic retries by default. */
export type EmailOptions = DeepOption & RequestOptions;
/** Country resolves national-number ambiguity. Deep adds numbering-plan geography on every plan. */
export type PhoneOptions = { country?: string } & DeepOption & RequestOptions;
/** Deep discloses location detail within the same carrier unit. */
export type CarrierOptions = { country?: string } & DeepOption & RequestOptions;
export type CallerOptions = { country?: string } & RequestOptions;
/** Look up phone status at the last check. Live means assigned and connected means reachable at that check. Cached results may be returned. Null means unconfirmed. Deep adds network diagnostics within the same metered lookup. No automatic retries by default. */
export type HlrOptions = { country?: string } & DeepOption & RequestOptions;
/** Public website hostname only. Optional formatting and request controls. */
export type StackOptions = { pretty?: boolean } & DeepOption & RequestOptions;
export type DomainOptions = DeepOption & RequestOptions;
export type AsnOptions = LanguageOption & RequestOptions;
/** Request controls for a card-prefix reference lookup. */
export type CardOptions = DeepOption & RequestOptions;
/** Published DNS records. Omit type to check all ten supported types. Values retain DNS presentation syntax. */
export type DnsOptions = { type?: string } & RequestOptions;
export type MxOptions = RequestOptions;
export type UseragentOptions = DeepOption & RequestOptions;
/** US NAICS 2022 code lookup, using pooled requests. */
export type IndustryOptions = DeepOption & RequestOptions;
/** Keyword search. Limit defaults to 10 and accepts 1-50. */
export type IndustrySearchOptions = { limit?: number } & DeepOption & RequestOptions;
export type LanguageOptions = LanguageOption & DeepOption & RequestOptions;
/** Country scopes paid deep gender evidence. Name locale selects formatting rules without changing parsing. */
export type NameOptions = {
	country?: string;
	/** CLDR name-formatting locale, such as en or ja. Defaults to en. */
	name_locale?: string;
} & DeepOption & RequestOptions;
/** Local time or same-instant conversion. Optional reference detail is pooled on every plan. */
export type TimeOptions = LanguageOption & {
	ip?: string;
	city?: string;
	country?: string;
	state?: string;
	iata?: string;
	icao?: string;
	unlocode?: string;
	address?: string;

	/** ISO timestamp. With to or targets, an offsetless value is source wall time. Otherwise it is UTC. */
	at?: string;
	/** Destination IANA timezone. The target has the same unix instant. */
	to?: string;
	/** One to ten destination IDs, preserving order and duplicates. Use instead of to. */
	targets?: readonly string[];
	/** Offsetless conversion clock changes: compatible (default), earlier, later, or reject. Explicit offsets select the instant directly. */
	disambiguation?: 'compatible' | 'earlier' | 'later' | 'reject';
} & DeepOption & RequestOptions;
/** Local time or same-instant conversion. Optional reference detail is pooled on every plan. */
export type TimeAtOptions = LanguageOption & {
	/** ISO timestamp. With to or targets, an offsetless value is source wall time. Otherwise it is UTC. */
	at?: string;
	/** Destination IANA timezone. The target has the same unix instant. */
	to?: string;
	/** One to ten destination IDs, preserving order and duplicates. Use instead of to. */
	targets?: readonly string[];
	/** Offsetless conversion clock changes: compatible (default), earlier, later, or reject. Explicit offsets select the instant directly. */
	disambiguation?: 'compatible' | 'earlier' | 'later' | 'reject';
} & DeepOption & RequestOptions;
/** Filter supported identifiers at one instant. Abbreviations return candidates, never an inferred zone. */
export type TimeZonesOptions = {
	country?: string;
	area?: string;
	/** Exact signed UTC offset, such as +05:45 or +00:09:21. */
	offset?: string;
	abbreviation?: string;
	dst?: boolean;
	/** Whether a DST-flagged state occurs in the UTC calendar year containing at. */
	observes_dst?: boolean;
	at?: string;
	details?: boolean;
	sort?: 'timezone' | 'offset';
} & RequestOptions;
export type TimezoneOptions = LanguageOption & { at?: string; to?: string } & DeepOption & RequestOptions;
export type TimezoneAtOptions = LanguageOption & { at?: string } & DeepOption & RequestOptions;
export type DateOptions = LanguageOption & { format?: 'mdy' | 'dmy'; to?: string } & DeepOption & RequestOptions;
export type DateTodayOptions = LanguageOption & { to?: string } & DeepOption & RequestOptions;
export type HolidayOptions = { year?: number } & RequestOptions;
export type HolidayDateOptions = RequestOptions;
export type ElevationOptions = RequestOptions;
/** Resolve the country, state, district and timezone at coordinates. Deep adds terrain and compact nearest-city context on every plan. The timezone ID stays in core. The nearest city is null when none is within 200 km. */
export type PointOptions = LanguageOption & DeepOption & RequestOptions;
/** Get current conditions in metric and imperial units. Paid deep adds specialist current measurements, forecasts and related detail. With deep, date selects a past UTC day (YYYY-MM-DD) in deep.history alongside current conditions. Date alone does not request history. */
export type WeatherOptions = DeepOption & {
	/** Past UTC day, YYYY-MM-DD. Requires paid deep and populates deep.history alongside current. */
	date?: string;
} & RequestOptions;
export type EmojiOptions = LanguageOption & { shortcodeSource?: string } & DeepOption & RequestOptions;
export type EmojiSearchOptions = LanguageOption & {
	limit?: number;
	category?: string;
	subcategory?: string;
	version?: string;
	maxVersion?: string;
	includeSkinTones?: boolean;
	offset?: number;
} & DeepOption & RequestOptions;
/** Complete catalog download; Deep defaults true. JSON supports offline EmojiCatalog. */
export type EmojiCatalogOptions = Omit<EmojiSearchOptions, 'limit' | 'offset'> & { profile?: 'full' | 'compact' };
export type EmojiBrowseOptions = EmojiSearchOptions;
export type EmojiParseOptions = LanguageOption & DeepOption & RequestOptions;
export type EmojiConvertOptions = RequestOptions & { direction: 'to_shortcodes' | 'to_emoji'; shortcodeSource: 'cldr' | 'github' | 'slack' | 'discord' };

interface DeepOption {
	/** Request endpoint-specific enrichment. Email checks are metered. Reference depth can be pooled or included with a paid plan. See the operation's help. */
	deep?: boolean;
}

type Query = Record<string, string | number | boolean | undefined>;

const requestControls = (opts?: RequestOptions): RequestOptions => ({ signal: opts?.signal, timeoutMs: opts?.timeoutMs, retries: opts?.retries });

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

// Null means the server's requested wait exceeds our automatic retry budget.
function retryDelayMs(attempt: number, retryAfter: string | null): number | null {
	if (retryAfter) {
		const value = retryAfter.trim();
		if (/^[0-9]+(?:\.[0-9]+)?$/.test(value)) {
			const seconds = Number(value);
			return seconds > RETRY_AFTER_CAP_MS / 1000 ? null : seconds * 1000;
		}
		if (/^[A-Za-z]{3,9},? /.test(value)) {
			const date = Date.parse(value);
			if (Number.isFinite(date)) {
				const delay = Math.max(date - Date.now(), 0);
				return delay > RETRY_AFTER_CAP_MS ? null : delay;
			}
		}
	}
	return Math.random() * Math.min(250 * 2 ** Math.min(attempt, 16), RETRY_AFTER_CAP_MS);
}

export function parseAPI(apiKey?: string, options: ParseAPIOptions = {}) {
	/*! You found Dev. https://parseapi.com/dev */
	const key = apiKey || env('PARSEAPI_KEY');
	if (!key) {
		throw new Error('parseAPI: missing API key. Pass one or set PARSEAPI_KEY.');
	}

	const baseUrl = (options.baseUrl ?? env('PARSEAPI_BASE_URL') ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
	const configuredTimeoutMs = options.timeoutMs;
	const timeoutMs = configuredTimeoutMs ?? DEFAULT_TIMEOUT_MS;
	const configuredRetries = options.retries;
	validateTimeout(timeoutMs);
	validateRetries(configuredRetries);
	const doFetch = options.fetch ?? fetch;

	async function request<T>(path: string, query?: Query, headers?: Record<string, string>, controls: RequestOptions & LanguageOption = {}, json?: unknown): Promise<T> {
		const signal = controls.signal;
		signal?.throwIfAborted();
		const attemptTimeout = controls.timeoutMs ?? configuredTimeoutMs ?? (path.startsWith('/stack/') ? 35000 : timeoutMs);
		const retries = controls.retries ?? configuredRetries ?? (metered(path, query) ? 0 : DEFAULT_RETRIES);
		validateTimeout(attemptTimeout);
		validateRetries(retries);
		const body = json === undefined ? undefined : JSON.stringify(json);
		const url = new URL(baseUrl + path);
		if (controls.lang !== undefined) url.searchParams.set('lang', controls.lang);
		for (const [name, value] of Object.entries(query ?? {})) {
			if (value !== undefined) url.searchParams.set(name, String(value));
		}

		for (let attempt = 0; ; attempt++) {
			signal?.throwIfAborted();
			const controller = new AbortController();
			const onAbort = () => controller.abort(signal!.reason);
			signal?.addEventListener('abort', onAbort, { once: true });
			const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), attemptTimeout);
			let retryDelay: number | null | undefined;
			try {
				let res: Response | undefined;
				try {
					res = await doFetch(url, {
						redirect: 'manual',
						...(body === undefined ? {} : { method: 'POST', body }),
						headers: { 'X-API-Key': key!, 'User-Agent': `parseapi-node/${VERSION}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers, 'Parse-Version': API_VERSION },
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
				if (res) retryDelay = retryDelayMs(attempt, res.headers.get('Retry-After'));
				if (res && RETRY_STATUS.has(res.status) && attempt < retries && retryDelay !== null) {
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
					const error = new ParseAPIError(
						res.status,
						typeof body.code === 'string' ? body.code : 'unknown_error',
						typeof body.message === 'string' ? body.message : `Request failed with status ${res.status}`,
						typeof body.docs === 'string' ? body.docs : null,
						typeof body.request_id === 'string' ? body.request_id : null,
						res.headers.get('Retry-After')
					);
					if (error.status === 409 && error.code === 'ambiguous_city') {
						const candidates = cityErrorCandidates(body.candidates);
						if (candidates) error.candidates = candidates;
					}
					throw error;
				}
			} finally {
				clearTimeout(timer);
				signal?.removeEventListener('abort', onAbort);
			}
			await sleep(retryDelay ?? retryDelayMs(attempt, null)!, signal);
		}
	}

	const enc = encodeURIComponent;
	const deepQuery = (opts?: DeepOption): Query => (opts?.deep ? { deep: true } : {});


	function elevationSamples(selector: 'points' | 'path', coordinates: Array<[number, number]> | string, opts?: ElevationOptions, samples?: number): Promise<ElevationLocations> {
		const value = typeof coordinates === 'string' ? coordinates : coordinates.map(([lat, lon]) => `${lat},${lon}`).join('|');
		// The query grammar uses plain decimals. JSON preserves small numeric
		// coordinates that JavaScript serializes with exponent notation.
		const numericJson = typeof coordinates !== 'string' && coordinates.some(point => point.some(value => /e/i.test(String(value))));
		const sampling = samples === undefined ? {} : { samples };
		const query = { [selector]: value, ...sampling };
		const url = new URL(baseUrl + '/elevation');
		for (const [name, value] of Object.entries(query)) url.searchParams.set(name, String(value));
		return !numericJson && url.href.length <= 8000
			? request('/elevation', query, undefined, opts)
			: request('/elevation', undefined, undefined, opts, { [selector]: coordinates, ...sampling });
	}

	const industry = Object.assign(
			(code: string, opts?: IndustryOptions): Promise<Industry> => request(`/industry/${enc(code)}`, deepQuery(opts), undefined, opts),
			{
				search: (query: string, opts?: IndustrySearchOptions): Promise<IndustrySearch> =>
					request('/industry', { q: query, limit: opts?.limit, ...deepQuery(opts) }, undefined, opts),
			}
		);

	return {
		/** Create a bounded task. Reuse the same request ID and inputs on retries. */
		task: Object.assign(
			(input: AgentTaskInput, requestId: string, opts?: RequestOptions): Promise<AgentTask> =>
				request('/task', undefined, { 'Idempotency-Key': requestId }, opts, input),
			{
				get: (id: string, opts?: RequestOptions): Promise<AgentTask> => request(`/task/${enc(id)}`, undefined, undefined, opts),
				cancel: (id: string, opts?: RequestOptions): Promise<AgentTask> => request(`/task/${enc(id)}/cancel`, undefined, undefined, opts, {}),
				/** Reuse requestId with identical inputs to recover the saved result without another lookup or charge. */
				lookup: <T = unknown>(id: string, input: AgentTaskLookupInput, requestId: string, opts?: RequestOptions): Promise<AgentTaskResult<T>> =>
					request(`/task/${enc(id)}/lookup`, undefined, { 'Idempotency-Key': requestId }, opts, input),
			}
		),
		/** Estimate task access, capacity and additional charges. Requires a secret key. Reserves no units or money and does not enforce the supplied budget. */
		preflight: (task: PreflightTask, opts?: RequestOptions): Promise<Preflight> =>
			request('/preflight', undefined, undefined, opts, task),

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
			((name: string, opts?: CityOptions): Promise<City> =>
				request(`/city/${enc(name)}`, { ...cityScopeQuery(opts), ...cityResponseQuery(opts), aliases: opts?.aliases ? 'true' : undefined, ambiguity: opts?.ambiguity, ...deepQuery(opts) }, undefined, opts)) as CityLookupCall,
			{
				id: ((id: string, opts?: CityIdOptions): Promise<City> => request(`/city/id/${enc(id)}`, { hierarchy: opts?.hierarchy ? 'true' : undefined, ...cityResponseQuery(opts), ...deepQuery(opts) }, undefined, opts)) as CityIdCall,
				search: (async (query: string, opts?: CitySearchOptions): Promise<CitySearch | CityCollection> => {
					const spelling = opts?.match !== undefined || opts?.maxDistance !== undefined;
					const result = await request<CitySearch | CityCollection>(spelling ? '/city/search' : '/city', { q: query, match: opts?.match, max_distance: opts?.maxDistance, ...cityScopeQuery(opts), ...cityCollectionQuery(opts), ...cityResponseQuery(opts), aliases: opts?.aliases ? 'true' : undefined, limit: opts?.limit, ...deepQuery(opts) }, undefined, opts);
					if (spelling && opts?.format !== 'list') {
						const list = result as CityCollection;
						return { q: query, ...(opts?.country ? { country: opts.country } : {}), ...(opts?.state ? { state: opts.state } : {}), cities: list.data, next_cursor: list.next_cursor };
					}
					return result;
				}) as CitySearchCall,
				/** Canonical list resource. Reuse next_cursor with exactly the same options. */
				list: (opts?: CityListOptions): Promise<CityList> => request('/city', { browse: 'true', ...cityScopeQuery(opts), ...cityCollectionQuery(opts), ...cityResponseQuery(opts), format: 'list', limit: opts?.limit, ...deepQuery(opts) }, undefined, opts),
				nearbyCoordinates: (lat: number, lon: number, opts?: CityNearbyCoordinatesOptions): Promise<CityNearbyCoordinates> => request('/city', {
					lat, lon, nearby: 'true', radius: opts?.radius, unit: opts?.unit,
					...cityScopeQuery(opts), ...cityCollectionQuery(opts), ...cityResponseQuery(opts), format: 'list', limit: opts?.limit, ...deepQuery(opts),
				}, undefined, opts),
				nearest: ((lat: number, lon: number, opts?: CityNearestOptions): Promise<CityNearest> => request('/city', { lat, lon, ...cityScopeQuery(opts), ...cityResponseQuery(opts), ...deepQuery(opts) }, undefined, opts)) as CityNearestCall,
				nearby: ((name: string, opts?: CityNearbyOptions): Promise<CityNearby | CityCollection> =>
					request(`/city/${enc(name)}/nearby`, {
						radius: opts?.radius, unit: opts?.unit, ...cityScopeQuery(opts), ...cityCollectionQuery(opts), ...cityResponseQuery(opts),
						aliases: opts?.aliases ? 'true' : undefined, ambiguity: opts?.ambiguity, limit: opts?.limit, ...deepQuery(opts) }, undefined, opts)) as CityNearbyCall,
				/** Reviewed immediate children; coverage is partial. */
				children: (id: string, opts?: CityRelationsOptions): Promise<CityRelations> => request(`/city/id/${enc(id)}/children`, { limit: opts?.limit, cursor: opts?.cursor, ...cityResponseQuery(opts), hierarchy: opts?.hierarchy ? 'true' : undefined, ...deepQuery(opts) }, undefined, opts),
				/** Immediate parent first, following only reviewed parent facts. */
				ancestors: (id: string, opts?: CityAncestorsOptions): Promise<CityRelations> => request(`/city/id/${enc(id)}/ancestors`, { ...cityResponseQuery(opts), hierarchy: opts?.hierarchy ? 'true' : undefined, ...deepQuery(opts) }, undefined, opts),
				siblings: (id: string, opts?: CityRelationsOptions): Promise<CityRelations> => request(`/city/id/${enc(id)}/siblings`, { limit: opts?.limit, cursor: opts?.cursor, ...cityResponseQuery(opts), hierarchy: opts?.hierarchy ? 'true' : undefined, ...deepQuery(opts) }, undefined, opts),
				/** Great-circle distance between stored centers, not travel distance or containment. */
				distance: (from: string, to: string, opts?: CityDistanceOptions): Promise<CityDistance> => request(`/city/id/${enc(from)}/distance/${enc(to)}`, undefined, undefined, opts),
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

		company: Object.assign(
			(number: string, opts?: CompanyOptions): Promise<Company> =>
				request(`/company/${enc(number)}`, { country: opts?.country, ...deepQuery(opts) }, undefined, opts),
			{
				/** Look up a stable directory ID. Requested deep belongs to this profile. */
				id: (id: string, opts?: CompanyIdOptions): Promise<CompanyProfile> =>
					request(`/company/id/${enc(id)}`, deepQuery(opts), undefined, requestControls(opts)),
				/** Return candidates without selecting a match. Use one selector, country, exact industry, filters. */
				search: (opts: CompanySearchOptions): Promise<CompanySearch> =>
					request('/company', { q: opts.query, domain: opts.domain, ticker: opts.ticker, identifier: opts.identifier, country: opts.country, industry: opts.industry, industry_type: opts.industry_type, exchange: opts.exchange, authority: opts.authority, limit: opts.limit, cursor: opts.cursor, ...deepQuery(opts) }, undefined, requestControls(opts)),
				/** Describe the directory edition and its counts. Counts do not establish complete country coverage. */
				coverage: (opts?: CompanyCoverageOptions): Promise<CompanyCoverage> =>
					request('/company/directory/coverage', undefined, undefined, requestControls(opts)),
			}
		),

		/**
		 * Parse an email and check its format and domain.
		 * `deep: true` explicitly requests a metered deliverability check using included checks or enabled on-demand usage.
		 * Deep checks default to one attempt. An explicit retry count can repeat paid usage.
		 */
		email: (email: string, opts?: EmailOptions): Promise<Email> => request(`/email/${enc(email)}`, deepQuery(opts), undefined, opts),

		bin: (bin: string, opts?: BinOptions): Promise<Bin> =>
			request(`/bin/${enc(bin)}`, { deep: opts?.deep }, undefined, opts),

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

		/** Identify technologies in static homepage HTML and response headers. */
		stack: (domain: string, opts?: StackOptions): Promise<Stack> =>
			request(`/stack/${enc(domain)}`, { ...deepQuery(opts), pretty: opts?.pretty }, undefined, opts),

		/** Check registration: available is true, false or null when unknown. Paid Deep adds available registration details. */
		domain: (domain: string, opts?: DomainOptions): Promise<Domain> =>
			request(`/domain/${enc(domain)}`, deepQuery(opts), undefined, opts),

		/** Check domain registration while preserving unknown availability and partial detail. */
		domainResult: (domain: string, opts?: DomainOptions): Promise<DomainResult> =>
			request(`/domain/${enc(domain)}`, deepQuery(opts), undefined, opts),

		asn: (asn: string, opts?: AsnOptions): Promise<Asn> => request(`/asn/${enc(asn)}`, undefined, undefined, opts),

		/** Look up a 2-11 digit card prefix. Keep leading zeros in the input string. */
		card: async (bin: string, opts?: CardOptions): Promise<Card> => {
			if (typeof bin !== 'string' || bin.length > 64 || !/^[0-9]{2,11}$/.test(bin.replace(/[ \t\r\n-]/g, ''))) {
				throw new TypeError('parseAPI: Card requires a string containing 2 to 11 digits. Send a prefix only.');
			}
			return request(`/card/${enc(bin)}`, deepQuery(opts), undefined, opts);
		},

		/** Look up DNS records with TTLs. Type selects the question and may include its CNAME chain. Pooled on every plan. */
		dns: (domain: string, opts?: DnsOptions): Promise<Dns> =>
			request(`/dns/${enc(domain)}`, { type: opts?.type }, undefined, opts),

		mx: (domain: string, opts?: MxOptions): Promise<Mx> => request(`/mx/${enc(domain)}`, undefined, undefined, opts),

		useragent: (ua: string, opts?: UseragentOptions): Promise<Useragent> =>
			request('/useragent', deepQuery(opts), { 'User-Agent': ua }, opts),

		/** US NAICS 2022 definitions and hierarchy. */
		industry,
		/** Compatibility name for industry. */
		naics: industry,

		language: (code: string, opts?: LanguageOptions): Promise<Language> => request(`/language/${enc(code)}`, deepQuery(opts), undefined, opts),

		name: (name: string, opts?: NameOptions): Promise<Name> => request(`/name/${enc(name)}`, { country: opts?.country, ...deepQuery(opts), name_locale: opts?.name_locale }, undefined, opts),

		/** Current local time, UTC by default. With to or targets, offsetless at is source wall time. */
		time: Object.assign(
			(timezone?: string, opts?: TimeOptions): Promise<Time> =>
				request(timePath(timezone), { ...timeSource(timezone, opts), at: opts?.at, to: opts?.to, targets: timeTargets(opts?.targets, opts?.to), disambiguation: opts?.disambiguation, ...deepQuery(opts) }, undefined, opts),
			{
				/** Search serving timezone IDs. Omit query to list all. */
				zones: (query?: string, opts?: TimeZonesOptions): Promise<TimeZones> => request('/time/zones', { q: query, country: opts?.country, area: opts?.area, offset: opts?.offset, abbreviation: opts?.abbreviation, dst: opts?.dst === undefined ? undefined : String(opts.dst), observes_dst: opts?.observes_dst === undefined ? undefined : String(opts.observes_dst), at: opts?.at, details: opts?.details, sort: opts?.sort }, undefined, opts),
				at: (lat: number, lon: number, opts?: TimeAtOptions): Promise<Time> =>
					request('/time', { lat, lon, at: opts?.at, to: opts?.to, targets: timeTargets(opts?.targets, opts?.to), disambiguation: opts?.disambiguation, ...deepQuery(opts) }, undefined, opts),
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

		elevation: Object.assign(
			(lat: number, lon: number, opts?: ElevationOptions): Promise<Elevation> => request('/elevation', { lat, lon }, undefined, opts),
			{
				/** Sample up to 512 coordinates in order. Accepts lat/lon tuples, a pipe list, or an enc: Google polyline. Long URLs use JSON POST automatically. */
				points: (points: Array<[number, number]> | string, opts?: ElevationOptions): Promise<ElevationLocations> =>
					elevationSamples('points', points, opts),
				/** Sample a path at 2-512 evenly spaced great-circle distances, including both endpoints. Accepts 2-512 vertices as lat/lon tuples, a pipe list, or an enc: Google polyline. Long URLs use JSON POST automatically. */
				path: (path: Array<[number, number]> | string, samples: number, opts?: ElevationOptions): Promise<ElevationLocations> =>
					elevationSamples('path', path, opts, samples),
			}
		),

		/** Resolve the country, state, district and timezone at coordinates. Deep adds terrain and compact nearest-city context on every plan. The timezone ID stays in core. The nearest city is null when none is within 200 km. */
		point: (lat: number, lon: number, opts?: PointOptions): Promise<Point> =>
			request('/point', { lat, lon, ...deepQuery(opts) }, undefined, opts),

		/** Get current conditions in metric and imperial units. Paid deep adds specialist current measurements, forecasts and related detail. With deep, date selects a past UTC day (YYYY-MM-DD) in deep.history alongside current conditions. Date alone does not request history. */
		weather: (lat: number, lon: number, opts?: WeatherOptions): Promise<Weather> =>
			request('/weather', { lat, lon, date: opts?.date, ...deepQuery(opts) }, undefined, opts),

		emoji: Object.assign(
			(emoji: string, opts?: EmojiOptions): Promise<Emoji> => request(`/emoji/${enc(emoji)}`, { shortcode_source: opts?.shortcodeSource, ...deepQuery(opts) }, undefined, opts),
			{
				search: (query: string, opts?: EmojiSearchOptions): Promise<EmojiSearch> =>
					request('/emoji', { q: query, ...emojiFilters(opts), ...deepQuery(opts) }, undefined, opts),
				browse: (opts?: EmojiBrowseOptions): Promise<EmojiBrowse> =>
					request('/emoji', { ...emojiFilters(opts), ...deepQuery(opts) }, undefined, opts),
				categories: (opts?: RequestOptions): Promise<EmojiCategories> =>
					request('/emoji/categories', undefined, undefined, requestControls(opts)),
				convert: (text: string, opts: EmojiConvertOptions): Promise<EmojiConversion> =>
					request('/emoji/convert', { direction: opts.direction, shortcode_source: opts.shortcodeSource }, undefined, opts, { text }),
				/** Extract complete sequences. Positions use UTF-16 code units; end is exclusive. */
				catalog: (opts?: EmojiCatalogOptions): Promise<EmojiCatalogData> =>
					request('/emoji/catalog', { ...emojiFilters(opts), profile: opts?.profile, deep: opts?.deep ?? true }, undefined, opts),
				metadata: (opts?: RequestOptions): Promise<EmojiMetadata> =>
					request('/emoji/metadata', undefined, undefined, requestControls(opts)),
				parse: (text: string, opts?: EmojiParseOptions): Promise<EmojiParse> =>
					request('/emoji/parse', deepQuery(opts), undefined, opts, { text }),
			}
		),
	};
}

export type ParseAPIClient = ReturnType<typeof parseAPI>;

function emojiFilters(opts?: EmojiSearchOptions): Query {
	return { limit: opts?.limit, category: opts?.category, subcategory: opts?.subcategory, version: opts?.version, max_version: opts?.maxVersion, include_skin_tones: opts?.includeSkinTones, offset: opts?.offset };
}


function timeSource(timezone: string | undefined, options: TimeOptions = {}): Record<string, string | undefined> {
	const values = { ip: options.ip, city: options.city, country: options.country, state: options.state, iata: options.iata, icao: options.icao, unlocode: options.unlocode, address: options.address };
	const primary = [options.ip, options.city, options.iata, options.icao, options.unlocode, options.address].filter(value => value !== undefined);
	const present = Object.values(values).some(value => value !== undefined);
	if (Object.values(values).some(value => value !== undefined && (typeof value !== 'string' || !value.trim())) ||
		(timezone !== undefined && present) || primary.length > 1 ||
		(options.country !== undefined && primary.length > 0 && options.city === undefined && options.address === undefined) ||
		(options.state !== undefined && ((options.city === undefined && options.address === undefined) || options.country === undefined)) ||
		(options.address !== undefined && options.country === undefined)) throw new TypeError('Pass one Time source, using country only with city or address and state only with city or address and country.');
	return values;
}

function timePath(timezone: string | undefined): string {
	if (timezone !== undefined && ['zones', 'help'].includes(timezone.trim().toLowerCase())) throw new TypeError('Time source must be an IANA timezone ID. Use timezone discovery to list IDs.');
	return timezone === undefined ? '/time' : `/time/${encodeURIComponent(timezone)}`;
}

function timeTargets(targets: readonly string[] | undefined, to: string | undefined): string | undefined {
	if (targets === undefined) return undefined;
	if (to !== undefined || !Array.isArray(targets) || targets.length < 1 || targets.length > 10 || Array.from(targets).some(zone => typeof zone !== 'string' || !zone.trim() || zone.includes(','))) {
		throw new TypeError('Time targets requires 1 to 10 timezone IDs and cannot be combined with to.');
	}
	return targets.join(',');
}

/** Existing NAICS options remain source compatible. */
export type NaicsOptions = IndustryOptions;
export type NaicsSearchOptions = IndustrySearchOptions;
export type BinOptions = DeepOption & RequestOptions;


export type CityScopeOptions = { country?: string; state?: string; type?: string; grain?: CityGrain; hierarchy?: boolean };

export type CityResponseOptions = { romanized?: boolean };

export type CityCollectionFilters = {
	minPopulation?: number; maxPopulation?: number; minElevation?: number; maxElevation?: number;
	countries?: string | readonly string[]; excludeCountries?: string | readonly string[];
	timezone?: string; timezones?: string | readonly string[];
	/** Center-coordinate box: west,south,east,north. West > east crosses the date line. */
	bbox?: string;
};

export type CityPagingOptions = { page?: boolean; cursor?: string; order?: 'asc' | 'desc' };

export type CitySort = string;

export type CityListOptions = LanguageOption & CityScopeOptions & CityCollectionFilters & CityResponseOptions & {
	limit?: number; cursor?: string; sort?: CitySort; order?: 'asc' | 'desc';
} & DeepOption & RequestOptions;

export type CityNearbyCoordinatesOptions = LanguageOption & CityScopeOptions & CityCollectionFilters & CityResponseOptions & {
	radius?: number; unit?: 'km' | 'mi'; limit?: number; cursor?: string; sort?: CitySort; order?: 'asc' | 'desc';
} & DeepOption & RequestOptions;

export type CityRelationsOptions = LanguageOption & CityResponseOptions & { limit?: number; cursor?: string; hierarchy?: boolean } & DeepOption & RequestOptions;

export type CityAncestorsOptions = Omit<CityRelationsOptions, 'limit' | 'cursor'>;

export type CityDistanceOptions = RequestOptions;


type ClassicCityOptions<T> = T & { format?: never };

export interface CityLookupCall {
	(name: string, opts?: ClassicCityOptions<CityOptions>): Promise<City>;
	(name: string, opts: CityOptions & { format: 'resource' }): Promise<CityResource>;
	(name: string, opts: CityOptions): Promise<City>;
}

export interface CityIdCall {
	(id: string, opts?: ClassicCityOptions<CityIdOptions>): Promise<City>;
	(id: string, opts: CityIdOptions & { format: 'resource' }): Promise<CityResource>;
	(id: string, opts: CityIdOptions): Promise<City>;
}

export interface CityNearestCall {
	(lat: number, lon: number, opts?: ClassicCityOptions<CityNearestOptions>): Promise<CityNearest>;
	(lat: number, lon: number, opts: CityNearestOptions & { format: 'resource' }): Promise<CityResource & Pick<CityNearest, 'distance' | 'distance_mi'>>;
	(lat: number, lon: number, opts: CityNearestOptions): Promise<CityNearest>;
}

export interface CitySearchCall {
	(query: string, opts?: ClassicCityOptions<CitySearchOptions>): Promise<CitySearch>;
	(query: string, opts: CitySearchOptions & { format: 'list' }): Promise<CityCollection>;
	(query: string, opts: CitySearchOptions): Promise<CitySearch | CityCollection>;
}

export interface CityNearbyCall {
	(name: string, opts?: ClassicCityOptions<CityNearbyOptions>): Promise<CityNearby>;
	(name: string, opts: CityNearbyOptions & { format: 'list' }): Promise<CityCollection>;
	(name: string, opts: CityNearbyOptions): Promise<CityNearby | CityCollection>;
}


function cityErrorCandidates(input: unknown): CityAmbiguityCandidate[] | undefined {
	if (!Array.isArray(input)) return undefined;
	const fields = ['name', 'name_local', 'country', 'country_name', 'state', 'state_name', 'type'] as const;
	return input.slice(0, 2).flatMap(row => {
		if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !/^city_[23456789abcdefghjkmnpqrstuvwxyz]{12}$/.test(row.id)) return [];
		const candidate: CityAmbiguityCandidate = { id: row.id, object: 'city' };
		for (const field of fields) if (Object.hasOwn(row, field) && (row[field] === null || typeof row[field] === 'string' && row[field].length <= 255)) candidate[field] = row[field];
		return [candidate];
	});
}

function cityCsv(value?: string | readonly string[]): string | undefined { return typeof value === 'string' ? value : value?.join(','); }

function cityResponseQuery(opts?: CityResponseOptions & { format?: string }): Query { return { format: opts?.format, romanized: opts?.romanized ? 'true' : undefined }; }

function cityScopeQuery(opts?: CityScopeOptions): Query {
	return { country: opts?.country, state: opts?.state, type: opts?.type, grain: opts?.grain, hierarchy: opts?.hierarchy ? 'true' : undefined };
}

function cityCollectionQuery(opts?: CityCollectionFilters & { page?: boolean; cursor?: string; sort?: string; order?: string }): Query {
	return { min_population: opts?.minPopulation, max_population: opts?.maxPopulation, min_elevation: opts?.minElevation, max_elevation: opts?.maxElevation,
		countries: cityCsv(opts?.countries), exclude_countries: cityCsv(opts?.excludeCountries), timezones: cityCsv(opts?.timezones), timezone: opts?.timezone, bbox: opts?.bbox,
		page: opts?.page ? 'true' : undefined, cursor: opts?.cursor, sort: opts?.sort, order: opts?.order };
}
