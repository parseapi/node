# parseapi

Official parseAPI client for Node and TypeScript.

```bash
npm install parseapi
```

```ts
import { parseAPI } from 'parseapi';

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
await parse.phone('+14155552671');
await parse.postal('28202', { country: 'US' });
await parse.postal.nearby('28202', { country: 'US', radius: 40 });
await parse.postal.distance('28202', '10001', { country: 'US' });
await parse.city('charlotte', { country: 'US' });
await parse.city.id('city_mb8mbqrkz8zb');
await parse.city.search('char', { country: 'US', limit: 10 });
await parse.city.nearest(35.2271, -80.8431);
await parse.country('US');
await parse.country.states('US');
await parse.state('NC', { country: 'US' });
await parse.state.districts('NC', { country: 'US' });
await parse.district('37081');
await parse.continent('NA');
await parse.continent.countries('NA');
await parse.currency('USD');
await parse.currency.rate('USD', 'EUR');
await parse.language('en');
await parse.timezone('America/New_York');
await parse.holiday('US', { year: 2026 });
await parse.holiday.date('US', '2026-12-25');
await parse.elevation(35.2271, -80.8431);
await parse.point(36.0726, -79.792);
await parse.weather(40.7128, -74.006);
await parse.domain('example.com');
await parse.mx('example.com');
await parse.useragent(uaString);
await parse.emoji('rocket');
await parse.emoji.search('fire');
```

Every response is fully typed.

## Deep

Pass `deep: true` to include the nested `deep` object with richer fields.

```ts
const ip = await parse.ip('52.94.76.10', { deep: true });
ip.deep?.datacenter; // true
```

## Errors

Every non-2xx response throws a `ParseAPIError` with `status`, `code`, `docs`, and `requestId`. Branch on `code`.

```ts
import { ParseAPIError } from 'parseapi';

try {
  await parse.city('atlantis');
} catch (err) {
  if (err instanceof ParseAPIError && err.code === 'not_found') {
    // no such city
  }
}
```

## Options

```ts
const parse = parseAPI('your-api-key', {
  timeoutMs: 10000, // per-attempt timeout
  retries: 2,       // automatic retries on network errors, 429, and 5xx
});
```

Requires Node 18 or later. Zero dependencies.

## Docs

Full field reference for every endpoint: [parseapi.com/docs](https://parseapi.com/docs)
