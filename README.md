# @parseapi/sdk

Official parseAPI client for Node and TypeScript.

```bash
npm install @parseapi/sdk
```

```ts
import { parseAPI } from '@parseapi/sdk';

const parse = parseAPI('your-api-key');
const country = await parse.country('US');
```

Get a key at [parseapi.com](https://parseapi.com). The client also reads `PARSEAPI_KEY` from the environment.

## Calls

One method per endpoint, named after the route.

```ts
await parse.ip('8.8.8.8');
await parse.ip.self();
await parse.email('hello@gmail.com');
await parse.vat('DE136695976');
await parse.iban('DE89370400440532013000');
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
await parse.timezone('America/New_York');
await parse.timezone.at(40.7128, -74.006);
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
await parse.useragent(uaString);
await parse.vin('1HGCM82633A004352');
await parse.tariff('8471.30.01.00');
await parse.tariff.search('sunglasses');
await parse.emoji('rocket');
await parse.emoji.search('fire');
```

Responses are typed, plain JSON data. `country.states('US')` requests the states directly; it does not fetch a country first. Optional arguments go in the final options object, so new options can be added without changing your existing calls.

## Deep

Pass `deep: true` to include the nested `deep` object with richer fields.

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
