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
await parse.name('Andrea', { country: 'IT' });
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

NAICS records include classification `exclusions`, each with a description and linked codes. Generic exclusions can have no linked codes. Omitted or null exclusions in older responses remain unknown. Search results also include `match`: the matched `field` (`name`, `term` or `naics`) and `text`, plus `corrections` with `from` and `to` tokens for typo fallback. Corrections are empty for exact, plural and prefix matches. Direct code lookups omit `match`. Older responses may omit it.

Responses are typed, plain JSON data. `country.states('US')` requests the states directly; it does not fetch a country first. Optional arguments go in the final options object, so new options can be added without changing your existing calls.

DNS uses pooled requests on every plan. Omit `type` to check A, AAAA, CNAME, MX, NS, TXT, SOA, CAA, SRV and PTR. Records contain `name`, `type`, `ttl` in seconds and a DNS presentation `value`. TXT values retain quoting and chunk boundaries. A selected question can include its CNAME chain. Empty records mean no records. Lookup failures remain errors.

## Time

`time` returns local ISO `at` with its UTC offset and integer Unix seconds in `unix`. `offset_seconds` is the exact offset, while `offset_minutes` is whole minutes. Historical offsets and ISO times can include offset seconds. Omitted `at` means now. With `to`, an offsetless `at` is source wall time. Otherwise it is UTC. Include an offset for repeated local times around a clock change. Current time and conversion use pooled requests on every plan. Coordinate clock fields can be null when the timezone is unknown. Existing `timezone` methods remain supported.

## Measurements

```ts
const result = await parse.measure('5 ft 11 in', { to: 'cm' });
const units = await parse.measure.units({ unit: 'm' });
```

`amount` is a decimal string, such as `"180.34"`. Without `to`, the API returns the canonical unit for the measurement type. Pass `locale` for number formatting and `system` (`us` or `imperial`) when a customary unit needs context. Ambiguous input returns `valid: false`, a `reason`, and available `choices`. Invalid or incompatible target units use the normal API error.

Unit discovery accepts optional `query`, `type`, and `unit` filters. `unit` selects compatible targets. Omit the filters for the reviewed catalog. Both operations use pooled requests.

## Deep

Choose enrichment for the question you need answered.

| Operation | What `deep` requests |
|---|---|
| IP | Richer IP fields included with a paid plan. No separate check meter. |
| Email | A metered deliverability check, using included email checks or enabled on-demand usage. |
| VAT | A metered registry check where supported, using included VAT checks or enabled on-demand usage. |
| Phone | An empty object. Number parsing and formats are already in the core response. |

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
