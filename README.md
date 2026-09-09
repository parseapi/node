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

## Calls

One method per endpoint, named after the route.

```ts
await parse.ip('8.8.8.8');
await parse.ip.self();
await parse.email('hello@gmail.com');
await parse.vat('DE136695976');
await parse.iban('DE89370400440532013000');
await parse.bin('424242');
await parse.swift('CHASUS33');
await parse.npi('1881018208');
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
await parse.bloc('EU');
await parse.bloc.countries('EU');
await parse.currency('USD');
await parse.currency.rate('USD', 'EUR');
await parse.language('en');
await parse.name('BILLY OSHALL');
await parse.name('Andrea', { country: 'IT', deep: true });
await parse.time(); // UTC now
await parse.time('America/New_York');
await parse.time('America/New_York', { at: '2026-09-05T15:00:00', to: 'Asia/Tokyo' });
await parse.time.at(40.7128, -74.006);
await parse.date('03/04/2026', { format: 'mdy' });
await parse.date.today();
await parse.holiday('US', { year: 2026 });
await parse.holiday.date('US', '2026-12-25');
await parse.elevation(35.2271, -80.8431);
await parse.point(36.0726, -79.792);
await parse.weather(40.7128, -74.006);
await parse.domain('example.com');
await parse.asn('AS13335');
await parse.mac('00:1B:63:84:45:E6');
await parse.mx('example.com');
await parse.dns('example.com');
await parse.dns('_dmarc.example.com', { type: 'TXT' });
await parse.useragent(uaString);
await parse.vin('1HGCM82633A004352');
await parse.naics('541511');
await parse.naics.search('coffee shop', { limit: 5 });
await parse.tariff('8471.30.01.00');
await parse.tariff.search('sunglasses');
await parse.emoji('rocket');
await parse.emoji.search('fire');
```

NAICS paid deep records include classification `deep.exclusions`, each with a description and linked codes. Generic exclusions can have no linked codes. Omitted or null exclusions in older responses remain unknown. Search results also include `match`: the matched `field` (`name`, `term` or `naics`) and `text`, plus `corrections` with `from` and `to` tokens for typo fallback. Corrections are empty for exact, plural and prefix matches. Direct code lookups omit `match`. Older responses may omit it.

Responses are typed, plain JSON data. `country.states('US')` requests the states directly; it does not fetch a country first. Optional arguments go in the final options object, so new options can be added without changing your existing calls.

DNS uses pooled requests on every plan. Omit `type` to check A, AAAA, CNAME, MX, NS, TXT, SOA, CAA, SRV and PTR. Records contain `name`, `type`, `ttl` in seconds and a DNS presentation `value`. TXT values retain quoting and chunk boundaries. A selected question can include its CNAME chain. Empty records mean no records. Lookup failures remain errors.

## Time

`time` returns local ISO `at` with its UTC offset and integer Unix seconds in `unix`. The core `offset` preserves exact precision. Optional `deep.offset_seconds` gives the numeric offset, while `deep.offset_minutes` gives whole minutes. Historical offsets and ISO times can include offset seconds. Omitted `at` means now. With `to`, an offsetless `at` is source wall time. Otherwise it is UTC. Include an offset for repeated local times around a clock change. Current time and conversion use pooled requests on every plan. Coordinate clock fields can be null when the timezone is unknown. Existing `timezone` methods remain supported.

## Measurements

```ts
const result = await parse.measure('5 ft 11 in', { to: 'cm' });
const units = await parse.measure.units({ unit: 'm' });
```

`amount` is a decimal string, such as `"180.34"`. Without `to`, the API returns the canonical unit for the measurement type. Pass `locale` for number formatting and `system` (`us` or `imperial`) when a customary unit needs context. Ambiguous input returns `valid: false`, a `reason`, and available `choices`. Invalid or incompatible target units use the normal API error.

Unit discovery accepts optional `query`, `type`, and `unit` filters. `unit` selects compatible targets. Omit the filters for the reviewed catalog. Both operations use pooled requests.

## Place statistics and optional detail

Postal and District paid profiles include `deep.property_tax` where supported. It contains `annual_median`, `currency` and `period`: median annual property tax payable on owner-occupied homes in the statistical area. The amount is adjusted to the final year of the reporting period (`YYYY-YYYY`). This is an area statistic, not a rate or an individual property bill. Unsupported, missing and censored estimates are null.

```ts
const place = await parse.postal('28202', { country: 'US', deep: true });
const propertyTax = place.deep?.property_tax;
```

Read `population_period` alongside `population`: a reporting year (`YYYY`) or period (`YYYY-YYYY`), null when unknown or unverifiable. Keep missing or null values unknown and preserve a known zero. These fields belong to full place profiles. State district lists include each district's population and period. Postal nearby and distance detail remains metropolitan associations only. Continent population and its period remain in core.

Point returns the timezone ID with the core location. Its optional deep detail adds terrain and compact nearest-city context on every plan. A nearest city is null when none is within 200 km.

Weather returns current conditions by default. Paid deep adds specialist current measurements, forecasts and related detail. A past `date` is a UTC day and requires deep: it adds `deep.history` alongside current conditions. Date alone does not request history.

```ts
await parse.weather(40.7128, -74.006, { deep: true, date: '2026-08-15' });
```

Tariff starts with the general schedule line. Paid deep adds units and the special and other schedule columns. An optional origin then resolves country-specific measures. The three calls below show those successive choices. Without origin, schedule detail is still returned and origin-dependent fields are null. A null effective rate is not a zero rate.

```ts
await parse.tariff('8471.30.01.00');
await parse.tariff('8471.30.01.00', { deep: true });
await parse.tariff('8471.30.01.00', { deep: true, origin: 'CN' });
```

Address search uses context from the form: prefer postal, or city and state. An optional end-user `ip` is a locality hint for server-side calls. An empty result explains itself with `reason`: `more_input`, `missing_context` or `no_matches`. With suggestions, reason is null. Older responses may omit it, and future reasons remain strings. Catalog and lookup failures use the existing API errors.

HLR reports status at the last check. `live` means assigned and `connected` means reachable at that check. Cached results may be returned. Null means unconfirmed. Deep diagnostics stay within the same metered lookup.

## Deep

Choose enrichment for the question you need answered.

| Operation | What `deep` requests |
|---|---|
| IP | Richer IP fields included with a paid plan. No separate check meter. |
| Domain | Registration dates, registrar, status and DNSSEC, included with a paid plan. Use `dns` for DNS records and `mx` for mail routing. |
| Email | A metered deliverability check, using included email checks or enabled on-demand usage. |
| VAT | A metered registry check where supported, using included VAT checks or enabled on-demand usage. |
| Phone, Time, Date, Currency, Language, Emoji, IBAN, Point | Optional detail in the same pooled request on every plan. |
| Country, State, District, City, Postal | The place profile on paid plans, including demographic and tax facts where held. |
| Name, NAICS | Name evidence or the industry definition profile on paid plans. |
| VIN, NPI, Tariff, Company | The complete product detail bag on paid plans. |
| Weather | Specialist current measurements and the existing forecast, alert, air and history bag on paid plans. |
| Carrier, HLR | Optional diagnostic detail within the same metered core unit, including Free allowance units. No second gate or additional check. |

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

Ordinary lookups retry network failures, 429, and 500/502/503/504 responses twice by default. Carrier, caller, HLR, and email or VAT with `deep: true` make one attempt by default. Address with `deep: true` also uses one attempt, reserving the same behavior for future verification.

An explicit `retries` setting on the client or call overrides those defaults. Another attempt can consume additional usage if the earlier response was lost. Cancellation stops the request and any retry wait. Automatic redirects are disabled.

## Docs

Full field reference for every endpoint: [parseapi.com/docs](https://parseapi.com/docs)

BIN lookup accepts 6-11 digits as a string, including leading zeros. Spaces and hyphens are accepted. `prefix` is the actual longest match and can be shorter than the input. Unknown reference fields are null. `deep` adds an empty object on every plan.


## Optional detail

The default response answers the common task. Ask for `deep` when you need more detail about that same result. Core fields stay equal. City, NAICS and Emoji searches put detail inside each result. Postal nearby and distance put metropolitan detail beside the entity it describes. Time conversion keeps target detail in `to.deep`; only the source has `deep.next_dst`.

```ts
const basic = await parse.time('America/New_York');
const detail = await parse.time('America/New_York', { deep: true });
console.log(basic.at, detail.deep?.next_dst);
```
