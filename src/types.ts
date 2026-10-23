/**
 * Response types for the ParseAPI public API.
 * Core answers the common task; optional deep reveals the reviewed detail.
 * Every field inside a deep object is optional and nullable: the API ships
 * `deep: {}` when deep was requested but is not unlocked on the plan.
 */

/** The `deep` key is omitted unless the request asked for it. */
export type Deep<T> = Partial<{ [K in keyof T]: T[K] | null }>;

export interface IpDeep {
	state: string;
	city: string;
	registry: string;
	datacenter: boolean;
	relay: boolean;
	tor: boolean;
	vpn: boolean;
	provider: string;
}

export interface Ip {
	ip: string;
	country: string | null;
	country_name: string | null;
	continent: string | null;
	asn: string | null;
	asn_name: string | null;
	deep?: Deep<IpDeep>;
}

export interface Continent {
	continent: string;
	name: string;
	region: string;
	subregion: string;
	population: number | null;
	/** @deprecated No longer returned. Retained for source compatibility. */
	population_period?: string | null;
	area: number | null;
	emoji: string;
}

export interface ContinentCountryItem {
	country: string;
	name: string;
	emoji?: string | null;
	calling_code?: string | null;
}

export interface ContinentCountries {
	continent: string;
	countries: ContinentCountryItem[];
}

export interface Country {
	country: string;
	name: string;
	name_local: string | null;
	continent: string;
	currency: string | null;
	currency_name: string | null;
	currency_symbol: string | null;
	calling_code: string | null;
	emoji: string | null;
	languages: string[];
	deep?: Deep<CountryDeep>;
	/** IANA timezones used by the country. */
	timezones: string[] | null;
}

export interface CountryStateItem {
	state: string;
	name: string;
	type: string | null;
}

export interface CountryStates {
	country: string;
	states: CountryStateItem[];
}

export interface State {
	state: string;
	name: string;
	name_local: string | null;
	type: string | null;
	country: string;
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	timezone: string | null;
	timezones: string[];
	iso_3166_2: string | null;
	deep?: Deep<StateDeep>;
}

export interface StateDistrictItem {
	district: string | null;
	name: string | null;
	type: string | null;
	deep?: Deep<StateDistrictDeep>;
}

export interface StateDistrictDeep {
	population: number | null;
	/** @deprecated No longer returned. Retained for source compatibility. */
	population_period?: string | null;

}

export interface StateDistricts {
	state: string;
	state_name: string | null;
	country: string;
	country_name: string | null;
	districts: StateDistrictItem[];
}

export interface District {
	district: string;
	name: string;
	type: string | null;
	state: string | null;
	state_name: string | null;
	country: string;
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	timezone: string | null;
	timezones: string[];
	deep?: Deep<DistrictDeep>;
}

export interface City {
	/** Present for explicit search matching when the server returns suggestion evidence. */
	match?: CityMatch;
	name: string;
	name_local: string | null;
	name_romanized?: string | null;
	romanization_language?: string | null;
	type: string | null;
	state: string | null;
	state_name: string | null;
	district: string | null;
	district_name: string | null;
	country: string;
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	timezone: string | null;
	/** Minted parse id (`city_` + 12 chars). Stable pin via `/city/id/{id}`. */
	id: string;
	/** Returned with hierarchy=true. Null means the layer has not been reviewed. */
	grain?: CityGrain | null;
	/** Reviewed immediate parent; null when no reviewed relationship exists. */
	parent?: CityParent | null;
	deep?: Deep<CityDeep>;
}

/** Nearest-city lookups add the distance from the query point. */
export interface CityNearest extends City {
	distance: number;
	distance_mi: number;
}

export interface CitySearch {
	q: string;
	country?: string;
	state?: string;
	type?: string;
	grain?: CityGrain;
	aliases?: boolean;
	cities: City[];
	/** Present with page=true or a continuation cursor; null when this is the last page. */
	next_cursor?: string | null;
}

export interface CityNearby {
	city: string;
	state: string | null;
	country: string;
	radius: number;
	unit: string;
	nearby: CityNearest[];
	next_cursor?: string | null;
}

/** An area's share of ZIP addresses, with category shares measured independently. */
export interface PostalMetro {
	code: string;
	name: string;
	type: string;
	share: number | null;
	residential_share: number | null;
	business_share: number | null;
	other_share: number | null;
}

/** A supported Australian postcode suburb choice, independent of the scalar city. */
export interface PostalLocality {
	city: string;
	state: string;
	state_name: string;
}

export interface Postal {
	postal: string;
	city: string | null;
	city_local: string | null;
	/** Null/missing is unknown. An empty list has no eligible choices. One choice does not imply city. */
	localities?: PostalLocality[] | null;
	district: string | null;
	district_name: string | null;
	district_name_local: string | null;
	state: string | null;
	state_name: string | null;
	state_name_local: string | null;
	country: string;
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	timezone: string | null;
	deep?: Deep<PostalDeep>;
}

export interface PostalNearbyItem {
	postal: string;
	city: string | null;
	state: string | null;
	country: string;
	distance: number;
	distance_mi: number;
	deep?: Deep<PostalMetrosDeep>;
}

export interface PostalNearby {
	postal: string;
	country: string;
	radius: number;
	unit: string;
	nearby: PostalNearbyItem[];
	deep?: Deep<PostalMetrosDeep>;
}

export interface PostalDistanceEnd {
	postal: string;
	city: string | null;
	deep?: Deep<PostalMetrosDeep>;
}

export interface PostalDistance {
	country: string;
	from: PostalDistanceEnd;
	to: PostalDistanceEnd;
	distance: number;
	distance_mi: number;
}

export interface EmailDeep {
	/** Suggested first name. Not a verified identity. */
	first_name?: string | null;
	no_reply?: boolean | null;
	/** Plus-address tag, without the plus sign. */
	tag?: string | null;
	/** Mail service handling the address, such as Google or Microsoft. */
	mail_provider?: string | null;
	deliverable: boolean | null;
	catchall: boolean | null;
	/** Mailbox status: deliverable, undeliverable or risky. Null when unavailable. */
	status?: string | null;
	/** Why the address received this result, such as mailbox_full or mailbox_not_found. Null when unavailable. */
	reason?: string | null;
}

export interface Email {
	email: string;
	didyoumean: string | null;
	valid: boolean;
	free: boolean;
	domain: string | null;
	domain_type: 'academic' | 'government' | 'military' | null;
	domain_valid: boolean | null;
	role: boolean;
	disposable: boolean;
	deep?: Deep<EmailDeep>;
}

export interface Phone {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** What the numbering plan can see. Never voip (that is the carrier field's word). Null when invalid. */
	type: 'mobile' | 'landline' | 'toll_free' | 'unknown' | null;
	national: string | null;
	international: string | null;
	deep?: Deep<PhoneDeep>;
}

export interface Carrier {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** The network's word, including voip. Null when invalid. */
	type: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown' | null;
	/** Current carrier display name. Null when the probe had no answer. */
	carrier: string | null;
	/** Carrier is a known burner number app. Null when carrier is unknown. */
	burner: boolean | null;
	deep?: Deep<CarrierDeep>;
}

export interface Caller {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** CNAM record verbatim (all-caps telco artifact). Null when no record, outside NANP, or invalid. */
	caller: string | null;
}

export interface Hlr {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** Assigned to a subscriber at the last check. Null means unconfirmed. */
	live: boolean | null;
	/** Handset reachable at the last check. Null means unconfirmed, never no. */
	connected: boolean | null;
	deep?: Deep<HlrDeep>;
}

export interface MxRecord {
	priority: number;
	host: string;
}

export interface StackTechnology {
	technology: string;
	name: string;
	version: string | null;
}

export interface Stack {
	domain: string;
	url: string;
	/** Time of the check, or null when no HTML page could be checked. */
	checked_at: string | null;
	scope: 'homepage' | 'site';
	/** Number of successfully checked HTML pages. */
	pages: number;
	/** True for homepage-only or incomplete bounded checks; null when no HTML page could be checked. False never guarantees every page was visited. */
	partial: boolean | null;
	/** Collections are null when no HTML page could be checked and empty when no matches were found. */
	cms: StackTechnology[] | null;
	servers: StackTechnology[] | null;
	frameworks: StackTechnology[] | null;
	ecommerce: StackTechnology[] | null;
	analytics: StackTechnology[] | null;
	chat: StackTechnology[] | null;
	payments: StackTechnology[] | null;
	hosting: StackTechnology[] | null;
	/** Empty only when the generic deep compatibility flag was requested. */
	deep?: Record<string, never>;
}

export interface DomainRegistration {
	registered: boolean;
	created: string | null;
	updated: string | null;
	expires: string | null;
	registrar: string | null;
	status: string[];
	dnssec: boolean;
}

export interface DomainDeep {
	registration: DomainRegistration;
}

export interface Domain {
	domain: string;
	available: boolean;
	deep?: Deep<DomainDeep>;
}

/** Network identity for an autonomous system number. */
export interface Asn {
	asn: number;
	name: string | null;
	country: string | null;
	country_name: string | null;
}

/** Network identity from reviewed prefix rules; null means unknown or ambiguous. */
export interface Card {
	bin: string;
	brand: string | null;
	brand_name: string | null;
	/** SVG URL, with a generic-card fallback. */
	logo: string;
	/** Included only when requested; pooled on every plan. */
	deep?: CardDeep;
}

export interface CardDeep {
	/** Longest recorded matching prefix; may be shorter than bin. */
	prefix: string | null;
	issuer: string | null;
	country: string | null;
	type: string | null;
	prepaid: boolean | null;
}

/** A published DNS record. Value is DNS presentation text, including TXT quoting. */
export interface DnsRecord {
	name: string;
	type: string;
	/** Remaining cache lifetime in seconds. */
	ttl: number;
	value: string;
}

export interface Dns {
	domain: string;
	records: DnsRecord[];
}

export interface Mx {
	domain: string;
	mx: MxRecord[];
}

export interface UseragentDeviceDeep {
	type: string | null;
	brand: string | null;
	model: string | null;
	cpu: string | null;
	touchscreen: boolean | null;
}

export interface UseragentOsDeep {
	name: string | null;
	version: string | null;
	platform: string | null;
}

export interface UseragentBrowserBrand {
	brand: string;
	version: string;
}

export interface UseragentBrowserDeep {
	name: string | null;
	version: string | null;
	type: string | null;
	brands?: UseragentBrowserBrand[];
}

export interface UseragentEngineDeep {
	name: string | null;
	version: string | null;
}

export interface UseragentDeep {
	device: UseragentDeviceDeep;
	os: UseragentOsDeep;
	browser: UseragentBrowserDeep;
	engine: UseragentEngineDeep;
	headless: boolean;
	bot?: Record<string, unknown>;
	ai?: boolean;
}

export interface Useragent {
	useragent: string;
	device: string | null;
	os: string | null;
	browser: string | null;
	bot: boolean;
	mobile: boolean;
	deep?: Deep<UseragentDeep>;
}

/** One language by BCP 47 shortest code (en) or ISO 639-3 (eng). Codes are lowercase. */
export interface Language {
	language: string;
	name: string;
	name_local: string | null;
	script: string | null;
	direction: 'ltr' | 'rtl' | string;
	deep?: Deep<LanguageDeep>;
}

/** A parsed person name. Junk input returns valid: false, never an error. Gender comes from dictionary data and is null when the data does not decide. */
export interface Name {
	name: string;
	valid: boolean;
	prefix: string | null;
	first: string | null;
	middle: string | null;
	last: string | null;
	suffix: string | null;
	deep?: Deep<NameDeep>;
}

export interface TimezoneNextDst {
	at: string;
	dst: boolean;
	offset: string;
	abbreviation: string;
}

export interface Timezone {
	latitude?: number;
	longitude?: number;
	timezone: string | null;
	abbreviation: string | null;
	offset: string | null;
	dst: boolean | null;
	/** Resolved local ISO time with its UTC offset. */
	at: string | null;
	/** Unix seconds for the resolved instant. */
	unix: number | null;
	/** With to= only: the other zone at the same instant. to.at is the converted time. */
	to?: TimezoneConversionTarget | null;
	deep?: Deep<TimezoneDeep>;
}

/** Current time and timezone facts. Unresolved or ambiguous sources keep clock fields null. */
export interface Time extends Timezone {
	/** Present only for explicit location selectors. Ambiguous or missing results retain null clock fields. */
	location?: TimeLocation;
	/** With targets only. Order and duplicates are preserved. Null means the source timezone is unresolved. */
	targets?: TimezoneConversionTarget[] | null;
}

/** Available timezone identifiers. */
export interface TimeZones {
	timezone_database_version?: string;
	timezones: string[];
	/** Present with details=true. The one instant used for all rows. */
	at?: string;
	zones?: TimeZoneEntry[];
}

export interface TimeZoneEntry {
	timezone: string;
	countries: string[];
	area: string | null;
	abbreviation: string;
	offset: string;
	offset_seconds: number;
	dst: boolean;
	observes_dst: boolean;
}

export interface TimeTransitionState {
	at?: string | null;
	offset?: string | null;
	offset_seconds?: number | null;
	abbreviation?: string | null;
	dst?: boolean | null;
}

export interface TimeTransition {
	at?: string | null;
	before?: TimeTransitionState | null;
	after?: TimeTransitionState | null;
	change_seconds?: number | null;
}

export interface TimeSeason {
	start?: TimeTransition | null;
	end?: TimeTransition | null;
}

/** The other side of a timezone conversion. `at` is the converted wall time. */
export interface TimezoneConversionTarget {
	timezone: string;
	abbreviation: string | null;
	offset: string;
	dst: boolean;
	at: string;
	unix: number;
	deep?: Deep<TimezoneConversionTargetDeep>;
}

/**
 * Calendar facts for one date. Junk or ambiguous input returns valid: false,
 * never an error. `to` and `days` appear only when a to= date was passed.
 */
export interface DateInfo {
	date: string;
	valid: boolean;
	/** Unix time at midnight UTC of that date, seconds. */
	unix: number | null;
	/** With to= only: the other date, normalized ISO. */
	to?: string;
	/** With to= only: signed days to the other date. Future positive. */
	days?: number | null;
	deep?: Deep<DateInfoDeep>;
}

export interface Holiday {
	date: string;
	name: string;
	name_local: string | null;
	/** 'public' for an official day off, 'observance' for cultural days. */
	type: string;
	regions: string[] | null;
	substitute: boolean;
}

export interface HolidayYear {
	country: string;
	year: number;
	holidays: Holiday[];
}

export interface HolidayDate {
	country: string;
	date: string;
	holiday: Holiday | null;
}

export interface Elevation {
	latitude: number;
	longitude: number;
	elevation: number | null;
	elevation_ft: number | null;
	resolution: number | null;
}

export interface ElevationLocations {
	/** Ordered samples. Point lists preserve supplied coordinates. Paths include both endpoints with even spacing along the path. Unknown elevations stay null. */
	points: Elevation[];
}

export interface PointDeep {
	city: PointCity | null;
	elevation: number | null;
	elevation_ft: number | null;
	resolution: number | null;
}

export interface Point {
	latitude: number;
	longitude: number;
	country: string | null;
	country_name: string | null;
	state: string | null;
	state_name: string | null;
	district: string | null;
	district_name: string | null;
	deep?: Deep<PointDeep>;
	timezone: string | null;
}

export interface WeatherForecastPeriod {
	name: string;
	start: string | null;
	end: string | null;
	daytime: boolean | null;
	temperature: number | null;
	temperature_f: number | null;
	precipitation_chance: number | null;
	wind_speed: number | null;
	wind_speed_mph: number | null;
	wind_direction: number | null;
	condition: string | null;
	condition_name: string | null;
	condition_emoji: string | null;
}

export interface WeatherAlert {
	event: string;
	severity: string | null;
	urgency: string | null;
	headline: string | null;
	onset: string | null;
	expires: string | null;
}

export interface WeatherHour {
	at: string | null;
	daytime: boolean | null;
	temperature: number | null;
	temperature_f: number | null;
	feels_like: number | null;
	feels_like_f: number | null;
	humidity: number | null;
	precipitation_chance: number | null;
	wind_speed: number | null;
	wind_speed_mph: number | null;
	wind_gust: number | null;
	wind_gust_mph: number | null;
	wind_direction: number | null;
	condition: string | null;
	condition_name: string | null;
	condition_emoji: string | null;
}

export interface WeatherMinute {
	at: string;
	precipitation: number | null;
	precipitation_in: number | null;
	type: string | null;
}

export interface WeatherDay {
	date: string;
	high: number | null;
	high_f: number | null;
	low: number | null;
	low_f: number | null;
	precipitation_chance: number | null;
	condition: string | null;
	condition_name: string | null;
	condition_emoji: string | null;
	sunrise: string | null;
	sunset: string | null;
	moon_phase: string | null;
	moon_phase_name: string | null;
	moon_phase_emoji: string | null;
}

export interface WeatherAir {
	aqi: number | null;
	aqi_name: string | null;
	pm2_5: number | null;
	pm10: number | null;
}

export interface WeatherHistory {
	date: string;
	high: number | null;
	high_f: number | null;
	low: number | null;
	low_f: number | null;
	precipitation: number | null;
	precipitation_in: number | null;
	wind_max: number | null;
	wind_max_mph: number | null;
	sunrise: string | null;
	sunset: string | null;
	moon_phase: string | null;
	moon_phase_name: string | null;
	moon_phase_emoji: string | null;
}

export interface WeatherDeep {
	forecast: WeatherForecastPeriod[] | null;
	alerts: WeatherAlert[] | null;
	minutes: WeatherMinute[] | null;
	hours: WeatherHour[] | null;
	days: WeatherDay[] | null;
	air: WeatherAir | null;
	/** Only present when the call carried ?date=. */
	history?: WeatherHistory | null;
	/** Specialist measurements for the same observed current conditions. */
	current: WeatherCurrentDeep;
}

export interface WeatherCurrent {
	temperature: number | null;
	temperature_f: number | null;
	feels_like: number | null;
	feels_like_f: number | null;
	humidity: number | null;
	wind_speed: number | null;
	wind_speed_mph: number | null;
	wind_direction: number | null;
	condition: string | null;
	condition_name: string | null;
	condition_emoji: string | null;
	observed_at: string | null;
}

export interface WeatherStation {
	id: string;
	name: string | null;
	distance: number | null;
	distance_mi: number | null;
}

export interface Weather {
	latitude: number;
	longitude: number;
	current: WeatherCurrent;
	station: WeatherStation | null;
	deep?: Deep<WeatherDeep>;
}

export interface EmojiSkin {
	emoji: string;
	tone: string;
	unicode: string | null;
	hex: string | null;
}

export interface Emoji {
	emoji: string;
	name: string;
	shortcodes: string[];
	category: string | null;
	deep?: Deep<EmojiDeep>;
}

export interface EmojiSearch {
	q: string;
	emojis: Emoji[];
	total?: number;
	next_offset?: number | null;
}

export interface EmojiBrowse {
	emojis: Emoji[];
	total: number;
	next_offset: number | null;
}

export interface EmojiVariant { emoji: string; tones: string[]; }
export interface EmojiArtwork {
  svg?: string; png?: Record<string, string>;
  /** Only present when this asset has different rights from its provider. */
  license?: string; license_url?: string; attribution?: string;
}
export interface EmojiSource {
  id: string; version: string | null; source_url: string; license: string; license_url: string;
}
export interface EmojiNotice { id: string; license: string; notice: string; }
export interface EmojiArtworkSource {
  style: string; version: string | null; unicode_version: string | null; source_url: string;
  license: string; license_url: string; attribution: string; notices: string[];
  loaded_coverage?: { svg: number; png: number };
  flag_license?: { license: string; license_url: string; description: string };
}
export interface EmojiMetadata {
  edition: string; max_version: string | null; source_version?: string;
  total: number;
  sources: EmojiSource[]; artwork_sources: EmojiArtworkSource[]; notices: EmojiNotice[];
  completeness: { missing_count: number; unexpected_count: number };
  shortcode_sources?: Record<string, EmojiShortcodeSourceMetadata>;
  [field: string]: unknown;
}
export interface EmojiCatalogScope { filters: Record<string, string>; total: number; complete_inventory: boolean; }
export interface EmojiNativeSearchFacts { name: string | null; keywords: string[]; order?: number | null; }
export interface EmojiCatalogSearchFacts { native: Record<string, EmojiNativeSearchFacts>; localized_keywords?: string[]; }
export interface EmojiCatalogData {
  profile?: 'full' | 'compact';
  scope?: Omit<EmojiCatalogScope,'total'>;
  search?: EmojiCatalogSearchFacts;
  localization?: EmojiCatalogLocalization;
  metadata: EmojiMetadata; total: number; emojis: Emoji[];
  forms: Record<string, string>;
  shortcodes: Record<'cldr' | 'github' | 'slack' | 'discord', Record<string, string[]>>;
  legacy: Record<string, string>;
}
export interface EmojiCatalogLocalization {
  requested_locale: string | null; resolved_locale: string | null;
  translated_names: number; translated_keywords: number; fallback_names: number; fallback_keywords: number;
}
export interface EmojiShortcodeSourceMetadata {
  records: number; missing_records: number; ambiguous_aliases: number;
}

export interface EmojiCategory { category: string; subcategories: string[]; }
export interface EmojiCategories { categories: EmojiCategory[]; }
/** UTF-16 code-unit positions. End is exclusive. */
export interface EmojiPosition { start: number; end: number; }
/** Original input UTF-16 positions; end is exclusive. */
export interface EmojiUnresolved extends EmojiPosition { emoji?: string; shortcode?: string; reason: 'unknown' | 'ambiguous' | 'unavailable'; }


export interface Address {
	address: string | null;
	valid: boolean;
	registered: boolean | null;
	number: string | null;
	street: string | null;
	unit: string | null;
	city: string | null;
	district: string | null;
	district_name: string | null;
	state: string | null;
	state_name: string | null;
	postal: string | null;
	country: string | null;
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	deep?: Record<string, unknown>;
}

export interface AddressSuggestion {
	address: string;
	number: string | null;
	street: string | null;
	unit: string | null;
	city: string | null;
	state: string | null;
	postal: string | null;
	latitude: number | null;
	longitude: number | null;
}

export interface AddressSearch {
	q: string;
	postal?: string | null;
	city?: string | null;
	state?: string | null;
	country?: string | null;
	addresses: AddressSuggestion[];
	/** Why suggestions are empty: more_input, missing_context or no_matches. Null with suggestions. Open to future values. Operational failures are errors. */
	reason?: string | null;
}

export interface CompanyCountry {
	name: string | null;
	blocs: string[];
	/** Levy name, such as VAT, GST or sales tax. Null when unknown or not applicable. */
	tax: string | null;
}

export interface CompanyDeep {
	activity: string | null;
	state_name: string | null;
	country_name: string | null;
	vat: string | null;
	gst: boolean | null;
	acn: string | null;
	siren: string | null;
	siege: boolean | null;
	kind: string | null;
	invoice: string | null;
}

export interface Company {
	company: string | null;
	valid: boolean;
	registered: boolean | null;
	country: string | null;
	type: string | null;
	name: string | null;
	active: boolean | null;
	address: string | null;
	city: string | null;
	state: string | null;
	postal: string | null;
	deep?: Deep<CompanyDeep>;
}

/** Directory listing claims. Exchange and symbol remain separate from legal identifiers. */
export interface CompanyProfileListing {
	exchange: string;
	symbol: string;
}
export interface CompanyProfileAddress {
	type: string;
	street: string | null;
	city: string | null;
	state: string | null;
	postal: string | null;
	country: string | null;
}
export interface CompanyProfileJurisdiction {
	country: string | null;
	state: string | null;
}
export interface CompanyProfileWebsite {
	domain: string;
	url: string | null;
}
export interface CompanyProfileIdentifier {
	type: string;
	authority: string;
	value: string;
}
export interface CompanyProfileIndustry {
	type: string;
	code: string;
	name: string | null;
}
/** Source-stated founding value. Precision is year, month, day, or a future open value. */
export interface CompanyProfileFounding {
	value: string;
	precision: string;
}
/** Reported workforce count for the stated basis, scope and measurement date. */
export interface CompanyProfileEmployees {
	count: number;
	as_of: string;
	/** Open string: headcount, full_time or full_time_equivalent. Older responses omit it. */
	basis?: string | null;
	/** Open string, currently legal_entity or consolidated_group. */
	scope: string;
	/** Open string, currently reported. */
	method?: string;
	approximate: boolean;
}
/** Legal form recorded by a register; codes remain open strings. */
export interface CompanyProfileRegistrationLegalForm {
	code: string;
	name: string;
}
/** Source-recorded principal address. State and country_raw are not inferred ISO codes. */
export interface CompanyProfileRegistrationAddress {
	kind: string;
	line1: string | null;
	line2: string | null;
	city: string | null;
	state: string | null;
	postal: string | null;
	country_raw: string | null;
}
/** Registry-scoped legal facts; registration does not establish current operation or tax exemption. */
export interface CompanyProfileRegistration {
	authority: string;
	number: string;
	jurisdiction: CompanyProfileJurisdiction;
	role: string;
	legal_form: CompanyProfileRegistrationLegalForm;
	status: string;
	/** This register's reported entity-form date, not universal incorporation or founding. */
	formation_date: string | null;
	address: CompanyProfileRegistrationAddress | null;
}
/** Attribution for selected enrichment fields, not the whole company profile. */
export interface CompanyProfileSource {
	type: string;
	url: string;
	fields: string[];
	observed_at: string;
	/** Explicit source update timestamp or null; employee measurement dates remain in as_of. */
	updated_at: string | null;
}
/** Selected public business contacts. Purpose is source-reported or null. */
export interface CompanyProfilePhone { number: string; kind: string | null; }
export interface CompanyProfileEmail { address: string; kind: string | null; }
/** An associated domain and its recorded URL, when known. */
export type CompanyProfileDomain = CompanyProfileWebsite;
export interface CompanySocialProfile { platform: string | null; url: string; handle: string | null; }
export interface CompanyPhoneNumber { number: string; type: string | null; }
export interface CompanyEmailAddress { address: string; type: string | null; }
/** Directory detail, distinct from national-number CompanyDeep. Missing or null facts remain unknown. */
export interface CompanyProfileDeep {
	legal_name?: string | null;
	aliases?: string[] | null;
	jurisdiction?: CompanyProfileJurisdiction | null;
	status?: string | null;
	domains?: CompanyProfileDomain[] | null;
	social_profiles?: CompanySocialProfile[] | null;
	phone_numbers?: CompanyPhoneNumber[] | null;
	email_addresses?: CompanyEmailAddress[] | null;
	/** Earlier directory responses. */
	websites?: CompanyProfileWebsite[] | null;
	identifiers?: CompanyProfileIdentifier[] | null;
	incorporated?: string | null;
	addresses?: CompanyProfileAddress[] | null;
	industries?: CompanyProfileIndustry[] | null;
	parent?: string | null;
	description?: string | null;
	/** Returned asset URL only. The SDK does not fetch it. */
	logo?: string | null;
	socials?: string[] | null;
	phones?: CompanyProfilePhone[] | null;
	emails?: CompanyProfileEmail[] | null;
	/** Founding claim, distinct from legal incorporation. Year-only dates stay year-only. */
	founded?: CompanyProfileFounding | null;
	employees?: CompanyProfileEmployees | null;
	/** Empty means no admitted registration facts; older editions may omit this member. */
	registrations?: CompanyProfileRegistration[] | null;
	sources?: CompanyProfileSource[] | null;
}
export interface CompanyProfile {
	id: string;
	name: string;
	country: string | null;
	website: string | null;
	listings: CompanyProfileListing[] | null;
	address: CompanyProfileAddress | null;
	deep?: Deep<CompanyProfileDeep>;
}
/** Why a candidate matched. Field/type/authority/exchange values remain extensible strings. */
export interface CompanyMatch {
	field?: string | null;
	value?: string | null;
	type?: string | null;
	authority?: string | null;
	exchange?: string | null;
}
export interface CompanyCandidate extends CompanyProfile {
	match: CompanyMatch;
}
export interface CompanySearch {
	companies: CompanyCandidate[];
	next: string | null;
}
/** Edition counts describe the records available, not all companies in a country. */
export interface CompanyCoverage {
	scope: string;
	label: string;
	description: string;
	snapshot_at?: string;
	companies: number;
	countries: string[];
	with_website: number;
	with_listings: number;
	with_address: number;
}

/** A direct child industry code. */
export interface NaicsChild {
	naics: string;
	name: string;
}

/** A classification exclusion. Generic exclusions can have no linked codes. */
export interface NaicsExclusion {
	description: string;
	codes: NaicsChild[];
}

/** A query token corrected only during typo fallback. */
export interface NaicsCorrection {
	from: string;
	to: string;
}

/** The actual title, activity term or code that matched a search. */
export interface NaicsMatch {
	/** Currently name, term or naics. Future fields remain decodable. */
	field: string;
	text: string;
	/** Empty for exact, plural and prefix matches. */
	corrections: NaicsCorrection[];
}

/** US NAICS 2022 definition and hierarchy, including two-digit sector ranges. */
export interface Naics {
	naics: string;
	name: string;
	/** Hierarchy depth, from 2 (sector) to 6 (national industry). */
	level: number;
	parent: string | null;
	parent_name: string | null;
	/** Search evidence. Omitted on direct lookup and older responses. */
	match?: NaicsMatch | null;
	year: number;
	country: string;
	deep?: Deep<NaicsDeep>;
}

/** Search records inherit country and revision from their envelope. */
export type NaicsSearchItem = Omit<Naics, 'country' | 'year'>;

export interface NaicsSearch {
	q: string;
	year: number;
	country: string;
	results: NaicsSearchItem[];
}

export interface CountryDeep {
	iso3: string;
	numeric: number;
	full_name: string | null;
	demonym: string | null;
	capital: string | null;
	capital_lat: number | null;
	capital_lon: number | null;
	region: string | null;
	subregion: string | null;
	population: number | null;
	/** @deprecated No longer returned. Retained for source compatibility. */
	population_period?: string | null;
	area: number | null;
	/** Land area in km2. */
	land_area?: number | null;
	/** Water area in km2. */
	water_area?: number | null;
	/** Coastline length in km. Zero is a known landlocked coastline. */
	coastline?: number | null;
	/** Mean elevation in metres above sea level. */
	elevation?: number | null;
	lowest_point?: CountryElevationPoint | null;
	highest_point?: CountryElevationPoint | null;
	tld: string | null;
	/** Levy name, such as VAT, GST or sales tax. Null when unknown or not applicable. */
	tax?: string | null;
	/** Standard country reference rate in percent (19 means 19%). Null is unknown, zero is known zero. */
	tax_rate?: number | null;
	/** Tax registration number mask (9 is a digit, A is a letter). Describes format only. */
	tax_id_format?: string | null;
	/** Anchored tax registration number format regex. A match does not establish registration. */
	tax_id_regex?: string | null;
	borders: string[];
	/** Bloc memberships (EU, SCHENGEN, NATO, ...). Empty when none. */
	blocs: string[];
	week_start: string | null;
	units: string | null;
	driving_side: string | null;
	plugs: string[] | null;
	voltage: number | null;
	frequency: number | null;
	emergency: CountryEmergency | null;
	postal_format: string | null;
	postal_regex: string | null;
	ioc: string | null;
	fifa: string | null;
	plate: string | null;
}

export interface CountryElevationPoint {
	name: string | null;
	/** Elevation in metres above sea level. Values below sea level are negative. */
	elevation: number;
}

export interface StateDeep {
	population: number | null;
	/** @deprecated No longer returned. Retained for source compatibility. */
	population_period?: string | null;
	/** Total area in km2. */
	area: number | null;
	fips: string | null;
	capital: string | null;
	area_codes: string[];
	/** Levy name, such as VAT, GST or sales tax. Null when unknown or not applicable. */
	tax: string | null;
	/** State or province reference rate in percent. Country, state and postal rates are alternative references, not additive. */
	tax_rate: number | null;
}

export interface DistrictDeep {
	population: number | null;
	/** @deprecated No longer returned. Retained for source compatibility. */
	population_period?: string | null;
	/** Total area in km2 (land + water, or the official total). */
	area: number | null;
	/** Land area in km2. Null when the source publishes total only. */
	land_area: number | null;
	/** Water area in km2. Null when the source publishes total only. */
	water_area: number | null;
	seat: string | null;
	/** Median annual property tax payable on owner-occupied homes in this statistical area. Null when unsupported, missing or censored. */
	property_tax?: PropertyTax | null;
}

export interface CityDeep {
	/** What this city is the capital of: country, state, or null. */
	capital_of: 'country' | 'state' | null;
	elevation: number | null;
	elevation_ft: number | null;
	population: number | null;
	/** @deprecated No longer returned. Retained for source compatibility. */
	population_period?: string | null;
	/** Exact observation date for a reviewed same-grain count; omitted for legacy undated counts. */
	population_observed_on?: string;
	/** Published population basis, for example registered_population. */
	population_basis?: string;
	/** Total area in km2 (land + water, or the official total). */
	area: number | null;
	/** Land area in km2. Null when the source publishes total only. */
	land_area: number | null;
	/** Water area in km2. Null when the source publishes total only. */
	water_area: number | null;
}

export interface PostalDeep {
	elevation: number | null;
	elevation_ft: number | null;
	population: number | null;
	/** @deprecated No longer returned. Retained for source compatibility. */
	population_period?: string | null;
	/** Total area in km2. Null when the source has no water split. */
	area: number | null;
	/** Land area in km2. Null where the source has none. */
	land_area: number | null;
	/** Water area in km2. Null where the source has none. */
	water_area: number | null;
	currency: string | null;
	/** Levy name, such as VAT, GST or sales tax. Null when unknown or not applicable. */
	tax?: string | null;
	/** Combined US ZIP reference rate in percent (7.9 means 7.9%). An exact address can differ. Null is unknown, zero is known zero. */
	tax_rate?: number | null;
	/** State component of the ZIP reference rate, in percent. Null when unknown. */
	tax_rate_state?: number | null;
	/** County component of the ZIP reference rate, in percent. Null when unknown. */
	tax_rate_county?: number | null;
	/** City component of the ZIP reference rate, in percent. Null when unknown. */
	tax_rate_city?: number | null;
	/** Special component of the ZIP reference rate, in percent. Null when unknown. */
	tax_rate_special?: number | null;
	neighbors: string[];
	/** Missing/null is unknown; [] is an observed result outside all covered areas. */
	metros?: PostalMetro[] | null;
	/** Median annual property tax payable on owner-occupied homes in this statistical area. Null when unsupported, missing or censored. */
	property_tax?: PropertyTax | null;
}

export interface PhoneDeep {
	/** NPA-derived state code (US/CA). */
	state: string | null;
	state_name: string | null;
	/** Numbering-plan IANA zone. Null when the prefix covers more than one zone, or invalid. Not the handset. */
	timezone: string | null;
}

export interface CarrierDeep {
	/** Issuing rate-center city. */
	city: string | null;
	state: string | null;
	state_name: string | null;
}

export interface HlrDeep {
	/** Network diagnostics available from the last check. Null when unconfirmed. */
	roaming: boolean | null;
	roaming_network: string | null;
	/** ISO2, uppercase. */
	roaming_country: string | null;
	/** Serving network name at the last check. */
	network: string | null;
	original_network: string | null;
	mcc: string | null;
	mnc: string | null;
}

export interface LanguageDeep {
	iso3: string | null;
	countries: string[];
}

export interface NameDeep {
	gender: 'male' | 'female' | null;
	salutation: 'Mr' | 'Ms' | null;
	/** Compact name using CLDR formatting rules. */
	short?: string | null;
	/** Name formatted for a directory listing. */
	directory?: string | null;
	/** Name initials using CLDR formatting rules. */
	initials?: string | null;
}

/** How an offsetless source wall time selected an instant. */
export interface TimeResolution {
	kind?: string | null;
	policy?: string | null;
	/** Signed wall-clock adjustment. Zero for unique and overlapping times. */
	adjustment_seconds?: number | null;
	/** Chronological alternatives. Empty means the wall time is unique. */
	alternatives?: TimeResolutionAlternative[] | null;
}

export interface TimeResolutionAlternative {
	at?: string | null;
	unix?: number | null;
	offset?: string | null;
}

export interface TimezoneDeep {
	/** Rule-defined standard offset. Seasonal changes may be negative. */
	standard_offset?: string | null;
	standard_offset_seconds?: number | null;
	dst_offset_seconds?: number | null;
	/** Current DST-flag interval, or the next within 400 days. */
	season?: TimeSeason | null;
	/** Pinned rules used by canonical Time. */
	timezone_database_version?: string | null;
	/** Null when no offsetless conversion was resolved. */
	resolution?: TimeResolution | null;
	name: string | null;
	/** Whole minutes, truncated toward zero for historical second offsets. */
	offset_minutes: number | null;
	offset_seconds?: number | null;
	next_dst: TimezoneNextDst | null;
}

export interface TimezoneConversionTargetDeep {
	name: string | null;
	offset_minutes: number;
	offset_seconds?: number;
}

export interface DateInfoDeep {
	year: number | null;
	month: number | null;
	month_name: string | null;
	day: number | null;
	/** ISO weekday, Monday 1 to Sunday 7. */
	weekday: number | null;
	weekday_name: string | null;
	/** ISO 8601 week number. */
	week: number | null;
	/** The year that ISO week belongs to. Differs from year around January 1. */
	week_year: number | null;
	day_of_year: number | null;
	quarter: number | null;
	leap: boolean | null;
	days_in_month: number | null;
}

export interface EmojiDeep {
	subcategory?: string | null;
	base?: string | null;
	variants?: EmojiVariant[];
	codepoints: string[];
	hex: string;
	status: string | null;
	version: string | null;
	keywords: string[];
	skins: EmojiSkin[];
	artwork?: Record<string, EmojiArtwork>;
}

export interface NaicsDeep {
	description: string | null;
	children: NaicsChild[];
	/** Classification exclusions. Omitted or null on older responses. */
	exclusions?: NaicsExclusion[] | null;
}

export interface CountryEmergency {
	police: string | null;
	ambulance: string | null;
	fire: string | null;
}

export interface PostalMetrosDeep {
	metros?: PostalMetro[] | null;
}





export interface PointCity {
	name: string;
	name_local: string | null;
	type: string | null;
	state: string | null;
	state_name: string | null;
	country: string;
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	distance: number;
	distance_mi: number;
	id: string;
}

export interface WeatherCurrentDeep {
	dewpoint: number | null;
	dewpoint_f: number | null;
	wind_gust: number | null;
	wind_gust_mph: number | null;
	pressure: number | null;
	pressure_inhg: number | null;
	visibility: number | null;
	visibility_mi: number | null;
}

/** Property-tax estimate for an area, not a specific property. */
export interface PropertyTax {
	/** Median annual tax payable, in currency units adjusted to the final year of period. Not a tax rate or an individual property bill. */
	annual_median: number;
	/** ISO 4217 currency code, currently USD. */
	currency: string;
	/** Reporting period, YYYY-YYYY. Monetary amounts use the final year of this period. */
	period: string;
}

export interface TimeLocationInput { type: string; value: string; }
export interface TimeLocationCandidate {
	id?: string | null;
	name?: string | null;
	country?: string | null;
	state?: string | null;
	timezone?: string | null;
	latitude?: number | null;
	longitude?: number | null;
}
export interface TimeLocation {
	input: TimeLocationInput;
	status: string;
	candidates: TimeLocationCandidate[];
	truncated: boolean;
	source?: string;
}

// Industry names for the existing US NAICS response contract.
export type Industry = Naics;
export type IndustryChild = NaicsChild;
export type IndustryCorrection = NaicsCorrection;
export type IndustryDeep = NaicsDeep;
export type IndustryExclusion = NaicsExclusion;
export type IndustryMatch = NaicsMatch;
export type IndustrySearch = NaicsSearch;
export type IndustrySearchItem = NaicsSearchItem;


export interface Bin {
	bin: string;
	/** Actual longest matched prefix. May be shorter than the input. */
	prefix: string | null;
	country: string | null;
	issuer: string | null;
	/** Network key (visa, amex) or co-branded combination. */
	brand: string | null;
	/** Display name for brand (American Express). */
	brand_name: string | null;
	type: string | null;
	prepaid: boolean | null;
	deep?: Record<string, never>;
}

export interface EmojiParse { emojis: (Emoji & {positions: EmojiPosition[]})[]; }
export interface EmojiConversion { text: string; unresolved: EmojiUnresolved[]; }


export type CityGrain = 'municipality' | 'subdivision' | 'locality' | 'metropolitan_area';

export interface CityParent {
	id: string;
	name: string | null;
	name_local: string | null;
	country: string;
	state: string | null;
	type: string | null;
	grain: CityGrain | null;
}

export interface CityMatch { type: string; source: string; value: string; language: string | null; edit_distance: number | null }

export interface CityAmbiguityCandidate {
	id: string;
	object: 'city';
	name?: string | null;
	name_local?: string | null;
	country?: string | null;
	country_name?: string | null;
	state?: string | null;
	state_name?: string | null;
	type?: string | null;
}

export type CityResource = City & { object: 'city'; distance?: number; distance_mi?: number };

export interface CityCollection {
	object: 'list';
	data: CityResource[];
	has_more?: boolean;
	url?: string;
	/** Opaque, query-bound continuation. Keep the same options on the next call. */
	next_cursor: string | null;
	q?: string;
	country?: string;
	state?: string | null;
	type?: string;
	grain?: CityGrain;
	aliases?: boolean;
	city?: string;
	radius?: number;
	unit?: string;
}

export interface CityList extends CityCollection {}

export interface CityRelations extends CityCollection {
	city_id: string;
	relationship: 'children' | 'ancestors' | 'siblings';
	coverage: 'partial';
	parent_id?: string | null;
}

export interface CityDistance {
	object: 'city_distance';
	from: string;
	to: string;
	/** Great-circle kilometers between stored centers; null when coordinates are unknown. */
	distance: number | null;
	distance_mi: number | null;
	method: 'great_circle';
}

export interface CityNearbyCoordinates extends CityCollection {
	latitude: number;
	longitude: number;
	radius: number;
	unit: string;
}
