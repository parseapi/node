/**
 * Response types for the ParseAPI public API.
 * Shapes are append-only upstream, so these only ever grow.
 * Every field inside a deep object is optional and nullable: the API ships
 * `deep: {}` when deep was requested but is not unlocked on the plan.
 */
/** The `deep` key is omitted unless the request asked for it. */
type Deep<T> = Partial<{
    [K in keyof T]: T[K] | null;
}>;
interface MeasureChoice {
    unit: string;
    name: string;
}
/** A parsed measurement. Amount is a decimal string, preserving the API's precision. */
interface Measure {
    measure: string;
    valid: boolean;
    type: string | null;
    amount: string | null;
    unit: string | null;
    reason: string | null;
    choices: MeasureChoice[];
}
interface MeasureUnit {
    unit: string;
    name: string;
    type: string;
    aliases: string[];
}
interface MeasureUnits {
    units: MeasureUnit[];
}
interface IpDeep {
    state: string;
    city: string;
    registry: string;
    datacenter: boolean;
    relay: boolean;
    tor: boolean;
    vpn: boolean;
    provider: string;
}
interface Ip {
    ip: string;
    country: string | null;
    country_name: string | null;
    continent: string | null;
    asn: string | null;
    asn_name: string | null;
    deep?: Deep<IpDeep>;
}
interface Continent {
    continent: string;
    name: string;
    region: string;
    subregion: string;
    population: number | null;
    area: number | null;
    emoji: string;
}
interface ContinentCountryItem {
    country: string;
    name: string;
    emoji?: string | null;
    calling_code?: string | null;
}
interface ContinentCountries {
    continent: string;
    countries: ContinentCountryItem[];
}
interface Bloc {
    bloc: string;
    name: string;
    /** Current member count. An entity fact, not a list-length field. */
    members: number;
}
interface BlocCountryItem {
    country: string;
    name: string;
    emoji?: string | null;
    calling_code?: string | null;
}
interface BlocCountries {
    bloc: string;
    countries: BlocCountryItem[];
}
interface Country {
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
interface CountryStateItem {
    state: string;
    name: string;
    type: string | null;
}
interface CountryStates {
    country: string;
    states: CountryStateItem[];
}
interface State {
    state: string;
    name: string;
    local_name: string | null;
    type: string | null;
    country: string;
    country_name: string | null;
    latitude: number | null;
    longitude: number | null;
    population: number | null;
    /** Total area in km2. */
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
interface StateDistrictItem {
    district: string;
    name: string;
    type: string | null;
}
interface StateDistricts {
    state: string;
    state_name: string | null;
    country: string;
    country_name: string | null;
    districts: StateDistrictItem[];
}
interface District {
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
    /** Total area in km2 (land + water, or the official total). */
    area: number | null;
    /** Land area in km2. Null when the source publishes total only. */
    land_area: number | null;
    /** Water area in km2. Null when the source publishes total only. */
    water_area: number | null;
    seat: string | null;
    timezone: string | null;
    timezones: string[];
}
interface City {
    name: string;
    local_name: string | null;
    type: string | null;
    /** What this city is the capital of: country, state, or null. */
    capital_of: 'country' | 'state' | null;
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
    /** Total area in km2 (land + water, or the official total). */
    area: number | null;
    /** Land area in km2. Null when the source publishes total only. */
    land_area: number | null;
    /** Water area in km2. Null when the source publishes total only. */
    water_area: number | null;
    timezone: string | null;
    /** Minted parse id (`city_` + 12 chars). Stable pin via `/city/id/{id}`. */
    id: string;
}
/** Nearest-city lookups add the distance from the query point. */
interface CityNearest extends City {
    distance: number;
    distance_mi: number;
}
interface CitySearch {
    q: string;
    country?: string;
    state?: string;
    cities: City[];
}
interface CityNearby {
    city: string;
    state: string | null;
    country: string;
    radius: number;
    unit: string;
    nearby: CityNearest[];
}
/** An area's share of ZIP addresses, with category shares measured independently. */
interface PostalMetro {
    code: string;
    name: string;
    type: string;
    share: number | null;
    residential_share: number | null;
    business_share: number | null;
    other_share: number | null;
}
interface Postal {
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
    /** Total area in km2. Null when the source has no water split. */
    area: number | null;
    /** Land area in km2. Null where the source has none. */
    land_area: number | null;
    /** Water area in km2. Null where the source has none. */
    water_area: number | null;
    timezone: string | null;
    currency: string | null;
    neighbors: string[];
    /** Missing/null is unknown; [] is an observed result outside all covered areas. */
    metros?: PostalMetro[] | null;
}
interface PostalNearbyItem {
    postal: string;
    city: string | null;
    state: string | null;
    country: string;
    distance: number;
    distance_mi: number;
    metros?: PostalMetro[] | null;
}
interface PostalNearby {
    postal: string;
    country: string;
    radius: number;
    unit: string;
    metros?: PostalMetro[] | null;
    nearby: PostalNearbyItem[];
}
interface PostalDistanceEnd {
    postal: string;
    city: string | null;
    metros?: PostalMetro[] | null;
}
interface PostalDistance {
    country: string;
    from: PostalDistanceEnd;
    to: PostalDistanceEnd;
    distance: number;
    distance_mi: number;
}
interface EmailDeep {
    deliverable: boolean;
    catchall: boolean;
}
interface Email {
    email: string;
    didyoumean: string | null;
    valid: boolean;
    domain: string | null;
    domain_valid: boolean | null;
    role: boolean;
    disposable: boolean;
    deep?: Deep<EmailDeep>;
}
interface VatAddress {
    street: string | null;
    city: string | null;
    postal: string | null;
    country: string | null;
}
interface VatDeep {
    registered: boolean | null;
    name: string | null;
    address: VatAddress | null;
    consultation: string | null;
    /** Registry timestamp of this check, ISO. */
    consulted_at: string | null;
}
interface Vat {
    vat: string | null;
    valid: boolean;
    country: string | null;
    from?: string;
    deep?: Deep<VatDeep>;
}
interface Iban {
    iban: string | null;
    valid: boolean;
    country: string | null;
    /** Print form in groups of four, for display. Null when invalid. */
    formatted: string | null;
    /** Two check digits as a string, keeping a leading zero. */
    checksum: string | null;
    /** Bank identifier parsed from the number, not a name. */
    bank: string | null;
    /** Institution name from the national bank-code directory. Null when unsourced. */
    bank_name: string | null;
    /** BIC from that same directory. Null when unsourced or missing. */
    bic: string | null;
    /** Branch identifier when that country has one. */
    branch: string | null;
    account: string | null;
}
interface Npi {
    /** Normalized 10-digit NPI. Invalid input still echoes the fold. */
    npi: string | null;
    valid: boolean;
    /** Exists in the CMS NPPES registry. */
    registered: boolean | null;
    active: boolean | null;
    /** Date CMS deactivated the NPI, YYYY-MM-DD. Null when still active. */
    deactivated_at: string | null;
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
interface NpiEnrollment {
    /** part_a, part_b, practitioner, dme, order_refer, mdpp. Null when the code is unknown. */
    type: string | null;
    specialty: string | null;
    state: string | null;
}
interface NpiDeep {
    /** In the published Medicare FFS enrollment extract. */
    medicare?: boolean | null;
    /** On the CMS opt-out affidavit list. Matched by NPI only. */
    opt_out?: boolean | null;
    /** Enrollment rows. [] when medicare is false. */
    enrollments?: NpiEnrollment[] | null;
}
interface TariffMeasure {
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
interface TariffDeep {
    /** The origin country the measures were resolved for. */
    origin?: string | null;
    /** Composed ad valorem percent. Null when the components do not compose cleanly. */
    effective_rate?: number | null;
    /** Every Chapter 99 tariff measure that applies to this code from this origin. */
    measures?: TariffMeasure[] | null;
}
interface Tariff {
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
    deep?: Deep<TariffDeep>;
}
interface TariffSearchHit {
    hts: string;
    description: string;
    general: string | null;
}
interface TariffSearch {
    q: string;
    revision: string;
    /** Up to 20 tariff lines, best match first. */
    lines: TariffSearchHit[];
}
interface VinRecall {
    /** Government campaign number. */
    campaign: string;
    /** Report date, ISO YYYY-MM-DD. */
    date: string | null;
    component: string | null;
    /** The filed summary verbatim. */
    summary: string | null;
}
interface VinDeep {
    /** Open recall campaigns for the decoded vehicle. [] when none, null when the registry did not answer. */
    recalls?: VinRecall[] | null;
}
interface Vin {
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
interface Phone {
    phone: string | null;
    valid: boolean;
    country: string | null;
    /** What the numbering plan can see. Never voip (that is the carrier field's word). Null when invalid. */
    type: 'mobile' | 'landline' | 'toll_free' | 'unknown' | null;
    /** NPA-derived state code (US/CA). */
    state: string | null;
    state_name: string | null;
    /** Numbering-plan IANA zone. Null when the prefix covers more than one zone, or invalid. Not the handset. */
    timezone: string | null;
    national: string | null;
    international: string | null;
    /** Always empty. The metered proves are their own endpoints: carrier, caller, hlr. */
    deep?: Record<string, never>;
}
interface Carrier {
    phone: string | null;
    valid: boolean;
    country: string | null;
    /** The network's word, including voip. Null when invalid. */
    type: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown' | null;
    /** Current carrier display name. Null when the probe had no answer. */
    carrier: string | null;
    /** Carrier is a known burner number app. Null when carrier is unknown. */
    burner: boolean | null;
    /** Issuing rate-center city. */
    city: string | null;
    state: string | null;
    state_name: string | null;
}
interface Caller {
    phone: string | null;
    valid: boolean;
    country: string | null;
    /** CNAM record verbatim (all-caps telco artifact). Null when no record, outside NANP, or invalid. */
    caller: string | null;
}
interface Hlr {
    phone: string | null;
    valid: boolean;
    country: string | null;
    /** Assigned to a subscriber. Null when invalid. */
    live: boolean | null;
    /** Handset reachable right now. Null means unconfirmed, never no. */
    connected: boolean | null;
    /** The six network extras fill on live HLR dips only. Null elsewhere (NANP, failover). */
    roaming: boolean | null;
    roaming_network: string | null;
    /** ISO2, uppercase. */
    roaming_country: string | null;
    /** Current serving network name. */
    network: string | null;
    original_network: string | null;
    mcc: string | null;
    mnc: string | null;
}
interface MxRecord {
    priority: number;
    host: string;
}
interface DomainRegistration {
    registered: boolean;
    created: string | null;
    updated: string | null;
    expires: string | null;
    registrar: string | null;
    status: string[];
    dnssec: boolean;
}
interface DomainDeep {
    a: string[];
    aaaa: string[];
    ns: string[];
    mx: MxRecord[];
    txt: string[];
    mailhost: string;
    registration: DomainRegistration;
}
interface Domain {
    domain: string;
    available: boolean;
    deep?: Deep<DomainDeep>;
}
/** Network identity for an autonomous system number. */
interface Asn {
    asn: number;
    name: string | null;
    country: string | null;
    country_name: string | null;
}
/** A normalized 48-bit address. Vendor names the registered assignment holder. */
interface Mac {
    mac: string;
    valid: boolean;
    vendor: string | null;
    local: boolean | null;
    multicast: boolean | null;
}
/** Card-prefix reference data. Null means unknown, not an invalid payment card. */
interface Bin {
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
interface DnsRecord {
    name: string;
    type: string;
    /** Remaining cache lifetime in seconds. */
    ttl: number;
    value: string;
}
interface Dns {
    domain: string;
    records: DnsRecord[];
}
interface Mx {
    domain: string;
    mx: MxRecord[];
}
interface UseragentDeviceDeep {
    type: string | null;
    brand: string | null;
    model: string | null;
    cpu: string | null;
    touchscreen: boolean | null;
}
interface UseragentOsDeep {
    name: string | null;
    version: string | null;
    platform: string | null;
}
interface UseragentBrowserBrand {
    brand: string;
    version: string;
}
interface UseragentBrowserDeep {
    name: string | null;
    version: string | null;
    type: string | null;
    brands?: UseragentBrowserBrand[];
}
interface UseragentEngineDeep {
    name: string | null;
    version: string | null;
}
interface UseragentDeep {
    device: UseragentDeviceDeep;
    os: UseragentOsDeep;
    browser: UseragentBrowserDeep;
    engine: UseragentEngineDeep;
    headless: boolean;
    bot?: Record<string, unknown>;
    ai?: boolean;
}
interface Useragent {
    useragent: string;
    device: string | null;
    os: string | null;
    browser: string | null;
    bot: boolean;
    mobile: boolean;
    deep?: Deep<UseragentDeep>;
}
interface Currency {
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
interface Language {
    language: string;
    iso3: string | null;
    name: string;
    local_name: string | null;
    script: string | null;
    direction: 'ltr' | 'rtl' | string;
    countries: string[];
}
/** A parsed person name. Junk input returns valid: false, never an error. Gender comes from dictionary data and is null when the data does not decide. */
interface Name {
    name: string;
    valid: boolean;
    /** Name membership is independent of gender. */
    known: boolean;
    /** Associated countries, not the person's nationality. */
    countries: string[];
    prefix: string | null;
    first: string | null;
    middle: string | null;
    last: string | null;
    suffix: string | null;
    gender: 'male' | 'female' | null;
    salutation: 'Mr' | 'Ms' | null;
}
interface CurrencyRate {
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
interface TimezoneNextDst {
    at: string;
    dst: boolean;
    offset: string;
    abbreviation: string;
}
interface Timezone {
    latitude?: number;
    longitude?: number;
    timezone: string | null;
    name: string | null;
    abbreviation: string | null;
    offset: string | null;
    /** Whole minutes, truncated toward zero for historical second offsets. */
    offset_minutes: number | null;
    offset_seconds?: number | null;
    dst: boolean | null;
    next_dst: TimezoneNextDst | null;
    /** Resolved local ISO time with its UTC offset. */
    at?: string;
    /** Unix seconds for the resolved instant. */
    unix?: number | null;
    /** With to= only: the other zone at the same instant. to.at is the converted time. */
    to?: TimezoneConversionTarget;
}
/** Current time and timezone facts. Null clock fields mean the coordinates did not resolve. */
interface Time extends Omit<Timezone, 'at' | 'unix' | 'to'> {
    at: string | null;
    unix: number | null;
    offset_seconds: number | null;
    to?: TimezoneConversionTarget | null;
}
/** The other side of a timezone conversion. `at` is the converted wall time. */
interface TimezoneConversionTarget {
    timezone: string;
    name: string | null;
    abbreviation: string | null;
    offset: string;
    offset_minutes: number;
    offset_seconds?: number;
    dst: boolean;
    at: string;
    unix?: number;
}
/**
 * Calendar facts for one date. Junk or ambiguous input returns valid: false,
 * never an error. `to` and `days` appear only when a to= date was passed.
 */
interface DateInfo {
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
interface Holiday {
    date: string;
    name: string;
    local_name: string | null;
    /** 'public' for an official day off, 'observance' for cultural days. */
    type: string;
    regions: string[] | null;
    substitute: boolean;
}
interface HolidayYear {
    country: string;
    year: number;
    holidays: Holiday[];
}
interface HolidayDate {
    country: string;
    date: string;
    holiday: Holiday | null;
}
interface Elevation {
    latitude: number;
    longitude: number;
    elevation: number | null;
    elevation_ft: number | null;
    resolution: number | null;
}
interface PointDeep {
    city: CityNearest | null;
    timezone: Timezone | null;
}
interface Point {
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
interface WeatherForecastPeriod {
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
interface WeatherAlert {
    event: string;
    severity: string | null;
    urgency: string | null;
    headline: string | null;
    onset: string | null;
    expires: string | null;
}
interface WeatherHour {
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
interface WeatherMinute {
    at: string;
    precipitation: number | null;
    precipitation_in: number | null;
    type: string | null;
}
interface WeatherDay {
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
interface WeatherAir {
    aqi: number | null;
    aqi_name: string | null;
    pm2_5: number | null;
    pm10: number | null;
}
interface WeatherHistory {
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
interface WeatherDeep {
    forecast: WeatherForecastPeriod[] | null;
    alerts: WeatherAlert[] | null;
    minutes: WeatherMinute[] | null;
    hours: WeatherHour[] | null;
    days: WeatherDay[] | null;
    air: WeatherAir | null;
    /** Only present when the call carried ?date=. */
    history?: WeatherHistory | null;
}
interface WeatherCurrent {
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
interface WeatherStation {
    id: string;
    name: string | null;
    distance: number | null;
    distance_mi: number | null;
}
interface WeatherSource {
    id: string;
    name: string | null;
}
interface Weather {
    latitude: number;
    longitude: number;
    current: WeatherCurrent;
    station: WeatherStation | null;
    source: WeatherSource;
    deep?: Deep<WeatherDeep>;
}
interface EmojiSkin {
    emoji: string;
    tone: string;
    unicode: string | null;
    hex: string | null;
}
interface Emoji {
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
interface EmojiSearch {
    q: string;
    emojis: Emoji[];
}
interface Address {
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
interface AddressSuggestion {
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
interface AddressSearch {
    q: string;
    postal?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    addresses: AddressSuggestion[];
}
interface CompanyCountry {
    name: string | null;
    blocs: string[];
    tax: string | null;
}
interface CompanyDeep {
    country: CompanyCountry | null;
    postal: Postal | null;
    city: City | null;
}
interface Company {
    company: string | null;
    valid: boolean;
    registered: boolean | null;
    country: string | null;
    type: string | null;
    name: string | null;
    active: boolean | null;
    activity: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    state_name: string | null;
    postal: string | null;
    country_name: string | null;
    vat: string | null;
    gst: boolean | null;
    acn: string | null;
    siren: string | null;
    siege: boolean | null;
    kind: string | null;
    invoice: string | null;
    deep?: Deep<CompanyDeep>;
}
/** A direct child industry code. */
interface NaicsChild {
    naics: string;
    name: string;
}
/** A classification exclusion. Generic exclusions can have no linked codes. */
interface NaicsExclusion {
    description: string;
    codes: NaicsChild[];
}
/** A query token corrected only during typo fallback. */
interface NaicsCorrection {
    from: string;
    to: string;
}
/** The actual title, activity term or code that matched a search. */
interface NaicsMatch {
    /** Currently name, term or naics. Future fields remain decodable. */
    field: string;
    text: string;
    /** Empty for exact, plural and prefix matches. */
    corrections: NaicsCorrection[];
}
/** US NAICS 2022 definition and hierarchy, including two-digit sector ranges. */
interface Naics {
    naics: string;
    name: string;
    description: string | null;
    /** Hierarchy depth, from 2 (sector) to 6 (national industry). */
    level: number;
    parent: string | null;
    parent_name: string | null;
    children: NaicsChild[];
    /** Classification exclusions. Omitted or null on older responses. */
    exclusions?: NaicsExclusion[] | null;
    /** Search evidence. Omitted on direct lookup and older responses. */
    match?: NaicsMatch | null;
    year: number;
    country: string;
}
interface NaicsSearch {
    q: string;
    year: number;
    country: string;
    results: Naics[];
}

/** Every non-2xx response from the API. Branch on `code`, never on `message`. */
declare class ParseAPIError extends Error {
    /** HTTP status */
    readonly status: number;
    /** Machine-readable error code, e.g. 'not_found', 'invalid_api_key', 'rate_limited' */
    readonly code: string;
    /** Link to the docs section for this error */
    readonly docs: string | null;
    /** Send this if you contact support */
    readonly requestId: string | null;
    constructor(status: number, code: string, message: string, docs: string | null, requestId: string | null);
}
interface RequestOptions {
    /** Cancel this call, including any retry wait. */
    signal?: AbortSignal;
    /** Timeout for each attempt, in milliseconds. Overrides the client setting. */
    timeoutMs?: number;
    /** Explicit retry count. Paid attempts can each consume usage. */
    retries?: number;
}
interface ParseAPIOptions {
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
type IpOptions = DeepOption & RequestOptions;
type IpSelfOptions = DeepOption & RequestOptions;
type ContinentOptions = RequestOptions;
type ContinentCountriesOptions = RequestOptions;
type BlocOptions = RequestOptions;
type BlocCountriesOptions = RequestOptions;
type CountryOptions = RequestOptions;
type CountryStatesOptions = RequestOptions;
type StateOptions = {
    country?: string;
} & RequestOptions;
type StateDistrictsOptions = {
    country?: string;
} & RequestOptions;
type DistrictOptions = {
    country?: string;
    state?: string;
} & RequestOptions;
type CityOptions = {
    country?: string;
    state?: string;
} & RequestOptions;
type CityIdOptions = RequestOptions;
type CitySearchOptions = {
    country?: string;
    state?: string;
    limit?: number;
} & RequestOptions;
type CityNearestOptions = RequestOptions;
type CityNearbyOptions = {
    radius?: number;
    unit?: 'km' | 'mi';
    country?: string;
    state?: string;
    limit?: number;
} & RequestOptions;
/** Pass country when known. Codes shared by multiple countries need it. */
type PostalOptions = {
    country?: string;
} & RequestOptions;
type PostalNearbyOptions = {
    country?: string;
    radius?: number;
    unit?: 'km' | 'mi';
} & RequestOptions;
type PostalDistanceOptions = {
    country?: string;
} & RequestOptions;
type AddressOptions = {
    country?: string;
} & DeepOption & RequestOptions;
type AddressSearchOptions = {
    country?: string;
    postal?: string;
    city?: string;
    state?: string;
    ip?: string;
} & RequestOptions;
type CompanyOptions = {
    country?: string;
} & DeepOption & RequestOptions;
/** `deep: true` requests a metered deliverability check. No automatic retries by default. */
type EmailOptions = DeepOption & RequestOptions;
/** `deep: true` requests a metered registry check where supported. `from` is your own VAT number. */
type VatOptions = {
    country?: string;
    from?: string;
} & DeepOption & RequestOptions;
type IbanOptions = {
    country?: string;
} & RequestOptions;
type NpiOptions = DeepOption & RequestOptions;
/** Country resolves national-number ambiguity. `deep: true` returns an empty object. */
type PhoneOptions = {
    country?: string;
} & DeepOption & RequestOptions;
type CarrierOptions = {
    country?: string;
} & RequestOptions;
type CallerOptions = {
    country?: string;
} & RequestOptions;
type HlrOptions = {
    country?: string;
} & RequestOptions;
type DomainOptions = DeepOption & RequestOptions;
type AsnOptions = RequestOptions;
type MacOptions = RequestOptions;
/** Card-prefix reference lookup. Deep returns an empty object on every plan. */
type BinOptions = DeepOption & RequestOptions;
/** Parse a measurement, optionally converting it. Locale and system resolve explicit ambiguity. */
type MeasureOptions = {
    to?: string;
    locale?: string;
    system?: 'us' | 'imperial';
} & RequestOptions;
type MeasureUnitsOptions = {
    query?: string;
    type?: string;
    unit?: string;
} & RequestOptions;
/** Published DNS records. Omit type to check all ten supported types. Values retain DNS presentation syntax. */
type DnsOptions = {
    type?: string;
} & RequestOptions;
type MxOptions = RequestOptions;
type UseragentOptions = DeepOption & RequestOptions;
type VinOptions = DeepOption & RequestOptions;
/** US NAICS 2022 code lookup, using pooled requests. */
type NaicsOptions = RequestOptions;
/** Keyword search. Limit defaults to 10 and accepts 1-50. */
type NaicsSearchOptions = {
    limit?: number;
} & RequestOptions;
type TariffOptions = {
    origin?: string;
} & DeepOption & RequestOptions;
type TariffSearchOptions = RequestOptions;
type CurrencyOptions = RequestOptions;
type CurrencyRateOptions = {
    date?: string;
    amount?: number;
} & RequestOptions;
type LanguageOptions = RequestOptions;
/** Country is an ISO2 context for the optional gender estimate. */
type NameOptions = {
    country?: string;
} & RequestOptions;
type TimeOptions = {
    at?: string;
    to?: string;
} & RequestOptions;
type TimeAtOptions = {
    at?: string;
    to?: string;
} & RequestOptions;
type TimezoneOptions = {
    at?: string;
    to?: string;
} & RequestOptions;
type TimezoneAtOptions = {
    at?: string;
} & RequestOptions;
type DateOptions = {
    format?: 'mdy' | 'dmy';
    to?: string;
} & RequestOptions;
type DateTodayOptions = {
    to?: string;
} & RequestOptions;
type HolidayOptions = {
    year?: number;
} & RequestOptions;
type HolidayDateOptions = RequestOptions;
type ElevationOptions = RequestOptions;
type PointOptions = DeepOption & RequestOptions;
type WeatherOptions = DeepOption & {
    date?: string;
} & RequestOptions;
type EmojiOptions = RequestOptions;
type EmojiSearchOptions = {
    limit?: number;
} & RequestOptions;
interface DeepOption {
    /** Request endpoint-specific enrichment. Email/VAT checks are metered, IP is plan-included, and phone adds no fields. See the operation's help. */
    deep?: boolean;
}
declare function parseAPI(apiKey?: string, options?: ParseAPIOptions): {
    /** Look up an IP. `deep: true` adds enrichment included with a paid plan, without a separate check meter. */
    ip: ((ip: string, opts?: IpOptions) => Promise<Ip>) & {
        /** Look up the public IP making this request. On a server, this is the server's IP. */
        self: (opts?: IpSelfOptions) => Promise<Ip>;
    };
    continent: ((code: string, opts?: ContinentOptions) => Promise<Continent>) & {
        countries: (code: string, opts?: ContinentCountriesOptions) => Promise<ContinentCountries>;
    };
    bloc: ((code: string, opts?: BlocOptions) => Promise<Bloc>) & {
        countries: (code: string, opts?: BlocCountriesOptions) => Promise<BlocCountries>;
    };
    country: ((code: string, opts?: CountryOptions) => Promise<Country>) & {
        states: (code: string, opts?: CountryStatesOptions) => Promise<CountryStates>;
    };
    state: ((code: string, opts?: StateOptions) => Promise<State>) & {
        districts: (code: string, opts?: StateDistrictsOptions) => Promise<StateDistricts>;
    };
    district: (code: string, opts?: DistrictOptions) => Promise<District>;
    city: ((name: string, opts?: CityOptions) => Promise<City>) & {
        id: (id: string, opts?: CityIdOptions) => Promise<City>;
        search: (query: string, opts?: CitySearchOptions) => Promise<CitySearch>;
        nearest: (lat: number, lon: number, opts?: CityNearestOptions) => Promise<CityNearest>;
        nearby: (name: string, opts?: CityNearbyOptions) => Promise<CityNearby>;
    };
    /** Look up a postal area. Pass country when known. Check nullable latitude/longitude before another location lookup. */
    postal: ((code: string, opts?: PostalOptions) => Promise<Postal>) & {
        nearby: (code: string, opts?: PostalNearbyOptions) => Promise<PostalNearby>;
        distance: (from: string, to: string, opts?: PostalDistanceOptions) => Promise<PostalDistance>;
    };
    address: ((address: string, opts?: AddressOptions) => Promise<Address>) & {
        search: (query: string, opts?: AddressSearchOptions) => Promise<AddressSearch>;
    };
    company: (number: string, opts?: CompanyOptions) => Promise<Company>;
    /**
     * Parse an email and check its format and domain.
     * `deep: true` explicitly requests a metered deliverability check using included checks or enabled on-demand usage.
     * Deep checks default to one attempt. An explicit retry count can repeat paid usage.
     */
    email: (email: string, opts?: EmailOptions) => Promise<Email>;
    /** Check VAT format and checksum. `deep: true` requests a metered registry check where supported, with no automatic retries by default. */
    vat: (number: string, opts?: VatOptions) => Promise<Vat>;
    iban: (iban: string, opts?: IbanOptions) => Promise<Iban>;
    npi: (npi: string, opts?: NpiOptions) => Promise<Npi>;
    /** Parse a phone number and its formats. Pass country for national numbers when needed. Deep adds no fields. */
    phone: (number: string, opts?: PhoneOptions) => Promise<Phone>;
    /** Request a metered carrier lookup. No automatic retries by default. */
    carrier: (number: string, opts?: CarrierOptions) => Promise<Carrier>;
    /** Request a metered caller-name lookup for a NANP number. No automatic retries by default. */
    caller: (number: string, opts?: CallerOptions) => Promise<Caller>;
    /** Request a metered live-status lookup. Null status means unconfirmed. No automatic retries by default. */
    hlr: (number: string, opts?: HlrOptions) => Promise<Hlr>;
    domain: (domain: string, opts?: DomainOptions) => Promise<Domain>;
    asn: (asn: string, opts?: AsnOptions) => Promise<Asn>;
    mac: (mac: string, opts?: MacOptions) => Promise<Mac>;
    /** Look up a 6-11 digit card prefix. Keep leading zeros in the input string. */
    bin: (bin: string, opts?: BinOptions) => Promise<Bin>;
    /** Parse a measurement or convert it to `to`. Without `to`, use its type's canonical unit. Invalid input is plain data with `valid: false`. */
    measure: ((measure: string, opts?: MeasureOptions) => Promise<Measure>) & {
        /** Discover reviewed units. Pass `unit` to find compatible conversion targets. */
        units: (opts?: MeasureUnitsOptions) => Promise<MeasureUnits>;
    };
    /** Look up DNS records with TTLs. Type selects the question and may include its CNAME chain. Pooled on every plan. */
    dns: (domain: string, opts?: DnsOptions) => Promise<Dns>;
    mx: (domain: string, opts?: MxOptions) => Promise<Mx>;
    useragent: (ua: string, opts?: UseragentOptions) => Promise<Useragent>;
    vin: (vin: string, opts?: VinOptions) => Promise<Vin>;
    /** US NAICS 2022 definitions and hierarchy. */
    naics: ((code: string, opts?: NaicsOptions) => Promise<Naics>) & {
        search: (query: string, opts?: NaicsSearchOptions) => Promise<NaicsSearch>;
    };
    tariff: ((code: string, opts?: TariffOptions) => Promise<Tariff>) & {
        search: (query: string, opts?: TariffSearchOptions) => Promise<TariffSearch>;
    };
    currency: ((code: string, opts?: CurrencyOptions) => Promise<Currency>) & {
        rate: (base: string, quote: string, opts?: CurrencyRateOptions) => Promise<CurrencyRate>;
    };
    language: (code: string, opts?: LanguageOptions) => Promise<Language>;
    name: (name: string, opts?: NameOptions) => Promise<Name>;
    /** Current local time, UTC by default. With to, offsetless at is source wall time. */
    time: ((timezone?: string, opts?: TimeOptions) => Promise<Time>) & {
        at: (lat: number, lon: number, opts?: TimeAtOptions) => Promise<Time>;
    };
    timezone: ((id: string, opts?: TimezoneOptions) => Promise<Timezone>) & {
        at: (lat: number, lon: number, opts?: TimezoneAtOptions) => Promise<Timezone>;
    };
    date: ((date: string, opts?: DateOptions) => Promise<DateInfo>) & {
        today: (opts?: DateTodayOptions) => Promise<DateInfo>;
    };
    holiday: ((country: string, opts?: HolidayOptions) => Promise<HolidayYear>) & {
        date: (country: string, date: string, opts?: HolidayDateOptions) => Promise<HolidayDate>;
    };
    elevation: (lat: number, lon: number, opts?: ElevationOptions) => Promise<Elevation>;
    point: (lat: number, lon: number, opts?: PointOptions) => Promise<Point>;
    /** Get weather for a point. Both unit systems are returned. Pass known coordinates from a postal, city, or location result. */
    weather: (lat: number, lon: number, opts?: WeatherOptions) => Promise<Weather>;
    emoji: ((emoji: string, opts?: EmojiOptions) => Promise<Emoji>) & {
        search: (query: string, opts?: EmojiSearchOptions) => Promise<EmojiSearch>;
    };
};
type ParseAPIClient = ReturnType<typeof parseAPI>;

export { type Address, type AddressOptions, type AddressSearch, type AddressSearchOptions, type AddressSuggestion, type Asn, type AsnOptions, type Bin, type BinOptions, type Bloc, type BlocCountries, type BlocCountriesOptions, type BlocCountryItem, type BlocOptions, type Caller, type CallerOptions, type Carrier, type CarrierOptions, type City, type CityIdOptions, type CityNearby, type CityNearbyOptions, type CityNearest, type CityNearestOptions, type CityOptions, type CitySearch, type CitySearchOptions, type Company, type CompanyCountry, type CompanyDeep, type CompanyOptions, type Continent, type ContinentCountries, type ContinentCountriesOptions, type ContinentCountryItem, type ContinentOptions, type Country, type CountryOptions, type CountryStateItem, type CountryStates, type CountryStatesOptions, type Currency, type CurrencyOptions, type CurrencyRate, type CurrencyRateOptions, type DateInfo, type DateOptions, type DateTodayOptions, type Deep, type District, type DistrictOptions, type Dns, type DnsOptions, type DnsRecord, type Domain, type DomainDeep, type DomainOptions, type DomainRegistration, type Elevation, type ElevationOptions, type Email, type EmailDeep, type EmailOptions, type Emoji, type EmojiOptions, type EmojiSearch, type EmojiSearchOptions, type EmojiSkin, type Hlr, type HlrOptions, type Holiday, type HolidayDate, type HolidayDateOptions, type HolidayOptions, type HolidayYear, type Iban, type IbanOptions, type Ip, type IpDeep, type IpOptions, type IpSelfOptions, type Language, type LanguageOptions, type Mac, type MacOptions, type Measure, type MeasureChoice, type MeasureOptions, type MeasureUnit, type MeasureUnits, type MeasureUnitsOptions, type Mx, type MxOptions, type MxRecord, type Naics, type NaicsChild, type NaicsCorrection, type NaicsExclusion, type NaicsMatch, type NaicsOptions, type NaicsSearch, type NaicsSearchOptions, type Name, type NameOptions, type Npi, type NpiDeep, type NpiEnrollment, type NpiOptions, type ParseAPIClient, ParseAPIError, type ParseAPIOptions, type Phone, type PhoneOptions, type Point, type PointDeep, type PointOptions, type Postal, type PostalDistance, type PostalDistanceEnd, type PostalDistanceOptions, type PostalMetro, type PostalNearby, type PostalNearbyItem, type PostalNearbyOptions, type PostalOptions, type RequestOptions, type State, type StateDistrictItem, type StateDistricts, type StateDistrictsOptions, type StateOptions, type Tariff, type TariffDeep, type TariffMeasure, type TariffOptions, type TariffSearch, type TariffSearchHit, type TariffSearchOptions, type Time, type TimeAtOptions, type TimeOptions, type Timezone, type TimezoneAtOptions, type TimezoneConversionTarget, type TimezoneNextDst, type TimezoneOptions, type Useragent, type UseragentBrowserBrand, type UseragentBrowserDeep, type UseragentDeep, type UseragentDeviceDeep, type UseragentEngineDeep, type UseragentOptions, type UseragentOsDeep, type Vat, type VatAddress, type VatDeep, type VatOptions, type Vin, type VinDeep, type VinOptions, type VinRecall, type Weather, type WeatherAir, type WeatherAlert, type WeatherCurrent, type WeatherDay, type WeatherDeep, type WeatherForecastPeriod, type WeatherHistory, type WeatherHour, type WeatherMinute, type WeatherOptions, type WeatherSource, type WeatherStation, parseAPI };
