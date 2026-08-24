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
	emoji?: string | null;
	calling_code?: string | null;
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
	demonym: string | null;
	capital: string | null;
	capital_lat: number | null;
	capital_lon: number | null;
	continent: string;
	region: string | null;
	subregion: string | null;
	population: number | null;
	area: number | null;
	currency: string | null;
	currency_name: string | null;
	currency_symbol: string | null;
	tld: string | null;
	calling_code: string | null;
	emoji: string | null;
	languages: string[];
	borders: string[];
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
	local_name: string | null;
	type: string | null;
	country: string;
	country_name: string | null;
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
	population: number | null;
	land_area: number | null;
	water_area: number | null;
}

export interface City {
	name: string;
	local_name: string | null;
	state: string | null;
	state_name: string | null;
	country: string;
	latitude: number | null;
	longitude: number | null;
	population: number | null;
	timezone: string | null;
	/** Minted parse id (`city_` + 12 chars). Stable pin via `/city/id/{id}`. */
	id: string;
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
	district: string | null;
	district_name: string | null;
	district_name_local: string | null;
	state: string | null;
	state_name: string | null;
	state_name_local: string | null;
	country: string;
	latitude: number | null;
	longitude: number | null;
	elevation: number | null;
	elevation_ft: number | null;
	population: number | null;
	timezone: string | null;
	currency: string | null;
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
	postal: string;
	country: string;
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
	type: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown';
	carrier: string | null;
	/** Carrier is a known burner number app. Null when carrier is unknown. */
	burner: boolean | null;
	city: string | null;
	state: string | null;
	state_name: string | null;
}

export interface Phone {
	phone: string | null;
	valid: boolean;
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
	mailhost: string;
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

/** A parsed person name. Junk input returns valid: false, never an error. Gender comes from dictionary data and is null when the data does not decide. */
export interface Name {
	name: string;
	valid: boolean;
	prefix: string | null;
	first: string | null;
	middle: string | null;
	last: string | null;
	suffix: string | null;
	gender: 'male' | 'female' | null;
	salutation: 'Mr' | 'Ms' | null;
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
	timezone: string;
	name: string | null;
	abbreviation: string;
	offset: string;
	offset_minutes: number;
	dst: boolean;
	next_dst: TimezoneNextDst | null;
}

export interface Holiday {
	date: string;
	name: string;
	local_name: string | null;
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

export interface PointDeep {
	city: CityNearest;
	timezone: Timezone;
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
	elevation: number | null;
	elevation_ft: number | null;
	resolution: number | null;
	deep?: Deep<PointDeep>;
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

export interface WeatherDeep {
	forecast: WeatherForecastPeriod[];
	alerts: WeatherAlert[];
}

export interface Weather {
	latitude: number;
	longitude: number;
	temperature: number | null;
	temperature_f: number | null;
	feels_like: number | null;
	feels_like_f: number | null;
	dewpoint: number | null;
	dewpoint_f: number | null;
	humidity: number | null;
	wind_speed: number | null;
	wind_speed_mph: number | null;
	wind_gust: number | null;
	wind_gust_mph: number | null;
	wind_direction: number | null;
	pressure: number | null;
	pressure_inhg: number | null;
	visibility: number | null;
	visibility_mi: number | null;
	condition: string | null;
	condition_name: string | null;
	condition_emoji: string | null;
	observed_at: string | null;
	station: string;
	station_name: string | null;
	station_distance: number;
	station_distance_mi: number;
	source: string;
	source_name: string | null;
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
