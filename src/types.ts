/**
 * Response types for the ParseAPI public API.
 * Core answers the common task; optional deep reveals the reviewed detail.
 * Every field inside a deep object is optional and nullable: the API ships
 * `deep: {}` when deep was requested but is not unlocked on the plan.
 */

/** The `deep` key is omitted unless the request asked for it. */
export type Deep<T> = Partial<{ [K in keyof T]: T[K] | null }>;

export interface MeasureChoice {
	unit: string;
	name: string;
}

/** A parsed measurement. Amount is a decimal string, preserving the API's precision. */
export interface Measure {
	measure: string;
	valid: boolean;
	type: string | null;
	amount: string | null;
	unit: string | null;
	reason: string | null;
	choices: MeasureChoice[];
}

export interface MeasureUnit {
	unit: string;
	name: string;
	type: string;
	aliases: string[];
}

export interface MeasureUnits {
	units: MeasureUnit[];
}

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
	/** Reporting year or period for population (YYYY or YYYY-YYYY). Null when unknown or unverifiable. */
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
	name: string;
	local_name: string | null;
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
	local_name: string | null;
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
	/** Reporting year or period for population (YYYY or YYYY-YYYY). Null when unknown or unverifiable. */
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
	name: string;
	local_name: string | null;
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
	/** Registry timestamp of this check, ISO. */
	consulted_at: string | null;
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
	/** Bank identifier parsed from the number, not a name. */
	bank: string | null;
	/** Institution name from the national bank-code directory. Null when unsourced. */
	bank_name: string | null;
	/** BIC from that same directory. Null when unsourced or missing. */
	bic: string | null;
	deep?: Deep<IbanDeep>;
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
	deep?: Deep<NpiDeep>;
}

export interface NpiEnrollment {
	/** part_a, part_b, practitioner, dme, order_refer, mdpp. Null when the code is unknown. */
	type: string | null;
	specialty: string | null;
	state: string | null;
}

export interface NpiDeep {
	/** In the published Medicare FFS enrollment extract. */
	medicare?: boolean | null;
	/** On the CMS opt-out affidavit list. Matched by NPI only. */
	opt_out?: boolean | null;
	/** Enrollment rows. [] when medicare is false. */
	enrollments?: NpiEnrollment[] | null;
	/** Date CMS deactivated the NPI, YYYY-MM-DD. Null when still active. */
	deactivated_at: string | null;
}

export interface TariffMeasure {
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
	/** True when the published measure has additional eligibility conditions. */
	conditional?: boolean | null;
}

export interface TariffDeep {
	/** The origin country the measures were resolved for. */
	origin?: string | null;
	/** Composed ad valorem percent. Null when the components do not compose cleanly. */
	effective_rate?: number | null;
	/** Every Chapter 99 tariff measure that applies to this code from this origin. */
	measures?: TariffMeasure[] | null;
	/** Units of quantity (No., kg). */
	units: string[];
	/** Column 1 special rate, verbatim. */
	special: string | null;
	/** Column 2 rate, verbatim. */
	other: string | null;
}

export interface Tariff {
	/** Normalized code with dots (8471.30.01.00). */
	hts: string;
	/** The schedule line verbatim. */
	description: string;
	/** Parent descriptions from the schedule outline, outermost first. */
	lineage: string[];
	/** Column 1 general rate, verbatim. */
	general: string | null;
	/** The official release that answered (2026HTSRev17). */
	revision: string;
	deep?: Deep<TariffDeep>;
}

export interface TariffSearchHit {
	hts: string;
	description: string;
	general: string | null;
}

export interface TariffSearch {
	q: string;
	revision: string;
	/** Up to 20 tariff lines, best match first. */
	lines: TariffSearchHit[];
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
	series: string | null;
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
}

export interface Vin {
	/** Normalized VIN, uppercase, no spaces. Invalid input still echoes the fold. */
	vin: string | null;
	valid: boolean;
	year: number | null;
	make: string | null;
	model: string | null;
	trim: string | null;
	/** Body style (sedan, coupe, suv, pickup). */
	body: string | null;
	/** Vehicle type (passenger car, truck, motorcycle, bus, trailer). */
	type: string | null;
	deep?: Deep<VinDeep>;
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

/** A normalized 48-bit address. Vendor names the registered assignment holder. */
export interface Mac {
	mac: string;
	valid: boolean;
	vendor: string | null;
	local: boolean | null;
	multicast: boolean | null;
}

/** Card-prefix reference data. Null means unknown, not an invalid payment card. */
export interface Bin {
	bin: string;
	/** Actual longest matched prefix. May be shorter than the input. */
	prefix: string | null;
	country: string | null;
	issuer: string | null;
	brand: string | null;
	type: string | null;
	prepaid: boolean | null;
	deep?: Record<string, never>;
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

export interface Currency {
	currency: string;
	name: string;
	symbol: string | null;
	symbol_native: string | null;
	digits: number | null;
	deep?: Deep<CurrencyDeep>;
}

/** One language by BCP 47 shortest code (en) or ISO 639-3 (eng). Codes are lowercase. */
export interface Language {
	language: string;
	name: string;
	local_name: string | null;
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

/** Current time and timezone facts. Null clock fields mean the coordinates did not resolve. */
export interface Time extends Timezone {
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
}


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
	/** Reporting year or period for population (YYYY or YYYY-YYYY). Null when unknown or unverifiable. */
	population_period?: string | null;
	area: number | null;
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

export interface StateDeep {
	population: number | null;
	/** Reporting year or period for population (YYYY or YYYY-YYYY). Null when unknown or unverifiable. */
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
	/** Reporting year or period for population (YYYY or YYYY-YYYY). Null when unknown or unverifiable. */
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
	/** Reporting year or period for population (YYYY or YYYY-YYYY). Null when unknown or unverifiable. */
	population_period?: string | null;
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
	/** Reporting year or period for population (YYYY or YYYY-YYYY). Null when unknown or unverifiable. */
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

export interface IbanDeep {
	/** Two check digits as a string, keeping a leading zero. */
	checksum: string | null;
	/** Branch identifier when that country has one. */
	branch: string | null;
	account: string | null;
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

export interface CurrencyDeep {
	numeric: number | null;
	name_plural: string | null;
	countries: string[];
}

export interface LanguageDeep {
	iso3: string | null;
	countries: string[];
}

export interface NameDeep {
	/** Name membership is independent of gender. */
	known: boolean;
	/** Associated countries, not the person's nationality. */
	countries: string[];
	gender: 'male' | 'female' | null;
	salutation: 'Mr' | 'Ms' | null;
}

export interface TimezoneDeep {
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
	codepoints: string[];
	hex: string;
	status: string | null;
	version: string | null;
	keywords: string[];
	skins: EmojiSkin[];
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
	local_name: string | null;
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
