/**
 * Response types for the ParseAPI public API.
 * Core answers the common task; optional deep reveals the reviewed detail.
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
    /** Reporting year or period for population (YYYY or YYYY-YYYY). Null when unknown or unverifiable. */
    population_period?: string | null;
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
    timezone: string | null;
    timezones: string[];
    iso_3166_2: string | null;
    deep?: Deep<StateDeep>;
}
interface StateDistrictItem {
    district: string | null;
    name: string | null;
    type: string | null;
    deep?: Deep<StateDistrictDeep>;
}
interface StateDistrictDeep {
    population: number | null;
    /** Reporting year or period for population (YYYY or YYYY-YYYY). Null when unknown or unverifiable. */
    population_period?: string | null;
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
    timezone: string | null;
    timezones: string[];
    deep?: Deep<DistrictDeep>;
}
interface City {
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
    timezone: string | null;
    deep?: Deep<PostalDeep>;
}
interface PostalNearbyItem {
    postal: string;
    city: string | null;
    state: string | null;
    country: string;
    distance: number;
    distance_mi: number;
    deep?: Deep<PostalMetrosDeep>;
}
interface PostalNearby {
    postal: string;
    country: string;
    radius: number;
    unit: string;
    nearby: PostalNearbyItem[];
    deep?: Deep<PostalMetrosDeep>;
}
interface PostalDistanceEnd {
    postal: string;
    city: string | null;
    deep?: Deep<PostalMetrosDeep>;
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
    /** Bank identifier parsed from the number, not a name. */
    bank: string | null;
    /** Institution name from the national bank-code directory. Null when unsourced. */
    bank_name: string | null;
    /** BIC from that same directory. Null when unsourced or missing. */
    bic: string | null;
    deep?: Deep<IbanDeep>;
}
interface Npi {
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
    /** Date CMS deactivated the NPI, YYYY-MM-DD. Null when still active. */
    deactivated_at: string | null;
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
    /** True when the published measure has additional eligibility conditions. */
    conditional?: boolean | null;
}
interface TariffDeep {
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
interface Tariff {
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
interface Vin {
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
interface Phone {
    phone: string | null;
    valid: boolean;
    country: string | null;
    /** What the numbering plan can see. Never voip (that is the carrier field's word). Null when invalid. */
    type: 'mobile' | 'landline' | 'toll_free' | 'unknown' | null;
    national: string | null;
    international: string | null;
    deep?: Deep<PhoneDeep>;
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
    deep?: Deep<CarrierDeep>;
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
    /** Assigned to a subscriber at the last check. Null means unconfirmed. */
    live: boolean | null;
    /** Handset reachable at the last check. Null means unconfirmed, never no. */
    connected: boolean | null;
    deep?: Deep<HlrDeep>;
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
    name: string;
    symbol: string | null;
    symbol_native: string | null;
    digits: number | null;
    deep?: Deep<CurrencyDeep>;
}
/** One language by BCP 47 shortest code (en) or ISO 639-3 (eng). Codes are lowercase. */
interface Language {
    language: string;
    name: string;
    local_name: string | null;
    script: string | null;
    direction: 'ltr' | 'rtl' | string;
    deep?: Deep<LanguageDeep>;
}
/** A parsed person name. Junk input returns valid: false, never an error. Gender comes from dictionary data and is null when the data does not decide. */
interface Name {
    name: string;
    valid: boolean;
    prefix: string | null;
    first: string | null;
    middle: string | null;
    last: string | null;
    suffix: string | null;
    deep?: Deep<NameDeep>;
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
interface Time extends Timezone {
}
/** The other side of a timezone conversion. `at` is the converted wall time. */
interface TimezoneConversionTarget {
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
interface DateInfo {
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
    city: PointCity | null;
    elevation: number | null;
    elevation_ft: number | null;
    resolution: number | null;
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
    deep?: Deep<PointDeep>;
    timezone: string | null;
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
    /** Specialist measurements for the same observed current conditions. */
    current: WeatherCurrentDeep;
}
interface WeatherCurrent {
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
interface WeatherStation {
    id: string;
    name: string | null;
    distance: number | null;
    distance_mi: number | null;
}
interface Weather {
    latitude: number;
    longitude: number;
    current: WeatherCurrent;
    station: WeatherStation | null;
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
    category: string | null;
    deep?: Deep<EmojiDeep>;
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
    /** Why suggestions are empty: more_input, missing_context or no_matches. Null with suggestions. Open to future values. Operational failures are errors. */
    reason?: string | null;
}
interface CompanyCountry {
    name: string | null;
    blocs: string[];
    tax: string | null;
}
interface CompanyDeep {
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
interface Company {
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
type NaicsSearchItem = Omit<Naics, 'country' | 'year'>;
interface NaicsSearch {
    q: string;
    year: number;
    country: string;
    results: NaicsSearchItem[];
}
/** Normalized SWIFT/BIC syntax and available institution identity. */
interface SwiftCode {
    swift: string;
    /** Syntax only, not registration or payment reachability. */
    valid: boolean;
    /** Country letters in the code. Null when the format is invalid. */
    country: string | null;
    /** Institution name. Null when unknown or ambiguous; may include a branch qualifier. */
    name: string | null;
}
interface CountryDeep {
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
interface StateDeep {
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
interface DistrictDeep {
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
interface CityDeep {
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
interface PostalDeep {
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
interface IbanDeep {
    /** Two check digits as a string, keeping a leading zero. */
    checksum: string | null;
    /** Branch identifier when that country has one. */
    branch: string | null;
    account: string | null;
}
interface PhoneDeep {
    /** NPA-derived state code (US/CA). */
    state: string | null;
    state_name: string | null;
    /** Numbering-plan IANA zone. Null when the prefix covers more than one zone, or invalid. Not the handset. */
    timezone: string | null;
}
interface CarrierDeep {
    /** Issuing rate-center city. */
    city: string | null;
    state: string | null;
    state_name: string | null;
}
interface HlrDeep {
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
interface CurrencyDeep {
    numeric: number | null;
    name_plural: string | null;
    countries: string[];
}
interface LanguageDeep {
    iso3: string | null;
    countries: string[];
}
interface NameDeep {
    /** Name membership is independent of gender. */
    known: boolean;
    /** Associated countries, not the person's nationality. */
    countries: string[];
    gender: 'male' | 'female' | null;
    salutation: 'Mr' | 'Ms' | null;
}
interface TimezoneDeep {
    name: string | null;
    /** Whole minutes, truncated toward zero for historical second offsets. */
    offset_minutes: number | null;
    offset_seconds?: number | null;
    next_dst: TimezoneNextDst | null;
}
interface TimezoneConversionTargetDeep {
    name: string | null;
    offset_minutes: number;
    offset_seconds?: number;
}
interface DateInfoDeep {
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
interface EmojiDeep {
    codepoints: string[];
    hex: string;
    status: string | null;
    version: string | null;
    keywords: string[];
    skins: EmojiSkin[];
}
interface NaicsDeep {
    description: string | null;
    children: NaicsChild[];
    /** Classification exclusions. Omitted or null on older responses. */
    exclusions?: NaicsExclusion[] | null;
}
interface CountryEmergency {
    police: string | null;
    ambulance: string | null;
    fire: string | null;
}
interface PostalMetrosDeep {
    metros?: PostalMetro[] | null;
}
interface PointCity {
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
interface WeatherCurrentDeep {
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
interface PropertyTax {
    /** Median annual tax payable, in currency units adjusted to the final year of period. Not a tax rate or an individual property bill. */
    annual_median: number;
    /** ISO 4217 currency code, currently USD. */
    currency: string;
    /** Reporting period, YYYY-YYYY. Monetary amounts use the final year of this period. */
    period: string;
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
type CountryOptions = DeepOption & RequestOptions;
type CountryStatesOptions = RequestOptions;
type StateOptions = {
    country?: string;
} & DeepOption & RequestOptions;
type StateDistrictsOptions = {
    country?: string;
} & DeepOption & RequestOptions;
type DistrictOptions = {
    country?: string;
    state?: string;
} & DeepOption & RequestOptions;
type CityOptions = {
    country?: string;
    state?: string;
} & DeepOption & RequestOptions;
type CityIdOptions = DeepOption & RequestOptions;
type CitySearchOptions = {
    country?: string;
    state?: string;
    limit?: number;
} & DeepOption & RequestOptions;
type CityNearestOptions = DeepOption & RequestOptions;
type CityNearbyOptions = {
    radius?: number;
    unit?: 'km' | 'mi';
    country?: string;
    state?: string;
    limit?: number;
} & DeepOption & RequestOptions;
/** Pass country when known. Codes shared by multiple countries need it. */
type PostalOptions = {
    country?: string;
} & DeepOption & RequestOptions;
type PostalNearbyOptions = {
    country?: string;
    radius?: number;
    unit?: 'km' | 'mi';
} & DeepOption & RequestOptions;
type PostalDistanceOptions = {
    country?: string;
} & DeepOption & RequestOptions;
type AddressOptions = {
    country?: string;
} & DeepOption & RequestOptions;
/** Address suggestions report why a result is empty. Operational failures remain errors. */
type AddressSearchOptions = {
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
type SwiftOptions = RequestOptions;
type IbanOptions = {
    country?: string;
} & DeepOption & RequestOptions;
type NpiOptions = DeepOption & RequestOptions;
/** Country resolves national-number ambiguity. Deep adds numbering-plan geography on every plan. */
type PhoneOptions = {
    country?: string;
} & DeepOption & RequestOptions;
/** Deep discloses location detail within the same carrier unit. */
type CarrierOptions = {
    country?: string;
} & DeepOption & RequestOptions;
type CallerOptions = {
    country?: string;
} & RequestOptions;
/** Look up phone status at the last check. Live means assigned and connected means reachable at that check. Cached results may be returned. Null means unconfirmed. Deep adds network diagnostics within the same metered lookup. No automatic retries by default. */
type HlrOptions = {
    country?: string;
} & DeepOption & RequestOptions;
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
type NaicsOptions = DeepOption & RequestOptions;
/** Keyword search. Limit defaults to 10 and accepts 1-50. */
type NaicsSearchOptions = {
    limit?: number;
} & DeepOption & RequestOptions;
/** Look up the general US duty schedule line. Paid deep adds units and the special and other schedule columns. Add origin with deep to resolve country-specific measures. Without origin, schedule detail remains available and origin-dependent fields are null. A null effective rate is not a zero rate. */
type TariffOptions = {
    /** Origin country (ISO2). With paid deep, resolves country-specific measures. */
    origin?: string;
} & DeepOption & RequestOptions;
type TariffSearchOptions = RequestOptions;
type CurrencyOptions = DeepOption & RequestOptions;
type CurrencyRateOptions = {
    date?: string;
    amount?: number;
} & RequestOptions;
type LanguageOptions = DeepOption & RequestOptions;
/** Country is an ISO2 context for paid deep name evidence. */
type NameOptions = {
    country?: string;
} & DeepOption & RequestOptions;
type TimeOptions = {
    at?: string;
    to?: string;
} & DeepOption & RequestOptions;
type TimeAtOptions = {
    at?: string;
    to?: string;
} & DeepOption & RequestOptions;
type TimezoneOptions = {
    at?: string;
    to?: string;
} & DeepOption & RequestOptions;
type TimezoneAtOptions = {
    at?: string;
} & DeepOption & RequestOptions;
type DateOptions = {
    format?: 'mdy' | 'dmy';
    to?: string;
} & DeepOption & RequestOptions;
type DateTodayOptions = {
    to?: string;
} & DeepOption & RequestOptions;
type HolidayOptions = {
    year?: number;
} & RequestOptions;
type HolidayDateOptions = RequestOptions;
type ElevationOptions = RequestOptions;
/** Resolve the country, state, district and timezone at coordinates. Deep adds terrain and compact nearest-city context on every plan. The timezone ID stays in core. The nearest city is null when none is within 200 km. */
type PointOptions = DeepOption & RequestOptions;
/** Get current conditions in metric and imperial units. Paid deep adds specialist current measurements, forecasts and related detail. With deep, date selects a past UTC day (YYYY-MM-DD) in deep.history alongside current conditions. Date alone does not request history. */
type WeatherOptions = DeepOption & {
    /** Past UTC day, YYYY-MM-DD. Requires paid deep and populates deep.history alongside current. */
    date?: string;
} & RequestOptions;
type EmojiOptions = DeepOption & RequestOptions;
type EmojiSearchOptions = {
    limit?: number;
} & DeepOption & RequestOptions;
interface DeepOption {
    /** Request endpoint-specific enrichment. Email/VAT checks are metered. Reference depth can be pooled or included with a paid plan. See the operation's help. */
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
        /** Find address suggestions using the context supplied. Prefer postal, or city and state, from the form. ip is an optional end-user locality hint for server-side calls. An empty result has reason more_input, missing_context or no_matches. Suggestions have reason null. Operational failures are errors. */
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
    /** Check BIC syntax and look up a known institution. A null name means unknown, not invalid. */
    swift: (code: string, opts?: SwiftOptions) => Promise<SwiftCode>;
    iban: (iban: string, opts?: IbanOptions) => Promise<Iban>;
    npi: (npi: string, opts?: NpiOptions) => Promise<Npi>;
    /** Parse a phone number and its formats. Pass country for national numbers when needed. Deep adds numbering-plan geography. */
    phone: (number: string, opts?: PhoneOptions) => Promise<Phone>;
    /** Request a metered carrier lookup. No automatic retries by default. */
    carrier: (number: string, opts?: CarrierOptions) => Promise<Carrier>;
    /** Request a metered caller-name lookup for a NANP number. No automatic retries by default. */
    caller: (number: string, opts?: CallerOptions) => Promise<Caller>;
    /** Look up phone status at the last check. Live means assigned and connected means reachable at that check. Cached results may be returned. Null means unconfirmed. Deep adds network diagnostics within the same metered lookup. No automatic retries by default. */
    hlr: (number: string, opts?: HlrOptions) => Promise<Hlr>;
    /** Check whether a domain is registered. Deep adds registration dates, registrar, status and DNSSEC on paid plans. */
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
    /** Look up the general US duty schedule line. Paid deep adds units and the special and other schedule columns. Add origin with deep to resolve country-specific measures. Without origin, schedule detail remains available and origin-dependent fields are null. A null effective rate is not a zero rate. */
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
    /** Resolve the country, state, district and timezone at coordinates. Deep adds terrain and compact nearest-city context on every plan. The timezone ID stays in core. The nearest city is null when none is within 200 km. */
    point: (lat: number, lon: number, opts?: PointOptions) => Promise<Point>;
    /** Get current conditions in metric and imperial units. Paid deep adds specialist current measurements, forecasts and related detail. With deep, date selects a past UTC day (YYYY-MM-DD) in deep.history alongside current conditions. Date alone does not request history. */
    weather: (lat: number, lon: number, opts?: WeatherOptions) => Promise<Weather>;
    emoji: ((emoji: string, opts?: EmojiOptions) => Promise<Emoji>) & {
        search: (query: string, opts?: EmojiSearchOptions) => Promise<EmojiSearch>;
    };
};
type ParseAPIClient = ReturnType<typeof parseAPI>;

export { type Address, type AddressOptions, type AddressSearch, type AddressSearchOptions, type AddressSuggestion, type Asn, type AsnOptions, type Bin, type BinOptions, type Bloc, type BlocCountries, type BlocCountriesOptions, type BlocCountryItem, type BlocOptions, type Caller, type CallerOptions, type Carrier, type CarrierDeep, type CarrierOptions, type City, type CityDeep, type CityIdOptions, type CityNearby, type CityNearbyOptions, type CityNearest, type CityNearestOptions, type CityOptions, type CitySearch, type CitySearchOptions, type Company, type CompanyCountry, type CompanyDeep, type CompanyOptions, type Continent, type ContinentCountries, type ContinentCountriesOptions, type ContinentCountryItem, type ContinentOptions, type Country, type CountryDeep, type CountryEmergency, type CountryOptions, type CountryStateItem, type CountryStates, type CountryStatesOptions, type Currency, type CurrencyDeep, type CurrencyOptions, type CurrencyRate, type CurrencyRateOptions, type DateInfo, type DateInfoDeep, type DateOptions, type DateTodayOptions, type Deep, type District, type DistrictDeep, type DistrictOptions, type Dns, type DnsOptions, type DnsRecord, type Domain, type DomainDeep, type DomainOptions, type DomainRegistration, type Elevation, type ElevationOptions, type Email, type EmailDeep, type EmailOptions, type Emoji, type EmojiDeep, type EmojiOptions, type EmojiSearch, type EmojiSearchOptions, type EmojiSkin, type Hlr, type HlrDeep, type HlrOptions, type Holiday, type HolidayDate, type HolidayDateOptions, type HolidayOptions, type HolidayYear, type Iban, type IbanDeep, type IbanOptions, type Ip, type IpDeep, type IpOptions, type IpSelfOptions, type Language, type LanguageDeep, type LanguageOptions, type Mac, type MacOptions, type Measure, type MeasureChoice, type MeasureOptions, type MeasureUnit, type MeasureUnits, type MeasureUnitsOptions, type Mx, type MxOptions, type MxRecord, type Naics, type NaicsChild, type NaicsCorrection, type NaicsDeep, type NaicsExclusion, type NaicsMatch, type NaicsOptions, type NaicsSearch, type NaicsSearchItem, type NaicsSearchOptions, type Name, type NameDeep, type NameOptions, type Npi, type NpiDeep, type NpiEnrollment, type NpiOptions, type ParseAPIClient, ParseAPIError, type ParseAPIOptions, type Phone, type PhoneDeep, type PhoneOptions, type Point, type PointCity, type PointDeep, type PointOptions, type Postal, type PostalDeep, type PostalDistance, type PostalDistanceEnd, type PostalDistanceOptions, type PostalMetro, type PostalMetrosDeep, type PostalNearby, type PostalNearbyItem, type PostalNearbyOptions, type PostalOptions, type PropertyTax, type RequestOptions, type State, type StateDeep, type StateDistrictDeep, type StateDistrictItem, type StateDistricts, type StateDistrictsOptions, type StateOptions, type SwiftCode, type SwiftOptions, type Tariff, type TariffDeep, type TariffMeasure, type TariffOptions, type TariffSearch, type TariffSearchHit, type TariffSearchOptions, type Time, type TimeAtOptions, type TimeOptions, type Timezone, type TimezoneAtOptions, type TimezoneConversionTarget, type TimezoneConversionTargetDeep, type TimezoneDeep, type TimezoneNextDst, type TimezoneOptions, type Useragent, type UseragentBrowserBrand, type UseragentBrowserDeep, type UseragentDeep, type UseragentDeviceDeep, type UseragentEngineDeep, type UseragentOptions, type UseragentOsDeep, type Vat, type VatAddress, type VatDeep, type VatOptions, type Vin, type VinDeep, type VinOptions, type VinRecall, type Weather, type WeatherAir, type WeatherAlert, type WeatherCurrent, type WeatherCurrentDeep, type WeatherDay, type WeatherDeep, type WeatherForecastPeriod, type WeatherHistory, type WeatherHour, type WeatherMinute, type WeatherOptions, type WeatherStation, parseAPI };
