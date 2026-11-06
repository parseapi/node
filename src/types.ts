/** API 2.1 response types. Optional requested detail lives at its natural resource home. */

/** Optional requested detail fields are nullable and live on the resource. */
export type Deep<T> = Partial<{ [K in keyof T]: T[K] | null }>;

export interface IpDeep {
	/** Approximate range geography; postal comes only from supported operator declarations. */
	state_name?: string | null;
	postal?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	timezone?: string | null;
	network?: string | null;
	asn_type?: string | null;
	proxy?: boolean | null;
	/** asn_type classifies the origin AS, not subscriber connection technology.
	 * proxy=false means unlisted; null means the evidence block is incomplete. */

	state: string;
	city: string;
	registry: string;
	datacenter: boolean;
	relay: boolean;
	tor: boolean;
	vpn: boolean;
	provider: string;
	/** Present only when a district is supported, with the response country. */
	district?: string | null;
	district_name?: string | null;
	/** U.S. Census geography, when independently supported. */
	census_division?: string | null;
	census_region?: string | null;
}

export interface Ip extends Omit<Deep<IpDeep>, 'asn' | 'asn_name' | 'continent' | 'country' | 'country_name' | 'ip'> {
	ip: string;
	country: string | null;
	country_name: string | null;
	continent: string | null;
	asn: string | null;
	asn_name: string | null;

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

export interface Country extends Omit<Deep<CountryDeep>, 'blocs' | 'borders' | 'calling_code' | 'capital' | 'capital_lat' | 'capital_lon' | 'continent' | 'country' | 'currency' | 'currency_name' | 'currency_symbol' | 'demonym' | 'emoji' | 'flag' | 'full_name' | 'iso3' | 'iso_alpha3' | 'iso_numeric' | 'languages' | 'name' | 'name_full' | 'name_local' | 'numeric' | 'postal_format' | 'postal_regex' | 'region' | 'subregion' | 'timezones'> {
	country: string;
	name: string;
	name_local: string | null;
	continent: string;
	currency: string | null;
	currency_name: string | null;
	currency_symbol: string | null;
	calling_code: string | null;
	flag: string | null;
	/** @deprecated Present only in earlier response payloads. */
	emoji?: string | null;
	languages: string[] | null;

	/** IANA timezones used by the country. */
	timezones: string[] | null;
	/** ISO 3166-1 alpha-3 country code. */
	iso_alpha3?: string | null;
	/** ISO 3166-1 numeric country code. */
	iso_numeric?: number | null;
	/** @deprecated Older servers use iso3. Read iso_alpha3 on the current contract. */
	iso3?: string | null;
	/** @deprecated Older servers use numeric. Read iso_numeric on the current contract. */
	numeric?: number | null;
	/** Official long name. */
	name_full?: string | null;
	/** @deprecated Legacy wire spelling; retained for earlier responses. */
	full_name?: string | null;
	demonym?: string | null;
	region?: string | null;
	subregion?: string | null;
	capital?: CountryCapital | null;
	capital_lat?: number | null;
	capital_lon?: number | null;
	borders?: string[] | null;
	blocs?: string[] | null;
	/** Core postal input hint on every plan. Older responses may omit it. */
	postal_format?: string | null;
	/** Core postal syntax pattern on every plan, not proof of existence or deliverability. Older responses may omit it. */
	postal_regex?: string | null;
}

export interface CountryCapital {
 name: string | null;
 latitude: number | null;
 longitude: number | null;
}

export interface CountryTax {
 name: string | null;
 rate: number | null;
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

export interface StateCapital {
	name: string | null;
	latitude: number | null;
	longitude: number | null;
}

export interface State extends Omit<Deep<StateDeep>, 'area_codes' | 'capital' | 'country' | 'country_name' | 'fips' | 'iso' | 'iso_subdivision' | 'latitude' | 'longitude' | 'name' | 'name_local' | 'state' | 'timezones' | 'type'> {
	state: string;
	name: string;
	name_local: string | null;
	type: string | null;
	country: string;
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	timezones: string[];
	/** Full ISO 3166-2 subdivision code, including its country prefix. */
	iso_subdivision?: string | null;
	/** @deprecated Legacy candidate spelling. Read iso_subdivision on the current contract. */
	iso?: string | null;
	fips: string | null;
	area_codes: string[] | null;
	capital: StateCapital;

}

export interface StateDistrictItem extends Omit<Deep<StateDistrictDeep>, 'district' | 'name' | 'type'> {
	district: string | null;
	name: string | null;
	type: string | null;

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

export interface District extends Omit<Deep<DistrictDeep>, 'country' | 'country_name' | 'district' | 'latitude' | 'longitude' | 'name' | 'state' | 'state_name' | 'timezones' | 'type'> {
	district: string;
	name: string;
	type: string | null;
	state: string | null;
	state_name: string | null;
	country: string;
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	timezones: string[];

}

export interface City extends Omit<Deep<CityDeep>, 'country' | 'country_name' | 'district' | 'district_name' | 'grain' | 'id' | 'latitude' | 'longitude' | 'match' | 'name' | 'name_local' | 'name_romanized' | 'parent' | 'romanization_language' | 'state' | 'state_name' | 'timezone' | 'type'> {
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
	/** Percentage of ZIP addresses, from 0 to 100; null or absent is unknown. */
	share_percent?: number | null;
}

/** A supported Australian postcode suburb choice, independent of the scalar city. */
export interface PostalLocality {
	city: string;
	state: string;
	state_name: string;
}

export interface Postal extends Omit<Deep<PostalDeep>, 'city' | 'city_local' | 'country' | 'country_name' | 'district' | 'district_name' | 'district_name_local' | 'latitude' | 'localities' | 'longitude' | 'postal' | 'state' | 'state_name' | 'state_name_local' | 'tax' | 'tax_rate' | 'tax_rate_city' | 'tax_rate_county' | 'tax_rate_special' | 'tax_rate_state' | 'timezone' | 'type'> {
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

	/** Open ZIP type, including future values. Missing or null means unknown. */
	type?: string | null;
	tax?: PostalTax | null;
}

export interface PostalNearbyItem extends Omit<Deep<PostalMetrosDeep>, 'city' | 'country' | 'distance' | 'distance_mi' | 'postal' | 'state'> {
	postal: string;
	city: string | null;
	state: string | null;
	country: string;
	distance: number;
	distance_mi: number;

}

export interface PostalNearby extends Omit<Deep<PostalMetrosDeep>, 'country' | 'nearby' | 'postal' | 'radius' | 'unit'> {
	postal: string;
	country: string;
	radius: number;
	unit: string;
	nearby: PostalNearbyItem[];

}

export interface PostalDistanceEnd extends Omit<Deep<PostalMetrosDeep>, 'city' | 'postal'> {
	postal: string;
	city: string | null;

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

export interface Email extends Omit<Deep<EmailDeep>, 'didyoumean' | 'disposable' | 'domain' | 'domain_type' | 'domain_valid' | 'email' | 'free' | 'role' | 'valid'> {
	email: string;
	didyoumean: string | null;
	valid: boolean;
	free: boolean;
	domain: string | null;
	domain_type: 'academic' | 'government' | 'military' | null;
	domain_valid: boolean | null;
	role: boolean;
	disposable: boolean;

}

export interface Phone extends Omit<Deep<PhoneDeep>, 'country' | 'international' | 'national' | 'phone' | 'type' | 'valid'> {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** What the numbering plan can see. Never voip (that is the carrier field's word). Null when invalid. */
	type: 'mobile' | 'landline' | 'toll_free' | 'unknown' | null;
	national: string | null;
	international: string | null;

}

export interface Carrier extends Omit<Deep<CarrierDeep>, 'burner' | 'carrier' | 'country' | 'phone' | 'type' | 'valid'> {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** The network's word, including voip. Null when invalid. */
	type: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown' | null;
	/** Current carrier display name. Null when the probe had no answer. */
	carrier: string | null;
	/** Carrier is a known burner number app. Null when carrier is unknown. */
	burner: boolean | null;

}

export interface Caller {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** CNAM record verbatim (all-caps telco artifact). Null when no record, outside NANP, or invalid. */
	caller: string | null;
}

export interface Hlr extends Omit<Deep<HlrDeep>, 'connected' | 'country' | 'live' | 'phone' | 'valid'> {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** Assigned to a subscriber at the last check. Null means unconfirmed. */
	live: boolean | null;
	/** Handset reachable at the last check. Null means unconfirmed, never no. */
	connected: boolean | null;

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

}

export interface DomainRegistration {

	created?: string | null;
	updated?: string | null;
	expires?: string | null;
	registrar?: string | null;
	status?: string[] | null;
	/** Missing or null is unknown; false is a known unsigned observation. */
	dnssec?: boolean | null;
}

export interface DomainDeep {
	registration: DomainRegistration;
}

export interface Domain extends Omit<Deep<DomainDeep>, 'available' | 'domain'> {
	domain: string;
	/** true means unregistered, false means registered, null means unknown. */
	available: boolean | null;

}

/** Network identity for an autonomous system number. */
export interface Asn {
	asn: number;
	name: string | null;
	country: string | null;
	country_name: string | null;
}

/** Network identity from reviewed prefix rules; null means unknown or ambiguous. */
export interface Card extends Omit<Deep<CardDeep>, 'bin' | 'brand' | 'brand_name' | 'logo'> {
	bin: string;
	brand: string | null;
	brand_name: string | null;
	/** SVG URL, with a generic-card fallback. */
	logo: string;
	/** Requested recorded detail on paid plans; existing accounts retain their Deep access. Locked detail is an empty object. */

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

export interface Useragent extends Omit<Deep<UseragentDeep>, 'bot' | 'browser' | 'device' | 'mobile' | 'os' | 'useragent'> {
	useragent: string;
	device: Pick<UseragentDeviceDeep, 'type'> & Deep<Omit<UseragentDeviceDeep, 'type'>>;
	os: Pick<UseragentOsDeep, 'name'> & Deep<Omit<UseragentOsDeep, 'name'>>;
	browser: Pick<UseragentBrowserDeep, 'name'> & Deep<Omit<UseragentBrowserDeep, 'name'>>;
	bot: boolean;
	mobile: boolean;

	bot_details?: Record<string, unknown> | null;
}

/** One language by BCP 47 shortest code (en) or ISO 639-3 (eng). Codes are lowercase. */
export interface Language extends Omit<Deep<LanguageDeep>, 'countries' | 'direction' | 'iso3' | 'iso_alpha3' | 'language' | 'name' | 'name_local' | 'script'> {
	language: string;
	name: string;
	name_local: string | null;
	script: string | null;
	direction: 'ltr' | 'rtl' | string;

	/** ISO 639-3 language code. */
	iso_alpha3?: string | null;
	/** @deprecated Older servers use iso3. Read iso_alpha3 on the current contract. */
	iso3?: string | null;
	countries?: string[] | null;
}

/** A parsed person name. Junk input returns valid: false, never an error. Gender comes from dictionary data and is null when the data does not decide. */
export interface Name extends Omit<Deep<NameDeep>, 'first' | 'last' | 'middle' | 'name' | 'prefix' | 'suffix' | 'valid'> {
	name: string;
	valid: boolean;
	prefix: string | null;
	first: string | null;
	middle: string | null;
	last: string | null;
	suffix: string | null;

}

export interface TimezoneNextDst {
	at: string;
	dst: boolean;
	offset: string;
	abbreviation: string;
}

export interface Timezone extends Omit<Deep<TimezoneDeep>, 'abbreviation' | 'at' | 'dst' | 'latitude' | 'longitude' | 'offset' | 'timezone' | 'to' | 'unix'> {
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
	timezones?: string[];
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
export interface TimezoneConversionTarget extends Omit<Deep<TimezoneConversionTargetDeep>, 'abbreviation' | 'at' | 'dst' | 'offset' | 'timezone' | 'unix'> {
	timezone: string;
	abbreviation: string | null;
	offset: string;
	dst: boolean;
	at: string;
	unix: number;

}

/**
 * Calendar facts for one date. Junk or ambiguous input returns valid: false,
 * never an error. `to` and `days` appear only when a to= date was passed.
 */
export interface DateInfo extends Omit<Deep<DateInfoDeep>, 'date' | 'days' | 'to' | 'unix' | 'valid'> {
	date: string;
	valid: boolean;
	/** Unix time at midnight UTC of that date, seconds. */
	unix: number | null;
	/** With to= only: the other date, normalized ISO. */
	to?: string;
	/** With to= only: signed days to the other date. Future positive. */
	days?: number | null;

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

export interface PointElectoral {
	/** District code string; preserve leading zeros. */
	code: string;
	name: string | null;
	congress: number | null;
}

export interface PointDeep {
	city: PointCity | null;
	/** Missing on older responses; null when no supported district is known. */
	electoral?: PointElectoral | null;
	elevation: number | null;
	elevation_ft: number | null;
	resolution: number | null;
}

export interface Point extends Omit<Deep<PointDeep>, 'country' | 'country_name' | 'district' | 'district_name' | 'latitude' | 'longitude' | 'state' | 'state_name' | 'timezone'> {
	latitude: number;
	longitude: number;
	country: string | null;
	country_name: string | null;
	state: string | null;
	state_name: string | null;
	district: string | null;
	district_name: string | null;

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
	precipitation_rate: number | null;
	precipitation_rate_in: number | null;
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

export interface WeatherCurrent extends Deep<WeatherCurrentDeep> {
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

export interface Weather extends Omit<Deep<WeatherDeep>, 'current' | 'latitude' | 'longitude' | 'station'> {
	latitude: number;
	longitude: number;
	current: WeatherCurrent;
	station: WeatherStation | null;

}

export interface EmojiSkin {
	emoji: string;
	tone: string;
	unicode: string | null;
	hex: string | null;
}

export interface Emoji extends Omit<Deep<EmojiDeep>, 'category' | 'emoji' | 'name' | 'shortcodes'> {
	emoji: string;
	name: string;
	shortcodes: string[];
	category: string | null;

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
  completeness: { complete: boolean | null };


  [field: string]: unknown;
}
export interface EmojiCatalogScope { filters: Record<string, string>; total: number; complete_inventory: boolean; }
export interface EmojiNativeSearchFacts { name: string | null; keywords: string[]; order?: number | null; }
export interface EmojiCatalogSearchFacts { native: Record<string, EmojiNativeSearchFacts>; localized_keywords?: string[]; }
export interface EmojiCatalogData {

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

export interface Company extends Omit<Deep<CompanyDeep>, 'active' | 'address' | 'city' | 'company' | 'country' | 'name' | 'postal' | 'registered' | 'state' | 'type' | 'valid'> {
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
export interface CompanySocialProfile { platform: string | null; url: string; handle?: string | null; }
export interface CompanyPhoneNumber { number: string; type: string | null; 
	country?: string | null;
	e164?: string | null;
}
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
export interface CompanyProfile extends Omit<Deep<CompanyProfileDeep>, 'address' | 'country' | 'id' | 'listings' | 'name' | 'website'> {
	id: string;
	name: string;
	country: string | null;
	website: string | null;
	listings: CompanyProfileListing[] | null;
	address: CompanyProfileAddress | null;

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
export interface Naics extends Omit<Deep<NaicsDeep>, 'country' | 'level' | 'match' | 'naics' | 'name' | 'parent' | 'parent_name' | 'year'> {
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
	/** Latest available GDP in current US dollars. */
	gdp?: number | null;
	/** Latest available GDP per person in current US dollars. */
	gdp_per_capita?: number | null;
	/** Annual percent change; negative values indicate decline. */
	population_growth?: number | null;
	/** Share of population, from 0 to 100. */
	urban_population?: number | null;
	/** Share of population using the internet, from 0 to 100. */
	internet_users?: number | null;
	/** @deprecated Older deep contract. Current ISO identifiers live in Core. */
	iso3: string;
	/** @deprecated Older deep contract. Current iso_numeric lives in Core. */
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
	tax?: CountryTax | null;
	/** @deprecated Historical flat field; current responses use tax.rate. */
	tax_rate?: number | null;
	/** @deprecated Historical flat field; no longer returned. */
	tax_id_format?: string | null;
	/** @deprecated Historical flat field; no longer returned. */
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
	gdp_usd?: number | null;
	gdp_per_capita_usd?: number | null;
	population_growth_percent?: number | null;
	urban_population_percent?: number | null;
	internet_users_percent?: number | null;
	/** Average terrain elevation in meters above sea level. */
	elevation_average?: number | null;
}

export interface CountryElevationPoint {
	name: string | null;
	/** Elevation in metres above sea level. Values below sea level are negative. */
	elevation: number;
}

export interface StateTax {
	name: string | null;
	/** Reference rate in percent. Choose the geographic scope for the task. */
	rate: number | null;
}

export interface PostalTax extends StateTax {
	/** Components of the combined ZIP reference rate, in percent. */
	rate_state: number | null;
	rate_county: number | null;
	rate_city: number | null;
	rate_special: number | null;
}

export interface StateDeep {
	/** @deprecated Older deep contract. Read Core iso_subdivision on the current contract. */
	iso_3166_2?: string | null;
	population: number | null;
	/** @deprecated No longer returned. Retained for source compatibility. */
	population_period?: string | null;
	/** Total area in km2. */
	area: number | null;
	tax: StateTax;
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
	/** Same-country postal codes, preserving leading zeros and source order. */
	neighbors: string[];
	tax?: PostalTax;
	/** Missing/null is unknown; [] is an observed result outside all covered areas. */
	metros?: PostalMetro[] | null;
	/** Median annual property tax payable on owner-occupied homes in this statistical area. Null when unsupported, missing or censored. */
	property_tax?: PostalPropertyTax | null;
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
	/** @deprecated Older deep contract. Read Core iso_alpha3 on the current contract. */
	iso3?: string | null;
	/** @deprecated Older deep contract. Current country associations live in Core. */
	countries?: string[] | null;
}

export interface NameDeep {
	gender: 'male' | 'female' | null;

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

/** Compact Postal property-tax estimate. Currency is supplied by Postal Deep, not repeated here. */
export interface PostalPropertyTax {
	/** Median annual tax payable; not a rate or an individual property bill. */
	annual_median: number;
	/** Legacy richer responses only; absent in the current compact record. */
	currency?: string | null;
	/** Legacy reporting period; absent values stay unknown. */
	period?: string | null;
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
/** Matched place on success, or resolution choices when no clock is available. */
export interface TimeLocation extends TimeLocationCandidate {
	input?: TimeLocationInput;
	status?: string;
	candidates?: TimeLocationCandidate[];
	truncated?: boolean;
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

export interface CityMatch { type: string; value: string; language: string | null; source?: string; edit_distance?: number | null }

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

export interface CityList { cities: City[]; next_cursor: string | null; country?: string; state?: string | null; }

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

export interface CityNearbyCoordinates {
	nearby: CityNearest[];
	next_cursor: string | null;
	latitude: number;
	longitude: number;
	radius: number;
	unit: string;
}

export interface Currency {
	currency: string;
	/** ISO 4217 numeric currency code. */
	iso_numeric?: number | null;
	/** @deprecated Older servers use numeric. Read iso_numeric on the current contract. */
	numeric?: number | null;
	name: string;
	name_plural?: string | null;
	symbol: string | null;
	symbol_native: string | null;
	digits: number | null;
	countries: string[] | null;

}

export interface CurrencyRate {
	base: string;
	quote: string;
	rate: number;
	date: string;
	/** With amount= only: echo of the amount asked. */
	amount?: number;
	/** With amount= only: amount times rate, rounded to the quote currency minor-unit digits. */
	converted?: number;
	source?: string;
}

export type CurrencyDeep = Record<string, never>;

/** Alternative geographic tax references in percent, never additive. */
export interface PostalTax {
 name: string | null;
 rate: number | null;
 rate_state: number | null;
 rate_county: number | null;
 rate_city: number | null;
 rate_special: number | null;
}
