/**
 * Response types for the parseAPI public API.
 * Shapes are append-only upstream, so these only ever grow.
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
	numeric: number;
	name: string;
	region: string;
	subregion: string;
	population: number | null;
	area: number | null;
	emoji: string;
}

export interface ContinentCountryItem {
	country: string;
	name: string;
}

export interface ContinentCountries {
	continent: string;
	countries: ContinentCountryItem[];
}

export interface Country {
	country: string;
	iso3: string;
	numeric: number;
	name: string;
	full_name: string | null;
	local_name: string | null;
	capital: string | null;
	continent: string;
	region: string | null;
	subregion: string | null;
	population: number | null;
	area: number | null;
	currency: string | null;
	currency_name: string | null;
	currency_symbol: string | null;
	tld: string | null;
	flag_emoji: string | null;
	languages: string[];
	borders: string[];
	demonym: string | null;
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
	country: string;
	state: string;
	name: string;
	local_name: string | null;
	type: string | null;
	latitude: number | null;
	longitude: number | null;
	population: number | null;
	area: number | null;
	timezone: string | null;
}

export interface StateDistrictItem {
	district: string;
	name: string;
	type: string | null;
}

export interface StateDistricts {
	country: string;
	state: string;
	districts: StateDistrictItem[];
}

export interface District {
	country: string;
	state: string | null;
	district: string;
	name: string;
	type: string | null;
	population: number | null;
	latitude: number | null;
	longitude: number | null;
	area_land: number | null;
	area_water: number | null;
}

export interface City {
	/** Minted parse id (`city_` + 12 chars). Stable pin via `/city/id/{id}`. */
	id: string;
	country: string;
	state: string | null;
	state_name: string | null;
	name: string;
	local_name: string | null;
	latitude: number | null;
	longitude: number | null;
	population: number | null;
	timezone: string | null;
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
	cities: City[];
}

export interface Postal {
	postal: string;
	city: string | null;
	city_local: string | null;
	state: string | null;
	state_name: string | null;
	state_name_local: string | null;
	district: string | null;
	district_name: string | null;
	district_name_local: string | null;
	country: string;
	latitude: number | null;
	longitude: number | null;
	timezone: string | null;
	currency: string | null;
	elevation: number | null;
	elevation_ft: number | null;
	population: number | null;
	neighbors: string[];
}

export interface PostalNearbyItem {
	postal: string;
	city: string | null;
	state: string | null;
	country: string;
	distance: number;
	distance_mi: number;
}

export interface PostalNearby {
	country: string;
	postal: string;
	radius: number;
	unit: string;
	nearby: PostalNearbyItem[];
}

export interface PostalDistanceEnd {
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
	deliverable: boolean;
	catchall: boolean;
}

export interface Email {
	email: string;
	valid: boolean;
	domain: string | null;
	domain_valid: boolean | null;
	role: boolean;
	disposable: boolean;
	deep?: Deep<EmailDeep>;
}

export interface PhoneDeep {
	type: 'mobile' | 'landline' | 'toll_free' | 'unknown';
	region: string;
}

export interface Phone {
	valid: boolean;
	e164: string | null;
	country: string | null;
	national: string | null;
	international: string | null;
	deep?: Deep<PhoneDeep>;
}

export interface MxRecord {
	priority: number;
	host: string;
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
	a: string[];
	aaaa: string[];
	ns: string[];
	mx: MxRecord[];
	txt: string[];
	provider: string;
	registration: DomainRegistration;
}

export interface Domain {
	domain: string;
	available: boolean;
	deep?: Deep<DomainDeep>;
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

export interface Currency {
	currency: string;
	numeric: number | null;
	name: string;
	name_plural: string | null;
	symbol: string | null;
	symbol_native: string | null;
	digits: number | null;
	countries: string[];
}

/** One language by BCP 47 shortest code (en) or ISO 639-3 (eng). Codes are lowercase. */
export interface Language {
	language: string;
	iso3: string | null;
	name: string;
	local_name: string | null;
	script: string | null;
	direction: 'ltr' | 'rtl' | string;
	countries: string[];
}

export interface CurrencyRate {
	base: string;
	quote: string;
	rate: number;
	date: string;
	source?: string;
}

export interface TimezoneNextDst {
	at: string;
	dst: boolean;
	offset: string;
	abbreviation: string;
}

export interface Timezone {
	id: string;
	abbreviation: string;
	offset: string;
	offset_minutes: number;
	dst: boolean;
	name: string | null;
	next_dst: TimezoneNextDst | null;
}

export interface Holiday {
	date: string;
	name: string;
	local_name: string | null;
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

export interface PointDeep {
	city: CityNearest;
	timezone: Timezone;
}

export interface Point {
	latitude: number;
	longitude: number;
	elevation: number | null;
	elevation_ft: number | null;
	resolution: number | null;
	country: string | null;
	country_name: string | null;
	state: string | null;
	state_name: string | null;
	district: string | null;
	district_name: string | null;
	deep?: Deep<PointDeep>;
}

export interface WeatherForecastPeriod {
	name: string;
	start: string;
	end: string;
	daytime: boolean;
	temp: number | null;
	temp_f: number | null;
	precip: number | null;
	wind: string | null;
	wind_dir: string | null;
	conditions: string | null;
}

export interface WeatherAlert {
	event: string;
	severity: string | null;
	urgency: string | null;
	headline: string | null;
	onset: string | null;
	expires: string | null;
}

export interface WeatherDeep {
	forecast: WeatherForecastPeriod[];
	alerts: WeatherAlert[];
}

export interface Weather {
	latitude: number;
	longitude: number;
	temp: number | null;
	temp_f: number | null;
	feels_like: number | null;
	feels_like_f: number | null;
	humidity: number | null;
	wind_speed: number | null;
	wind_speed_mph: number | null;
	wind_dir: number | string | null;
	pressure: number | null;
	pressure_inhg: number | null;
	conditions: string | null;
	conditions_name: string | null;
	observed_at: string | null;
	station: string;
	station_name: string | null;
	station_distance: number;
	station_distance_mi: number;
	source: string;
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
	codepoints: string[];
	hex: string;
	category: string | null;
	status: string | null;
	version: string | null;
	keywords: string[];
	skins: EmojiSkin[];
}

export interface EmojiSearch {
	q: string;
	emojis: Emoji[];
}
