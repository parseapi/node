# @parseapi/sdk

Official ParseAPI client for Node and TypeScript.

```bash
npm install @parseapi/sdk
```

```ts
import { parseAPI } from '@parseapi/sdk';

const parse = parseAPI('your-api-key');
const country = await parse.country('US');
```

Get a key at [parseapi.com](https://parseapi.com). The client also reads `PARSEAPI_KEY` from the environment.

## API versions

This SDK explicitly selects the API contract supported by this SDK. It sends `Parse-Version: 2.0.0` on every lookup so responses match the API contract supported by the package. Your key and the team's saved default stay the same.

Upgrade the dependency in staging, review the [release notes](https://parseapi.com/docs/releases), and test the application before deploying the same code and dependency version to production. Commit your dependency lockfile so the tested package travels with your deployment. Future major SDK upgrades can select a newer API contract.

SDK packages older than 1.0.0 keep their existing behavior and use the team's default. Requests without `Parse-Version` also use that default, managed in [Dashboard API version](https://parseapi.com/dashboard/versions). Keep it unchanged while older applications depend on it. Rolling back to an SDK without a version header restores the team default, so rollback only restores the old contract when that default has stayed unchanged.

The package owns its supported API version. For direct HTTP integrations, an explicit `Parse-Version` header selects a supported contract. See [API versions and migration](https://parseapi.com/docs/versioning).

## Task preflight

Use a secret key to estimate access, advisory capacity and additional charges before a task. Preflight is available with API contract `2.0.0`.

```ts
const estimate = await parse.preflight({
  operations: [{ operation: 'email', count: 100, deep: true }],
  budget_usd: '2.50',
});
console.log(estimate.permitted, estimate.cost, estimate.capacity, estimate.budget);
```

Preflight accepts Email, Domain, DNS, MX and Country, with at most 20 rows and 100,000 total lookups. Supply operation counts without personal data or lookup inputs. Monetary values use decimal strings. The maximum assumes included Email checks are exhausted. The projection uses currently unallocated included checks. Rates come from the credential's accepted terms.

Check `permitted`, `cost.status`, `capacity` and the optional `budget.within_maximum` together. Unknown values remain null. Capacity can change with concurrent work. Preflight reserves no units or money, performs no paid checks and does not enforce the supplied budget. It uses the normal request rate limit. Estimates allow up to three attempts per ordinary lookup and one per Email Deep lookup. Extra retries or calls require a new estimate. Subscription fees, tax and model costs are excluded.

## Bulk files

Use `createBulkClient` for whole files. It uses the website origin separately from the lookup client's API origin.

```ts
import { createBulkClient } from '@parseapi/sdk';

const bulk = createBulkClient(process.env.PARSEAPI_KEY);
const upload = await bulk.upload({ filename: 'customers.csv', file_size: csvBytes.byteLength });
await fetch(upload.upload_url, {
  method: 'PUT', headers: upload.upload_headers, body: csvBytes,
});
await bulk.preview(upload.id); // Confirm the completed upload and request analysis.
const progress = await bulk.status(upload.id);
```

`csvBytes` comes from your application. Convert Excel or Numbers to CSV before creating the upload. File contents transfer directly to private storage and are never sent through MCP.

Analysis may take time. Poll `status` until `job.status` is `quoted`. Then call `bulk.preview(id, { checks: ['email', 'phone', 'ip'] })` to select operations present in the file, or omit `checks` to retain the detected selection. A changed selection requests analysis again. Repeat status and preview until the response includes a current `quote`.

After the user approves the work and maximum USD cost, call `bulk.start(id, { quote_id: preview.quote.id, max_cost_cents })`. The server enforces that ceiling and returns any payment or setup action. A positive ceiling does not authorize a saved-card charge. Reuse the same job and quote when recovering a start request.

When processing finishes, `bulk.result(id)` returns a short-lived private `download_url`. Fetch that URL directly without adding an API key header. All methods return bounded JSON metadata and preserve nullable and future server fields. They never retry automatically. If upload creation has an uncertain outcome, check the account before creating another job.

Existing Bulk job URLs remain shareable. Treat job IDs and download URLs as file-access capabilities.

Options are `webUrl`, `timeoutMs` and `fetch`. `PARSEAPI_WEB_URL` can set the website origin. HTTPS origins and HTTP loopback origins are accepted. Lookup `baseUrl` and `PARSEAPI_BASE_URL` stay independent.

## Weather from a postal code

Start with the postal code, then pass its coordinates to weather. Reuse the client from the example above.

```ts
const place = await parse.postal('28202', { country: 'US' });
if (place.latitude != null && place.longitude != null) {
  const weather = await parse.weather(place.latitude, place.longitude);
  console.log(weather);
}
```

The coordinates represent the postal area. Weather is for that point. Missing coordinates skip the weather lookup. This composition performs two ordinary lookups when coordinates are available, with the retry policy below.

## Supply the context you know

Pass `country` when a postal code or national phone number needs disambiguation. A complete international phone number already carries its country context. For a numeric date such as `03/04/2026`, supply the intended `format`. Defaults resolve what the input establishes. Ambiguous input needs your context.

Results are plain data. Pass a returned code or coordinate to another operation when the task needs it. Check nullable values before composing the next call.

Name paid deep includes flat `short`, `directory`, and `initials` fields beside `gender` and `salutation`. `name_locale` selects CLDR formatting rules and defaults to `en`. It changes formatting only. Country remains gender context, and unavailable formatting is null. Older responses may omit these fields.

## Display language

This source candidate accepts an optional per-request `lang` on supported
operations. It requires the matching API localization release and data.

```ts
const country = await parse.country('DE', { lang: 'fr' });
// country: 'DE', name: 'Allemagne', name_local: 'Deutschland'
```

Only supported display fields change. Missing translations keep their source
names. IDs, native-name fields, numeric facts, Date input `format`, and
input `locale` retain their meaning. Omitting `lang` preserves the existing
behavior and does not inherit a previous request's choice.

## ISO identifiers

Country uses `iso_alpha3` and `iso_numeric`, State uses the full
`iso_subdivision` code such as `US-CA`, Language uses `iso_alpha3`, and Currency
uses `iso_numeric`. Primary `country`, `state`, `language` and `currency` codes
keep their meaning. Results retain the selected API contract's exact keys,
values, nulls and nesting. Earlier server contracts retain their earlier ISO
spellings. Use the existing lookup methods for each resource.

## Calls

Search the company directory, then refetch an ID you have chosen:

```ts
const candidates = await parse.company.search({ query: 'Cloudflare', country: 'US' });
// After the caller chooses a candidate, retain its id for later lookups.
const chosenId = 'co_xw3f22es6cjq';
const company = await parse.company.id(chosenId, { deep: true });
const coverage = await parse.company.coverage();
```

Company search accepts at most one of `query`, `domain`, `ticker`, or `identifier`, or discovers candidates using country or exact industry filters.
Use `exchange` with a ticker, or `authority` with an identifier. `country`, `limit`
and the returned `next` cursor narrow or page the same search. Pass the cursor as
`cursor` with the same selector, filters and limit. Each result has its own
`match` and optional `deep`. The SDK returns all candidates without choosing one.
Directory methods accept `signal`, `timeoutMs` and `retries`, and omit `lang`.
Directory deep adds detail in the same pooled request on every plan.

Company directory social profiles contain `platform`, `url` and `handle`; unknown metadata stays null. Phone and email records use `type` for the source-reported purpose. Earlier response fields remain readable by the client.
Coverage describes the current directory edition. Empty listings do not establish
private ownership. Deep source entries attribute selected enrichment fields, and
logo URLs are returned without fetching images. The existing `company(number)`
call still parses national registration numbers and returns `Company`.

Discovery example: `await parse.company.search({ country: 'US', industry: '0700', industry_type: 'sic' });`

Supply `industry` and `industry_type` together. The supported namespace is `sic`, with an exact four-digit string such as `0700`; leading zeros are meaningful. Country-only discovery is also supported. Filters intersect and may narrow an existing selector. Country matches the profile country, not a headquarters or operating-presence claim. Unknown values do not match a requested filter. Filter-only candidates use `match.field: "filters"` and `match.value: null`; reuse the same filters and limit with a returned cursor. Counts describe this directory edition, not complete country coverage.


One method per endpoint, named after the route.

```ts
await parse.ip('8.8.8.8');
await parse.ip.self();
await parse.email('hello@gmail.com');
await parse.card('424242');
await parse.phone('+14155552671');
await parse.carrier('+14155552671');
await parse.caller('+14155552671');
await parse.hlr('+14155552671');
await parse.postal('SW1A 1AA');
await parse.postal('28202', { country: 'US' });
await parse.postal.nearby('28202', { country: 'US', radius: 40 });
await parse.postal.distance('28202', '10001', { country: 'US' });
await parse.address('1600 Pennsylvania Ave NW, Washington DC', { country: 'US' });
await parse.address.search('1600 Pennsylvania', { country: 'US', postal: '20500' });
await parse.company('51 824 753 556', { country: 'AU' });
await parse.company.id('co_xw3f22es6cjq', { deep: true });
await parse.company.search({ domain: 'cloudflare.com' });
await parse.company.search({ ticker: 'NET', exchange: 'NYSE' });
await parse.company.search({ identifier: '0001477333', authority: 'SEC' });
await parse.company.coverage();
await parse.city('charlotte', { country: 'US' });
await parse.city.id('city_mb8mbqrkz8zb');
await parse.city.search('char', { country: 'US', limit: 10 });
await parse.city.nearest(35.2271, -80.8431);
await parse.city.nearby('denver', { radius: 8, unit: 'mi' });
await parse.country('US');
await parse.country.states('US');
await parse.state('colorado');
await parse.state('NC', { country: 'US' });
await parse.state.districts('NC', { country: 'US' });
await parse.district('37081');
await parse.district('guilford county');
await parse.continent('NA');
await parse.continent.countries('NA');
await parse.currency('USD');
await parse.currency.rate('USD', 'EUR');
await parse.language('en');
await parse.name('BILLY OSHALL');
await parse.name('Andrea', { country: 'IT', deep: true });
await parse.name('Robert James Smith', { deep: true, name_locale: 'en' });
await parse.time(); // UTC now
await parse.time('America/New_York');
await parse.time('America/New_York', { at: '2026-09-05T15:00:00', to: 'Asia/Tokyo' });
await parse.time.at(40.7128, -74.006);
await parse.date('03/04/2026', { format: 'mdy' });
await parse.date.today();
await parse.holiday('US', { year: 2026 });
await parse.holiday.date('US', '2026-12-25');
await parse.elevation(35.2271, -80.8431);
await parse.elevation.points([[39.7392, -104.9903], [39.75, -104.98]]);
await parse.elevation.path([[39.7392, -104.9903], [39.75, -104.98]], 100);
await parse.point(36.0726, -79.792);
await parse.weather(40.7128, -74.006);
await parse.domain('example.com');
await parse.asn('AS13335');
await parse.mx('example.com');
await parse.dns('example.com');
await parse.dns('_dmarc.example.com', { type: 'TXT' });
await parse.useragent(uaString);
await parse.industry('541511');
await parse.industry.search('coffee shop', { limit: 5 });
await parse.emoji('rocket');
await parse.emoji.search('fire');
```

The existing NAICS lookup and search methods remain available as compatibility names for Industry.

Industry paid deep records include classification `deep.exclusions`, each with a description and linked codes. Generic exclusions can have no linked codes. Omitted or null exclusions in older responses remain unknown. Search results also include `match`: the matched `field` (`name`, `term` or `naics`) and `text`, plus `corrections` with `from` and `to` tokens for typo fallback. Corrections are empty for exact, plural and prefix matches. Direct code lookups omit `match`. Older responses may omit it.

Responses are typed, plain JSON data. `country.states('US')` requests the states directly; it does not fetch a country first. Optional arguments go in the final options object, so new options can be added without changing your existing calls.

DNS uses pooled requests on every plan. Omit `type` to check A, AAAA, CNAME, MX, NS, TXT, SOA, CAA, SRV and PTR. Records contain `name`, `type`, `ttl` in seconds and a DNS presentation `value`. TXT values retain quoting and chunk boundaries. A selected question can include its CNAME chain. Empty records mean no records. Lookup failures remain errors.

## Elevation

`elevation(lat, lon)` returns one sample with meters, feet and grid resolution in meters. `elevation.points(...)` accepts up to 512 points per local batch as `[lat, lon]` pairs, a `lat,lon|lat,lon` string, or `enc:` followed by a Google encoded polyline. Its `points` array preserves input order and duplicate coordinates. Unknown samples stay null, and negative elevations and known zero values are preserved. Each accepted local list uses one pooled request. The SDK automatically uses JSON POST for long URLs and numeric coordinates that JavaScript expresses in exponent notation.

`elevation.path(path, samples)` accepts the same input formats with 2-512 path vertices and a required integer sample count from 2 to 512. Its `points` array includes both endpoints, with samples spaced uniformly by cumulative great-circle distance along the path. Each segment follows the shortest arc. A segment with antipodal endpoints is rejected because it does not define a unique arc. Each accepted local path uses one pooled request and automatically selects JSON POST for a long URL.

Each local batch is limited to 25 km between any two coordinates and 12 distinct terrain files in total across the fine grid and all possible global fallback files. For paths, both the supplied vertices and generated samples must fit the 25 km span. The terrain file budget applies to the sampled coordinates. This is a span limit, not a limit on cumulative path length. Send longer or more spread-out routes in shorter sections. An over-limit batch returns HTTP 400. GET, POST and polylines use the same limits. The SDK does not silently split or discard coordinates.

## Time

`time` returns local ISO `at` with its UTC offset and integer Unix seconds in `unix`. The core `offset` preserves exact precision. Optional `deep.offset_seconds` gives the numeric offset, while `deep.offset_minutes` gives whole minutes. Historical offsets and ISO times can include offset seconds. Omitted `at` means now. With `to` or `targets`, an offsetless `at` is source wall time. Otherwise it is UTC. Include an offset for repeated local times around a clock change. Current time and conversion use pooled requests on every plan. Coordinate clock fields can be null when the timezone is unknown. Existing `timezone` methods remain supported.

For an offsetless `at` with `to` or `targets`, choose how to handle a clock change with `disambiguation`. It applies to named-zone and coordinate Time calls.

| Value | Repeated time | Skipped time |
| --- | --- | --- |
| `compatible` (default) | Earlier occurrence | Shift forward by the clock change |
| `earlier` | Earlier occurrence | Shift backward by the clock change |
| `later` | Later occurrence | Shift forward by the clock change |
| `reject` | `400 ambiguous_time` | `400 nonexistent_time` |

An explicit UTC offset selects an instant directly. For example, `2026-11-01T01:30:00-04:00` and `2026-11-01T01:30:00-05:00` identify the two New York occurrences. A valid `disambiguation` value has no effect on explicit instants, current-time requests or lookups without `to` or `targets`. For user-entered appointment times, start with `reject`. Handle `ambiguous_time` or `nonexistent_time` by collecting an explicit offset or an earlier/later choice from the user. Other malformed input still uses `invalid_request`.

```ts
const result = await parse.time('America/New_York', {
  at: '2026-11-01T01:30:00', to: 'UTC', disambiguation: 'later',
});
console.log(result.to?.at); // 2026-11-01T06:30:00+00:00
```

Canonical Time `deep` includes the pinned rule edition in `deep.timezone_database_version` and source-wall resolution in `deep.resolution`. Resolution records `kind` (`unique`, `overlap` or `gap`), the selected policy, signed `adjustment_seconds`, and chronological alternatives with exact `at`, Unix seconds and UTC offset. Unique times have an empty alternatives list. Explicit instants, current time and lookups without conversion have null resolution. Destination detail stays compact.

Search serving IANA IDs by city or region, or omit the query to list all (Go and Rust use an empty string). Discovery returns `timezone_database_version` and sorted `timezones`. No search matches returns `timezones: []`.

Pass `targets` to convert one instant to 1-10 zones in a single pooled request. The native list preserves order and duplicates. Use `targets` instead of `to`. The response adds `targets`, with optional detail inside each target. Unknown source coordinates return `targets: null`. An unknown destination rejects the whole request with `not_found`. Omission keeps the original response shape.

```ts
const zones = await parse.time.zones('New York');
const result = await parse.time('UTC', {
  at: '2026-09-24T12:00:00Z', targets: ['America/New_York', 'Asia/Tokyo'],
});
console.log(zones.timezones, result.targets);
```

### Location inputs and timezone filters

`parse.time(undefined, { iata: 'JFK', deep: true })` and `parse.time.zones(undefined, { country: 'US', dst: false, observes_dst: true, details: true })`.

Choose one explicit location input: IP, exact city name or stable city ID, country, IATA airport, ICAO airport, port UN/LOCODE, or address. Country and state can narrow a city or address. State requires country. Address lookup requires US country context and a strict address-point match. Port lookup covers the reviewed port subset, not every assigned UN/LOCODE. IP lookup always uses the supplied IP.

Location calls add `location` with `status`, `candidates`, `truncated`, `source` and the typed input. Check `status` before using the clock: ambiguous or missing locations retain null time fields. Candidate coordinates and IDs can also be null. A country with multiple timezones does not silently choose one. Named-zone and coordinate calls retain their existing signatures.

Timezone discovery accepts country, IANA area, exact signed offset, abbreviation, DST-at-instant and observes-DST-during-year filters. `at` selects the common instant, `sort` selects timezone or offset order, and `details` adds `zones` rows plus the evaluation `at`. The default `timezones` list stays compact. False DST filters are sent explicitly. An abbreviation returns candidate zones rather than choosing one. Observes-DST uses the UTC calendar year containing `at`.

Source deep adds `standard_offset`, `standard_offset_seconds`, signed `dst_offset_seconds` and `season`. Seasonal adjustments can be negative. `season` describes the current DST-flag interval, or the next within 400 days, with actual before/after transition facts and signed `change_seconds`. Unknown boundaries remain null. These fields are optional and nullable, and destination deep stays compact.

## Place statistics and optional detail

Country Core contains the everyday reference: `name`, `name_full`, `name_local`, demonym, `iso_alpha3` and `iso_numeric` country identifiers, continent, region and subregion, currency, calling code, `flag`, language and timezone codes, borders, bloc memberships and `capital: { name, lat, lon }`. Paid Deep adds specialist detail, including population, total area and national statistics. `gdp_usd` and `gdp_per_capita_usd` are current US dollars; `population_growth_percent`, `urban_population_percent` and `internet_users_percent` use a 0–100 percent scale (growth can be negative or exceed 100). GDP per person and these three percentages round once to two decimals in the API response. `elevation_average` is average terrain elevation in meters; `lowest_point.elevation` and `highest_point.elevation` keep their point-specific meaning. Unknown stays null and a known zero stays zero. Country tax references are grouped once as `deep.tax: { name, rate }`; the rate remains a percentage. Read capital from the Core object and read the tax name and rate from the Deep tax object.

Australian postal lookups include core `localities` with suburb choices (`city`, `state`, `state_name`) on every plan. Null or an omitted field means unknown, while `[]` means the reviewed reference has no eligible choices. `city` stays null when the source is ambiguous, even if there is only one eligible choice. Let the user select their suburb and keep manual entry available. These are geographic choices, not mailing-address verification. [G-NAF source, adaptations and licence](https://parseapi.com/legal/attribution#postal-au).

Postal and District paid profiles include `deep.property_tax` where supported. It contains `annual_median`, `currency` and `period`: median annual property tax payable on owner-occupied homes in the statistical area. The amount is adjusted to the final year of the reporting period (`YYYY-YYYY`). This is an area statistic, not a rate or an individual property bill. Unsupported, missing and censored estimates are null.

```ts
const place = await parse.postal('28202', { country: 'US', deep: true });
const propertyTax = place.deep?.property_tax;
```

Read `population` as the source’s count for that place boundary. Keep missing or null values unknown and preserve a known zero. State district lists include each district’s population. Postal nearby and distance detail remains metropolitan associations only. Continent population stays in core.

Point returns the timezone ID with the core location. Its optional deep detail adds terrain and compact nearest-city context on every plan. A nearest city is null when none is within 200 km.

Weather returns current conditions by default. Paid deep adds specialist current measurements, forecasts and related detail. A past `date` is a UTC day and requires deep: it adds `deep.history` alongside current conditions. Date alone does not request history.

```ts
await parse.weather(40.7128, -74.006, { deep: true, date: '2026-08-15' });
```


Address search uses context from the form: prefer postal, or city and state. An optional end-user `ip` is a locality hint for server-side calls. An empty result explains itself with `reason`: `more_input`, `missing_context` or `no_matches`. With suggestions, reason is null. Older responses may omit it, and future reasons remain strings. Catalog and lookup failures use the existing API errors.

HLR reports status at the last check. `live` means assigned and `connected` means reachable at that check. Cached results may be returned. Null means unconfirmed. Deep diagnostics stay within the same metered lookup.

Bank inputs use `POST /bank` JSON bodies, keeping IBAN and account values out of request URLs. Pass original strings; the server owns normalization and validation. Avoid logging request bodies. IBAN deep adds the branch identifier and account remainder.


## Deep

Choose enrichment for the question you need answered.

| Operation | What `deep` requests |
|---|---|
| IP | Richer IP fields included with a paid plan. No separate check meter. |
| Domain | Registration dates, registrar, status and DNSSEC, included with a paid plan. Use `dns` for DNS records and `mx` for mail routing. |
| Email | A metered mailbox check with deliverability, catch-all, status, reason and address hints, using included email checks or enabled on-demand usage. |
| Phone, Time, Date, Language, Emoji, Point | Optional detail in the same pooled request on every plan. |
| Currency | Currency metadata on paid plans; lookup and exchange-rate conversion use pooled requests. |
| Country, State, District, City, Postal | The place profile on paid plans, including demographic and tax facts where held. |
| Name, Industry | Name evidence or the industry definition profile on paid plans. |
| Company (national number) | The complete product detail bag on paid plans. |
| Company directory | Profile detail in the same pooled request on every plan. Search detail belongs to each company result. |
| Weather | Specialist current measurements and the existing forecast, alert, air and history bag on paid plans. |
| Carrier, HLR | Optional diagnostic detail within the same metered core unit, including Free allowance units. No second gate or additional check. |

Email deep includes mailbox status and the reason for the result, plus a suggested first name, no-reply flag, plus-address tag and mail service. The suggested name is not a verified identity. Unavailable details are null.

Reasons include `accepted`, `invalid_format`, `invalid_domain`, `no_mail_server`, `mailbox_not_found`, `mailbox_disabled`, `mailbox_full`, `catchall`, `disposable`, `temporary_failure`, `rejected` and `unconfirmed`.

Carrier, caller, and HLR are separate metered operations. Choose them explicitly when you need their answers. Ordinary lookups retry twice by default. Metered checks use one attempt by default. Setting retries explicitly can repeat paid usage.

Without `deep`, the response omits that key. When requested, it is an empty object if access is locked or the operation has no deep fields. Otherwise it contains the available fields. A missing or null field means unknown.

```ts
const ip = await parse.ip('52.94.76.10', { deep: true });
ip.deep?.datacenter; // true
```

## Errors

Every non-2xx response throws a `ParseAPIError` with `status`, `code`, `docs`, and `requestId`. Branch on `code`.

```ts
import { ParseAPIError } from '@parseapi/sdk';

try {
  await parse.city('atlantis');
} catch (err) {
  if (err instanceof ParseAPIError && err.code === 'not_found') {
    // no such city
  }
}
```

Network and decoding failures keep their native error types. Responses such as `valid: false` are successful API answers, not exceptions.

## Options

```ts
const parse = parseAPI('your-api-key', {
  timeoutMs: 10000, // per-attempt timeout
});

const controller = new AbortController();
const country = await parse.country('US', {
  signal: controller.signal,
  timeoutMs: 5000, // override for this call
  retries: 0,     // one attempt
});
```

Requires Node 18 or later. Zero dependencies.

Ordinary lookups retry network failures, 429, and 500/502/503/504 responses twice by default. Carrier, caller, HLR, and email with `deep: true` make one attempt by default. Address with `deep: true` also uses one attempt, reserving the same behavior for future verification.

An explicit `retries` setting on the client or call overrides those defaults. Another attempt can consume additional usage if the earlier response was lost. Cancellation stops the request and any retry wait. Automatic redirects are disabled.

Automatic retries wait at most five seconds per attempt. A longer valid `Retry-After` returns the original API error immediately without retrying early. Read `retryAfter` on the error for the original header, or null when absent.

## Docs

Full field reference for every endpoint: [parseapi.com/docs](https://parseapi.com/docs)

## Card

Send 2–11 leading digits as a string. Core returns `bin`, `brand`, `brand_name`
and a CDN SVG `logo`. Brand detection uses reviewed network rules independently
of issuer records. Unknown or ambiguous prefixes return null brand fields and a
generic logo; a known network without reviewed artwork also uses the generic logo.

Optional Deep adds `prefix`, `issuer`, `country`, `type` and `prepaid`, included
in the same pooled request on every plan. Six or more digits enable directory
matching. Fewer digits return all-null Deep fields. Compare `deep.prefix` with
`bin`: equal is an exact recorded match; shorter is broader; null is no match.
The longest row wins, including null fields. `prepaid: null` means unknown, not
false. This is partial reference data, not card validity or payment acceptance.

```javascript
const card = await parse.card('51');
console.log(card.brand, card.logo);
const details = await parse.card('43737400', { deep: true });
console.log(details.deep?.prefix, details.deep?.issuer);
```

Leading zeros are preserved. Only ASCII spaces, tabs, CR, LF and hyphens are
removed; raw input is limited to 64 characters. Invalid prefixes are rejected
before dispatch, accepted input is forwarded unchanged. Never send a full card number.

## Optional detail

The default response answers the common task. Ask for `deep` when you need more detail about that same result. Core fields stay equal. City, Industry and Emoji searches put detail inside each result. Postal nearby and distance put metropolitan detail beside the entity it describes. Time conversion keeps target detail in `to.deep`; only the source has `deep.next_dst`.

```ts
const basic = await parse.time('America/New_York');
const detail = await parse.time('America/New_York', { deep: true });
console.log(basic.at, detail.deep?.next_dst);
```

## Domain results with unknown availability

Use `domain` when deciding whether a domain is registered. It returns `available: true` for unregistered, `false` for registered, and `null` when the registry answer is unknown.

```ts
const result = await parse.domain('example.com', { deep: true });
if (result.available === null) {
  console.log('Registration could not be determined');
} else {
  console.log(result.available ? 'Unregistered' : 'Registered');
}
```

This makes one ordinary Domain lookup with the same options, authentication and retry policy. Registration detail may be partial. Missing or null `dnssec` is unknown, while `false` is a known negative. Missing or null `status` is unknown, while `[]` is a known empty list.

The ordinary `Domain` type represents unknown availability as `null`. The existing `domainResult` method and its result type remain available.

## Stack API

```typescript
import type { Stack } from '@parseapi/sdk';

const result: Stack = await parse.stack("example.com");
```

Pass a public hostname without a scheme, path, port or IP address. Stack checks static homepage HTML and response headers. It returns the checked URL, original `checked_at` time and eight technology arrays. The existing `stack()` method returns this `Stack` model.

`cms`, `servers`, `frameworks`, `ecommerce`, `analytics`, `chat`, `payments` and `hosting` are arrays because a site can use several technologies in each category. Each entry contains `technology`, `name` and nullable `version`. Technology codes are open strings. A successful check uses empty arrays for categories with no matches. When no HTML page could be checked, `checked_at` and all categories are null. Unknown or conflicting versions are null. Detections describe the checked homepage.

Successful checks may be reused for up to 24 hours. `pretty` optionally formats the wire JSON. Stack uses your plan's request allowance and API version 2.0.0 selected by this client.

Stack defaults to 35 seconds per attempt so a first scan has time to finish. Other lookups retain their 10-second default. An explicit client timeout applies to every operation; JavaScript also supports a per-call `timeoutMs` override.

## Emoji catalog additions

Resolve Unicode emoji or a named shortcode, search or browse a bounded catalog,
parse emoji positions in text, and convert between Unicode and a selected shortcode source.
The ordinary lookup remains four fields:

```http
GET /emoji/rocket
```

```json
{"emoji":"🚀","name":"Rocket","shortcodes":[":rocket:","rocket"],"category":"Travel & Places"}
```

Use `deep=true` for Unicode facts, keywords, tone families and available artwork.
Artwork is keyed by style: `deep.artwork.openmoji.svg` is the SVG URL, and
`deep.artwork.openmoji.png["72"]` is the 72×72 PNG URL (use your language’s map
access syntax). The same shape applies to `noto` and `twemoji`. Missing styles
and formats are omitted. URLs pin immutable artwork editions and retain their bytes.
Core values stay unchanged. Text parsing returns `emojis` with UTF-16 `positions`;
conversion returns `text` and unresolved tokens with positions and reasons.

The compact JSON catalog contains offline identity, qualification-form and
shortcode indexes. Request `profile=full` when artwork is needed and `lang` when
localized names and keywords are needed. `/emoji/metadata` carries dataset
coverage and shared source notices once. Artwork supports Google Noto, Twemoji
and OpenMoji, with real SVG/PNG availability and immutable first-party URLs.
A device's emoji font remains the ordinary display.

These additions are a local release candidate until the matching SDK and
backend are published. Existing lookup and search contracts are preserved.


## Canonical City operations

Classic lookup, search, nearest and named-nearby methods retain their default envelopes and required-field models. Browse and coordinate-nearby use canonical lists: `object`, `data` and nullable `next_cursor` (camelCase properties in Swift/Kotlin). Keep all query options unchanged when continuing a page; no client fetches pages automatically.

```js
const page = await parse.city.search('Viena', {
  format: 'list', match: 'fuzzy', maxDistance: 1,
});
```

Select `format=resource` for one City or `format=list` for a collection. Country inclusion/exclusion sets, timezone sets, inclusive population and meter-elevation bounds, stored-center `bbox` and signed multi-key sorting are available for collections. Unknown numeric facts do not match range filters.

Search defaults to prefix matching. Exact and fuzzy matching are explicit; fuzzy accepts maximum edit distance 1 or 2 and returns `match` evidence (`type`, `source`, `value`, `language`, `edit_distance`). Review a fuzzy choice before storing its ID.

Reviewed children, ancestors and siblings use canonical lists with partial relationship coverage. Empty data does not prove there are no geographic relatives. Children/siblings accept page controls; ancestors do not. Distance reports great-circle kilometers and miles between stored centers: zero is known zero, null is unknown, and it does not imply travel time or containment.

Strict `ambiguity=error` can return HTTP 409 `ambiguous_city` with up to two safe candidate identities. The existing error constructor and unrelated error metadata are preserved; candidates are retained only for that status/code and never contain Deep. GeoJSON is available through HTTP; these typed City list methods do not return GeoJSON.


Reviewed name forms:

```js
const city = await parse.city.id('city_7aj899nvwyku', { format: 'resource', romanized: true });
```

Coverage by country and available fields is described at https://parseapi.com/city#coverage.

`romanized=true` requests reviewed official name forms as `name_romanized` and `romanization_language` (camelCase in Swift/Kotlin). Current reviewed forms cover 20 Japanese whole-city aliases in ja-Latn. Missing or conflicting forms stay null; ASCII folding is not substituted for an official form.


Conditional `If-None-Match` reads and GeoJSON currently use HTTP directly. A matching City ETag returns 304 without a body; ordinary billing and rate limits apply. These JSON client methods do not supply conditional-cache handling.
