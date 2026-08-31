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

export interface Bloc {
	bloc: string;
	name: string;
	/** Current member count. An entity fact, not a list-length field. */
	members: number;
}

export interface BlocCountryItem {
	country: string;
	name: string;
	emoji?: string | null;
	calling_code?: string | null;
}

export interface BlocCountries {
	bloc: string;
	countries: BlocCountryItem[];
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
	/** Bloc memberships (EU, SCHENGEN, NATO, ...). Empty when none. */
	blocs: string[];
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
	timezones: string[];
	iso_3166_2: string | null;
	fips: string | null;
	capital: string | null;
	area_codes: string[];
	tax: string | null;
	tax_rate: number | null;
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
	seat: string | null;
	timezone: string | null;
	timezones: string[];
}

export interface City {
	name: string;
	local_name: string | null;
	type: string | null;
	capital: 'country' | 'state' | null;
	state: string | null;
	state_name: string | null;
	district: string | null;
	district_name: string | null;
	country: string;
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	elevation: number | null;
	elevation_ft: number | null;
	population: number | null;
	land_area: number | null;
	water_area: number | null;
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

export interface CityNearby {
	city: string;
	state: string | null;
	country: string;
	radius: number;
	unit: string;
	nearby: CityNearest[];
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
	country_name: string | null;
	latitude: number | null;
	longitude: number | null;
	elevation: number | null;
	elevation_ft: number | null;
	population: number | null;
	land_area: number | null;
	water_area: number | null;
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
	didyoumean: string | null;
	valid: boolean;
	domain: string | null;
	domain_valid: boolean | null;
	role: boolean;
	disposable: boolean;
	deep?: Deep<EmailDeep>;
}

export interface VatAddress {
	street: string | null;
	city: string | null;
	postal: string | null;
	country: string | null;
}

export interface VatDeep {
	registered: boolean | null;
	name: string | null;
	address: VatAddress | null;
	consultation: string | null;
	consulted: string | null;
}

export interface Vat {
	vat: string | null;
	valid: boolean;
	country: string | null;
	from?: string;
	deep?: Deep<VatDeep>;
}

export interface Iban {
	iban: string | null;
	valid: boolean;
	country: string | null;
	/** Print form in groups of four, for display. Null when invalid. */
	formatted: string | null;
	/** Two check digits as a string, keeping a leading zero. */
	checksum: string | null;
	/** Bank identifier parsed from the number, not a name. */
	bank: string | null;
	/** Branch identifier when that country has one. */
	branch: string | null;
	account: string | null;
}

export interface Npi {
	/** Normalized 10-digit NPI. Invalid input still echoes the fold. */
	npi: string | null;
	valid: boolean;
	/** Exists in the CMS NPPES registry. */
	registered: boolean | null;
	active: boolean | null;
	/** On the OIG exclusion list. */
	excluded: boolean | null;
	/** individual or organization. */
	type: string | null;
	name: string | null;
	first: string | null;
	last: string | null;
	credential: string | null;
	specialty: string | null;
	/** NUCC taxonomy code. */
	taxonomy: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	state_name: string | null;
	postal: string | null;
	country: string | null;
	phone: string | null;
}

export interface HtsMeasure {
	/** Chapter 99 heading, dotted (9903.01.24). */
	heading: string;
	/** The measure text verbatim. */
	description: string;
	/** The rate string verbatim ("The duty provided in the applicable subheading + 10%"). */
	rate: string | null;
	/** Effective from, ISO YYYY-MM-DD. Null when the schedule states none. */
	from: string | null;
	/** Expires, ISO YYYY-MM-DD. Null when open-ended. */
	until: string | null;
}

export interface HtsDeep {
	/** The origin country the measures were resolved for. */
	origin?: string | null;
	/** Composed ad valorem percent. Null when the components do not compose cleanly. */
	effective_rate?: number | null;
	/** Every Chapter 99 tariff measure that applies to this code from this origin. */
	measures?: HtsMeasure[] | null;
}

export interface Hts {
	/** Normalized code with dots (8471.30.01.00). */
	hts: string;
	/** The schedule line verbatim. */
	description: string;
	/** Parent descriptions from the schedule outline, outermost first. */
	lineage: string[];
	/** Units of quantity (No., kg). */
	units: string[];
	/** Column 1 general rate, verbatim. */
	general: string | null;
	/** Column 1 special rate, verbatim. */
	special: string | null;
	/** Column 2 rate, verbatim. */
	other: string | null;
	/** The official release that answered (2026HTSRev17). */
	revision: string;
	deep?: Deep<HtsDeep>;
}

export interface HtsSearchHit {
	hts: string;
	description: string;
	general: string | null;
}

export interface HtsSearch {
	q: string;
	revision: string;
	/** Up to 20 lines, best match first. */
	codes: HtsSearchHit[];
}

export interface VinRecall {
	/** Government campaign number. */
	campaign: string;
	/** Report date, ISO YYYY-MM-DD. */
	date: string | null;
	component: string | null;
	/** The filed summary verbatim. */
	summary: string | null;
}

export interface VinDeep {
	/** Open recall campaigns for the decoded vehicle. [] when none, null when the registry did not answer. */
	recalls?: VinRecall[] | null;
}

export interface Vin {
	/** Normalized VIN, uppercase, no spaces. Invalid input still echoes the fold. */
	vin: string | null;
	valid: boolean;
	year: number | null;
	make: string | null;
	model: string | null;
	trim: string | null;
	series: string | null;
	/** Body style (sedan, coupe, suv, pickup). */
	body: string | null;
	/** Vehicle type (passenger car, truck, motorcycle, bus, trailer). */
	type: string | null;
	doors: number | null;
	cylinders: number | null;
	/** Engine displacement in liters. */
	displacement: number | null;
	fuel: string | null;
	horsepower: number | null;
	/** fwd, rwd, awd, 4wd. */
	drive: string | null;
	/** automatic, manual, cvt. */
	transmission: string | null;
	manufacturer: string | null;
	plant_city: string | null;
	plant_state: string | null;
	plant_country: string | null;
	/** Gross vehicle weight rating class as filed. */
	gvwr: string | null;
	deep?: Deep<VinDeep>;
}

export interface Phone {
	phone: string | null;
	valid: boolean;
	/** What the numbering plan can see. Never voip (that is the carrier field's word). Present when valid. */
	type?: 'mobile' | 'landline' | 'toll_free' | 'unknown';
	/** NPA-derived state code (US/CA). Present when valid. */
	state?: string | null;
	state_name?: string | null;
	country: string | null;
	national?: string | null;
	international?: string | null;
	/** Always empty. The metered proves are their own endpoints: carrier, caller, hlr. */
	deep?: Record<string, never>;
}

export interface Carrier {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** The network's word, including voip. Present when valid. */
	type?: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown';
	/** Current carrier display name. Null when the probe had no answer. */
	carrier?: string | null;
	/** Carrier is a known burner number app. Null when carrier is unknown. */
	burner?: boolean | null;
	/** Issuing rate-center city. */
	city?: string | null;
	state?: string | null;
	state_name?: string | null;
}

export interface Caller {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** CNAM record verbatim (all-caps telco artifact). Null when no record or outside NANP. Present when valid. */
	caller?: string | null;
}

export interface Hlr {
	phone: string | null;
	valid: boolean;
	country: string | null;
	/** Assigned to a subscriber. Present when valid. */
	live?: boolean | null;
	/** Handset reachable right now. Null means unconfirmed, never no. */
	connected?: boolean | null;
	/** The six network extras fill on live HLR dips only. Null elsewhere (NANP, failover). */
	roaming?: boolean | null;
	roaming_network?: string | null;
	/** ISO2, uppercase. */
	roaming_country?: string | null;
	/** Current serving network name. */
	network?: string | null;
	original_network?: string | null;
	mcc?: string | null;
	mnc?: string | null;
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

export interface SanctionsMatch {
	/** OFAC uid, stable across publications. */
	id: number;
	list: 'sdn' | 'consolidated';
	type: 'individual' | 'entity' | 'vessel' | 'aircraft';
	/** Listed primary name, verbatim. */
	name: string;
	/** Official sanctions program codes (SDGT, CUBA, IRGC). */
	programs: string[];
}

export interface Sanctions {
	/** The name you passed, folded to its match key. */
	name: string;
	/** On an official OFAC list as published. false is not clearance. */
	sanctioned: boolean;
	/** Official records matched. Empty when sanctioned is false. */
	matches: SanctionsMatch[];
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
	name: string | null;
	abbreviation: string | null;
	offset: string | null;
	offset_minutes: number | null;
	dst: boolean | null;
	next_dst: TimezoneNextDst | null;
	/** With to= only: the resolved wall time in the from zone, ISO with its UTC offset. */
	at?: string;
	/** With to= only: the other zone at the same instant. to.at is the converted time. */
	to?: TimezoneConversionTarget;
}

/** The other side of a timezone conversion. `at` is the converted wall time. */
export interface TimezoneConversionTarget {
	timezone: string;
	name: string | null;
	abbreviation: string | null;
	offset: string;
	offset_minutes: number;
	dst: boolean;
	at: string;
}

/**
 * Calendar facts for one date. Junk or ambiguous input returns valid: false,
 * never an error. `to` and `days` appear only when a to= date was passed.
 */
export interface DateInfo {
	date: string;
	valid: boolean;
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
	city: CityNearest | null;
	timezone: Timezone | null;
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
}

export interface WeatherCurrent {
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
}

export interface WeatherStation {
	id: string;
	name: string | null;
	distance: number | null;
	distance_mi: number | null;
}

export interface WeatherSource {
	id: string;
	name: string | null;
}

export interface Weather {
	latitude: number;
	longitude: number;
	current: WeatherCurrent;
	station: WeatherStation | null;
	source: WeatherSource;
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
